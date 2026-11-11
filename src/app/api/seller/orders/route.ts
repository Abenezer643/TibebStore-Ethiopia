import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireApprovedSeller } from "@/lib/requireAuth";
import { TenantModel } from "@/models/Tenant";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  await dbConnect();

  const tenant = await TenantModel.findOne({ ownerId: String((auth.user as any)._id) })
    .select({ _id: 1, slug: 1 })
    .lean();
  
  if (!tenant) {
    return NextResponse.json({ orders: [] });
  }

  const tenantSlug = String((tenant as any).slug);
  
  // Use case-insensitive regex to match tenantSlug
  const docs = await OrderModel.find({ 
    "items.tenantSlug": { $regex: new RegExp(`^${tenantSlug}$`, 'i') }
  }).sort({ createdAt: -1 }).lean();

  // Get unique buyer IDs
  const buyerIds = [...new Set(docs.map((o: any) => String(o.userId)))];
  const buyers = await UserModel.find({ _id: { $in: buyerIds } })
    .select({ _id: 1, username: 1, email: 1 })
    .lean();
  const buyerMap = new Map(buyers.map((b: any) => [String(b._id), b]));

  const orders = docs.map((o: any) => {
    const buyer = buyerMap.get(String(o.userId));
    return {
      id: String(o._id),
      userId: String(o.userId),
      status: o.status,
      items: (o.items ?? []).map((it: any) => ({
        productId: String(it.productId),
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        tenantSlug: it.tenantSlug,
        images: it.images ?? [],
      })),
      subtotal: o.subtotal,
      shipping: o.shipping,
      tax: o.tax,
      total: o.total,
      // Tracking info
      trackingNumber: o.trackingNumber || null,
      carrier: o.carrier || null,
      shippedAt: o.shippedAt || null,
      deliveredAt: o.deliveredAt || null,
      // Status history
      statusHistory: (o.statusHistory ?? []).map((h: any) => ({
        status: h.status,
        note: h.note || null,
        changedAt: h.changedAt,
      })),
      // Notes
      sellerNotes: o.sellerNotes || null,
      cancelReason: o.cancelReason || null,
      // Escrow & Commission
      releaseStatus: o.releaseStatus || null,
      commissionRate: o.commissionRate || 0,
      platformFee: o.platformFee || 0,
      sellerEarnings: o.sellerEarnings || 0,
      autoRefundAt: o.autoRefundAt || null,
      // Buyer info
      buyerName: buyer?.username || null,
      buyerEmail: buyer?.email || null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  });

  return NextResponse.json({ orders, tenantSlug });
}
