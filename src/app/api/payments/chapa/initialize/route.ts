import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { getChapaService, ChapaService } from "@/lib/chapa";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get the order
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify the order belongs to the user
    if (String((order as any).userId) !== String((auth.user as any)._id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if order is already paid
    if ((order as any).paymentStatus === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    // Get user details
    const user = await UserModel.findById((auth.user as any)._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate transaction reference
    const txRef = ChapaService.generateTxRef(`ORDER-${orderId.slice(-6)}`);

    // Create payment request
    const paymentData = {
      amount: String((order as any).total),
      currency: "ETB",
      email: user.email,
      first_name: user.username.split(" ")[0] || "Customer",
      last_name: user.username.split(" ").slice(1).join(" ") || "Customer",
      tx_ref: txRef,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://tibeb-store.vercel.app"}/api/payments/chapa/webhook`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://tibeb-store.vercel.app"}/api/payments/chapa/webhook?tx_ref=${txRef}&orderId=${orderId}`,
      customization: {
        title: "Tibeb Store",
        description: `Payment for Order ${orderId.slice(-6)}`,
        logo: "https://tibeb-store.vercel.app/favicon.ico",
      },
    };

    // Initialize payment with Chapa
    const result = await getChapaService().initializePayment(paymentData);

    // Save tx_ref to order
    (order as any).paymentRef = txRef;
    (order as any).paymentMethod = "chapa";
    await (order as any).save();

    return NextResponse.json({
      ok: true,
      checkoutUrl: result.data.checkout_url,
      txRef,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize payment";
    console.error("[Chapa Initialize Error]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
