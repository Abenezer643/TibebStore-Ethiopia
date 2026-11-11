import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { DisputeModel } from "@/models/Dispute";
import { OrderModel } from "@/models/Order";
import { TenantModel } from "@/models/Tenant";

// GET - List disputes (buyer sees their own, seller sees disputes on their orders)
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    const userId = String((auth.user as any)._id);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "buyer";

    let disputes;

    if (role === "seller" || (auth.user as any).role === "seller") {
      // Find seller's tenant
      const tenant = await TenantModel.findOne({ ownerId: userId }).lean();
      if (!tenant) {
        return NextResponse.json({ disputes: [] });
      }

      // Find disputes where seller is involved
      disputes = await DisputeModel.find({ sellerId: userId })
        .populate("userId", "username email")
        .populate("orderId", "status total")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Buyer sees their own disputes
      disputes = await DisputeModel.find({ userId })
        .populate("sellerId", "username")
        .populate("orderId", "status total")
        .sort({ createdAt: -1 })
        .lean();
    }

    return NextResponse.json({
      disputes: disputes.map((d: any) => ({
        id: String(d._id),
        orderId: String(d.orderId?._id || d.orderId),
        reason: d.reason,
        description: d.description,
        status: d.status,
        resolution: d.resolution,
        images: d.images,
        createdAt: d.createdAt,
        user: d.userId,
        seller: d.sellerId,
      })),
    });
  } catch (error) {
    console.error("Fetch disputes error:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

// POST - Create a dispute
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    const userId = String((auth.user as any)._id);
    const body = await request.json();
    const { orderId, reason, description, images } = body;

    if (!orderId || !reason || !description) {
      return NextResponse.json({ 
        error: "Order ID, reason, and description are required" 
      }, { status: 400 });
    }

    // Verify order belongs to user
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (String((order as any).userId) !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get seller ID from order's first item's tenant
    const tenantSlug = (order as any).items?.[0]?.tenantSlug;
    const tenant = await TenantModel.findOne({ slug: tenantSlug }).lean();
    const sellerId = tenant ? String((tenant as any).ownerId) : null;

    if (!sellerId) {
      return NextResponse.json({ error: "Could not find seller" }, { status: 400 });
    }

    // Check if dispute already exists
    const existing = await DisputeModel.findOne({ orderId, userId });
    if (existing) {
      return NextResponse.json({ error: "Dispute already exists for this order" }, { status: 400 });
    }

    const dispute = await DisputeModel.create({
      orderId,
      userId,
      sellerId,
      reason,
      description,
      images: images || [],
    });

    return NextResponse.json({
      ok: true,
      dispute: {
        id: String(dispute._id),
        orderId: String(dispute.orderId),
        reason: dispute.reason,
        status: dispute.status,
        createdAt: dispute.createdAt,
      },
    });
  } catch (error) {
    console.error("Create dispute error:", error);
    return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
  }
}
