import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";
import { TenantModel } from "@/models/Tenant";
import { setShippedDeadline, releaseFundsToSeller, refundBuyer } from "@/lib/escrow";

// PATCH - Update order status (seller marks shipped, buyer confirms delivery)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { action, trackingNumber, carrier, note } = body;

    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userId = String((auth.user as any)._id);
    const userRole = (auth.user as any).role;

    // Check authorization based on action
    if (action === "ship") {
      // Only seller can mark as shipped
      const tenant = await TenantModel.findOne({ ownerId: userId });
      if (!tenant) {
        return NextResponse.json({ error: "Seller store not found" }, { status: 403 });
      }

      // Verify order contains items from this seller
      const sellerSlug = (tenant as any).slug;
      const hasSellerItems = (order as any).items?.some(
        (item: any) => item.tenantSlug === sellerSlug
      );

      if (!hasSellerItems && userRole !== "super-admin") {
        return NextResponse.json({ error: "Not authorized to update this order" }, { status: 403 });
      }

      if ((order as any).status !== "confirmed" && (order as any).status !== "processing") {
        return NextResponse.json({ 
          error: "Order must be confirmed before shipping" 
        }, { status: 400 });
      }

      // Update order
      (order as any).status = "shipped";
      (order as any).trackingNumber = trackingNumber || (order as any).trackingNumber;
      (order as any).carrier = carrier || (order as any).carrier;
      (order as any).shippedAt = new Date();
      (order as any).statusHistory.push({
        status: "shipped",
        note: note || `Shipped via ${carrier || "carrier"}`,
        changedBy: userId,
        changedAt: new Date(),
      });

      // Set delivery deadline for escrow
      setShippedDeadline(order, tenant);

      await (order as any).save();

      return NextResponse.json({
        ok: true,
        message: "Order marked as shipped",
        order: {
          id: String((order as any)._id),
          status: (order as any).status,
          trackingNumber: (order as any).trackingNumber,
          carrier: (order as any).carrier,
          shippedAt: (order as any).shippedAt,
          autoRefundAt: (order as any).autoRefundAt,
        },
      });

    } else if (action === "confirm_delivery") {
      // Only buyer can confirm delivery
      if (String((order as any).userId) !== userId && userRole !== "super-admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      if ((order as any).status !== "shipped") {
        return NextResponse.json({ 
          error: "Order must be shipped before confirming delivery" 
        }, { status: 400 });
      }

      // Update order
      (order as any).status = "delivered";
      (order as any).deliveredAt = new Date();
      (order as any).statusHistory.push({
        status: "delivered",
        note: note || "Delivery confirmed by buyer",
        changedBy: userId,
        changedAt: new Date(),
      });

      await (order as any).save();

      // Auto-release funds to seller on delivery
      let releaseResult = null;
      if ((order as any).paymentStatus === "paid" && (order as any).releaseStatus === "held") {
        try {
          releaseResult = await releaseFundsToSeller(order);
        } catch (releaseErr) {
          console.error("[Escrow] Auto-release failed:", releaseErr);
          // Don't fail the delivery confirmation if release fails
        }
      }

      return NextResponse.json({
        ok: true,
        message: "Delivery confirmed" + (releaseResult?.released ? " — funds released to seller" : ""),
        order: {
          id: String((order as any)._id),
          status: (order as any).status,
          deliveredAt: (order as any).deliveredAt,
          releaseStatus: (order as any).releaseStatus,
          sellerEarnings: (order as any).sellerEarnings,
          platformFee: (order as any).platformFee,
        },
      });

    } else if (action === "cancel") {
      // Buyer or seller can cancel (if not shipped yet)
      const isBuyer = String((order as any).userId) === userId;
      const tenant = await TenantModel.findOne({ ownerId: userId });
      const isSeller = tenant && (order as any).items?.some(
        (item: any) => item.tenantSlug === (tenant as any).slug
      );

      if (!isBuyer && !isSeller && userRole !== "super-admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      if ((order as any).status === "shipped" || (order as any).status === "delivered") {
        return NextResponse.json({ 
          error: "Cannot cancel shipped or delivered orders" 
        }, { status: 400 });
      }

      // Auto-refund buyer if payment was made and funds are still held
      if ((order as any).paymentStatus === "paid" && (order as any).releaseStatus === "held") {
        try {
          await refundBuyer(order, note || "Order cancelled");
        } catch (refundErr) {
          console.error("[Escrow] Auto-refund on cancel failed:", refundErr);
          // Continue with cancellation even if refund fails
        }
      } else {
        // No payment to refund, just cancel
        (order as any).status = "cancelled";
        (order as any).cancelReason = note || "Cancelled by user";
        (order as any).statusHistory.push({
          status: "cancelled",
          note: note || "Order cancelled",
          changedBy: userId,
          changedAt: new Date(),
        });
        await (order as any).save();
      }

      return NextResponse.json({
        ok: true,
        message: "Order cancelled" + ((order as any).releaseStatus === "refunded" ? " — buyer refunded" : ""),
        order: {
          id: String((order as any)._id),
          status: (order as any).status,
          releaseStatus: (order as any).releaseStatus,
        },
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
