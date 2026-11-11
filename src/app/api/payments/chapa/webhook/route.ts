import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { TenantModel } from "@/models/Tenant";
import { TransactionModel } from "@/models/Transaction";
import { getChapaService } from "@/lib/chapa";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";
import { calculateCommission, setEscrowDeadlines } from "@/lib/escrow";

// Webhook handler for Chapa payment callbacks
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    // Extract transaction reference from webhook
    const txRef = body.tx_ref || body.trx_ref;

    if (!txRef) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    // Verify the payment with Chapa
    const verification = await getChapaService().verifyPayment(txRef);

    if (verification.status === "success" && verification.data.status === "success") {
      // Find the order by payment reference
      const order = await OrderModel.findOne({ paymentRef: txRef });

      if (!order) {
        console.error("[Chapa Webhook] Order not found for txRef:", txRef);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Update order payment status
      (order as any).paymentStatus = "paid";
      (order as any).paymentVerifiedAt = new Date();
      (order as any).paymentDetails = {
        chapaId: verification.data.id,
        amount: verification.data.amount,
        currency: verification.data.currency,
        email: verification.data.email,
      };

      // Calculate commission and set escrow deadlines
      const tenantSlug = (order as any).items?.[0]?.tenantSlug;
      const tenant = tenantSlug ? await TenantModel.findOne({ slug: tenantSlug }).lean() : null;
      const commission = calculateCommission((order as any).total, (tenant as any)?.commissionRate);
      (order as any).commissionRate = commission.rate;
      (order as any).platformFee = commission.platformFee;
      (order as any).sellerEarnings = commission.sellerEarnings;
      (order as any).releaseStatus = "held";
      setEscrowDeadlines(order, tenant);

      // Create payment transaction record
      await TransactionModel.create({
        orderId: (order as any)._id,
        type: "payment",
        amount: (order as any).total,
        currency: "ETB",
        status: "completed",
        fromUserId: (order as any).userId,
        description: `Buyer payment for order ${String((order as any)._id).slice(-6).toUpperCase()}`,
        transactionRef: txRef,
        providerRef: verification.data.id,
        processedAt: new Date(),
      });

      // Update order status from pending to confirmed if still pending
      if ((order as any).status === "pending") {
        (order as any).status = "confirmed";
        (order as any).statusHistory.push({
          status: "confirmed",
          note: "Payment confirmed via Chapa — funds held in escrow",
          changedAt: new Date(),
        });
      }

      await (order as any).save();

      // Send order confirmation email
      try {
        const user = await UserModel.findById((order as any).userId).lean();
        if (user && (user as any).email) {
          await sendEmail({
            to: (user as any).email,
            subject: `Order Confirmed - #${String((order as any)._id).slice(-6).toUpperCase()}`,
            html: orderConfirmationEmail({
              id: String((order as any)._id),
              total: (order as any).total,
              items: (order as any).items?.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })) || [],
            }),
          });
          console.log("[Chapa Webhook] Order confirmation email sent");
        }
      } catch (emailError) {
        console.error("[Chapa Webhook] Failed to send email:", emailError);
        // Don't fail the webhook if email fails
      }

      console.log("[Chapa Webhook] Payment confirmed for order:", String((order as any)._id));

      return NextResponse.json({ ok: true, message: "Payment confirmed" });
    } else {
      // Payment failed
      const order = await OrderModel.findOne({ paymentRef: txRef });
      if (order) {
        (order as any).paymentStatus = "failed";
        await (order as any).save();
      }

      return NextResponse.json({ ok: false, message: "Payment verification failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Chapa Webhook Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// GET handler for return URL redirect verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get("tx_ref");
  const orderId = searchParams.get("orderId");

  if (!txRef) {
    return NextResponse.redirect(
      new URL("/checkout/failed?error=missing_reference", request.url)
    );
  }

  try {
    await dbConnect();

    // Verify payment
    const verification = await getChapaService().verifyPayment(txRef);

    if (verification.status === "success" && verification.data.status === "success") {
      // Update order
      const order = await OrderModel.findOne({ paymentRef: txRef });
      if (order) {
        if ((order as any).paymentStatus !== "paid") {
          (order as any).paymentStatus = "paid";
          (order as any).paymentVerifiedAt = new Date();

          // Calculate commission and set escrow deadlines
          const tenantSlug = (order as any).items?.[0]?.tenantSlug;
          const tenant = tenantSlug ? await TenantModel.findOne({ slug: tenantSlug }).lean() : null;
          const commission = calculateCommission((order as any).total, (tenant as any)?.commissionRate);
          (order as any).commissionRate = commission.rate;
          (order as any).platformFee = commission.platformFee;
          (order as any).sellerEarnings = commission.sellerEarnings;
          (order as any).releaseStatus = "held";
          setEscrowDeadlines(order, tenant);

          if ((order as any).status === "pending") {
            (order as any).status = "confirmed";
            (order as any).statusHistory.push({
              status: "confirmed",
              note: "Payment confirmed via Chapa — funds held in escrow",
              changedAt: new Date(),
            });
          }
          await (order as any).save();
        }
      }

      return NextResponse.redirect(
        new URL(`/checkout/success?orderId=${orderId}`, request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL(`/checkout/failed?orderId=${orderId}`, request.url)
      );
    }
  } catch (error) {
    console.error("[Chapa Return Error]", error);
    return NextResponse.redirect(
      new URL("/checkout/failed?error=verification_failed", request.url)
    );
  }
}
