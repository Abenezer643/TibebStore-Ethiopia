import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  await dbConnect();
  const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();

  const orders = docs.map((o: any) => ({
    id: String(o._id),
    userId: String(o.userId),
    status: o.status,
    items: o.items ?? [],
    subtotal: o.subtotal,
    shipping: o.shipping,
    tax: o.tax,
    total: o.total,
    paymentStatus: o.paymentStatus || "pending",
    paymentMethod: o.paymentMethod || null,
    paymentRef: o.paymentRef || null,
    releaseStatus: o.releaseStatus || null,
    commissionRate: o.commissionRate || 0,
    platformFee: o.platformFee || 0,
    sellerEarnings: o.sellerEarnings || 0,
    autoRefundAt: o.autoRefundAt || null,
    autoReleaseAt: o.autoReleaseAt || null,
    releasedAt: o.releasedAt || null,
    refundedAt: o.refundedAt || null,
    trackingNumber: o.trackingNumber || null,
    carrier: o.carrier || null,
    shippedAt: o.shippedAt || null,
    deliveredAt: o.deliveredAt || null,
    cancelReason: o.cancelReason || null,
    statusHistory: o.statusHistory ?? [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));

  return NextResponse.json({ orders });
}
