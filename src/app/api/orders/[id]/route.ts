import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await dbConnect();

    const userId = String((auth.user as any)._id);
    const order = await OrderModel.findOne({ _id: id, userId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    return NextResponse.json({
      ok: true,
      order: {
        id: String(order._id),
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;

    await dbConnect();

    const userId = String((auth.user as any)._id);
    const order = await OrderModel.findOne({ _id: id, userId }).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: String((order as any)._id),
        userId: String((order as any).userId),
        status: (order as any).status,
        items: (order as any).items?.map((it: any) => ({
          id: String(it.productId),
          productId: String(it.productId),
          name: it.name,
          productName: it.name,
          price: it.price,
          unitPrice: it.price,
          quantity: it.quantity,
          tenantSlug: it.tenantSlug,
          images: it.images ?? [],
          productImageUrl: it.images?.[0]?.url || null,
        })),
        subtotal: (order as any).subtotal,
        shipping: (order as any).shipping,
        shippingFee: (order as any).shipping,
        tax: (order as any).tax,
        total: (order as any).total,
        paymentStatus: (order as any).paymentStatus || "pending",
        paymentMethod: (order as any).paymentMethod || null,
        paymentRef: (order as any).paymentRef || null,
        trackingNumber: (order as any).trackingNumber || null,
        carrier: (order as any).carrier || null,
        shippedAt: (order as any).shippedAt || null,
        deliveredAt: (order as any).deliveredAt || null,
        releaseStatus: (order as any).releaseStatus || null,
        commissionRate: (order as any).commissionRate || 0,
        platformFee: (order as any).platformFee || 0,
        sellerEarnings: (order as any).sellerEarnings || 0,
        autoRefundAt: (order as any).autoRefundAt || null,
        statusHistory: (order as any).statusHistory ?? [],
        createdAt: (order as any).createdAt,
        updatedAt: (order as any).updatedAt,
      },
    });
  } catch (error) {
    console.error("Fetch order error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
