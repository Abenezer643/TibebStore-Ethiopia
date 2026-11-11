import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { TenantModel } from "@/models/Tenant";
import { TransactionModel } from "@/models/Transaction";
import mongoose from "mongoose";

const VALID_STATUSES = new Set(["processing", "shipped", "delivered", "cancelled"]);

export async function GET(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  const { id } = await Promise.resolve(params);
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await dbConnect();

  const order = await OrderModel.findById(id).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const o = order as any;

  // Get buyer info
  const buyer = await UserModel.findById(o.userId).select({ _id: 1, username: 1, email: 1 }).lean();

  // Get seller/tenant info from first item
  const tenantSlug = o.items?.[0]?.tenantSlug;
  const tenant = tenantSlug ? await TenantModel.findOne({ slug: tenantSlug }).lean() : null;

  // Get transactions for this order
  const transactions = await TransactionModel.find({ orderId: o._id }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    order: {
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
    },
    buyer: buyer ? { id: String((buyer as any)._id), username: (buyer as any).username, email: (buyer as any).email } : null,
    tenant: tenant ? { id: String((tenant as any)._id), name: (tenant as any).name, slug: (tenant as any).slug, payoutMethod: (tenant as any).payoutMethod, payoutAccount: (tenant as any).payoutAccount } : null,
    transactions: transactions.map((t: any) => ({
      id: String(t._id),
      type: t.type,
      amount: t.amount,
      status: t.status,
      description: t.description,
      transactionRef: t.transactionRef || null,
      processedAt: t.processedAt || null,
      createdAt: t.createdAt,
    })),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  const { id } = await Promise.resolve(params);
  const body = (await request.json().catch(() => null)) as null | { status?: string };

  const status = body?.status;
  if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await dbConnect();
  const updated = await OrderModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    order: {
      id: String((updated as any)._id),
      userId: String((updated as any).userId),
      status: (updated as any).status,
      items: (updated as any).items ?? [],
      subtotal: (updated as any).subtotal,
      shipping: (updated as any).shipping,
      tax: (updated as any).tax,
      total: (updated as any).total,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    },
  });
}
