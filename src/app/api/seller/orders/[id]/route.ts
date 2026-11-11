import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireApprovedSeller } from "@/lib/requireAuth";
import { TenantModel } from "@/models/Tenant";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { sendEmail, orderShippedEmail, orderDeliveredEmail } from "@/lib/email";

// PATCH - Update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, trackingNumber, carrier, note } = body;

  // Validate status — sellers can only go up to shipped; only buyer confirms delivery
  const validStatuses = ["confirmed", "processing", "shipped", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    if (status === "delivered") {
      return NextResponse.json({ error: "Only the buyer can confirm delivery" }, { status: 403 });
    }
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await dbConnect();

  // Verify seller owns this order (via tenant slug in items)
  const tenant = await TenantModel.findOne({ ownerId: String((auth.user as any)._id) })
    .select({ _id: 1, slug: 1 })
    .lean();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const tenantSlug = String((tenant as any).slug);
  const order = await OrderModel.findOne({
    _id: id,
    "items.tenantSlug": tenantSlug,
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Update status
  const previousStatus = order.status;
  order.status = status;

  // Add to status history
  (order as any).statusHistory = (order as any).statusHistory || [];
  (order as any).statusHistory.push({
    status,
    note: note || `Status changed from ${previousStatus} to ${status}`,
    changedBy: (auth.user as any)._id,
    changedAt: new Date(),
  });

  // Handle tracking info when shipped
  if (status === "shipped") {
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    order.shippedAt = new Date();
  }

  // Delivered is handled by buyer via /api/orders/[id]/status action=confirm_delivery

  // Handle cancelled
  if (status === "cancelled" && note) {
    order.cancelReason = note;
  }

  await order.save();

  // Send email notifications
  try {
    const user = await UserModel.findById((order as any).userId).lean();
    if (user && (user as any).email) {
      if (status === "shipped") {
        await sendEmail({
          to: (user as any).email,
          subject: `Your Order Has Shipped - #${String(order._id).slice(-6).toUpperCase()}`,
          html: orderShippedEmail({
            id: String(order._id),
            trackingNumber: order.trackingNumber || undefined,
            carrier: order.carrier || undefined,
          }),
        });
        console.log("[Order] Shipped email sent");
      } else if (status === "delivered") {
        await sendEmail({
          to: (user as any).email,
          subject: `Your Order Has Been Delivered - #${String(order._id).slice(-6).toUpperCase()}`,
          html: orderDeliveredEmail({
            id: String(order._id),
          }),
        });
        console.log("[Order] Delivered email sent");
      }
    }
  } catch (emailError) {
    console.error("[Order] Failed to send email:", emailError);
    // Don't fail the request if email fails
  }

  return NextResponse.json({
    ok: true,
    order: {
      id: String(order._id),
      status: order.status,
      trackingNumber: order.trackingNumber || null,
      carrier: order.carrier || null,
      shippedAt: order.shippedAt || null,
      deliveredAt: order.deliveredAt || null,
      statusHistory: (order as any).statusHistory,
    },
  });
}
