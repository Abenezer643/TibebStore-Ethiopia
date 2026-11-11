import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { TenantModel } from "@/models/Tenant";
import mongoose from "mongoose";

// GET - Fetch orders for the authenticated user
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();
    
    const userId = String((auth.user as any)._id);
    
    const orders = await OrderModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: String((o as any)._id),
        userId: String((o as any).userId),
        status: (o as any).status,
        items: (o as any).items?.map((it: any) => ({
          id: String(it.productId),
          productId: String(it.productId),
          productName: it.name,
          productImageUrl: it.images?.[0]?.url || null,
          unitPrice: it.price,
          quantity: it.quantity,
          tenantSlug: it.tenantSlug,
        })),
        subtotal: (o as any).subtotal,
        shippingFee: (o as any).shipping,
        total: (o as any).total,
        createdAt: (o as any).createdAt,
        updatedAt: (o as any).updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as null | {
    tenantSlug?: string;
    items?: Array<{ productId?: string; quantity?: number; tenantSlug?: string; tenantId?: string }>;
  };

  const tenantSlug = body?.tenantSlug?.trim();
  const items = Array.isArray(body?.items) ? body?.items : [];

  if (items.length === 0) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  for (const it of items) {
    if (!it?.productId || typeof it.productId !== "string") {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }
    if (typeof it.quantity !== "number" || it.quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    if (!tenantSlug) {
      const hasTenantId = typeof it?.tenantId === "string" && mongoose.isValidObjectId(it.tenantId);
      const hasTenantSlug = typeof it?.tenantSlug === "string" && Boolean(it.tenantSlug.trim());
      if (!hasTenantId && !hasTenantSlug) {
        return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
      }
    }
  }

  await dbConnect();

  // Group items by tenantId (preferred) or tenantSlug (fallback)
  type TenantKey = { id: string; slug: string };
  const itemsByTenant = new Map<string, { key: TenantKey; items: Array<{ productId: string; quantity: number }> }>();

  for (const it of items) {
    const fallbackSlug = (tenantSlug ?? it.tenantSlug ?? "").trim();
    const explicitTenantId = typeof it.tenantId === "string" && mongoose.isValidObjectId(it.tenantId) ? it.tenantId : null;

    const mapKey = explicitTenantId ? `id:${explicitTenantId}` : `slug:${fallbackSlug}`;
    const existing = itemsByTenant.get(mapKey);
    const next = existing ?? {
      key: { id: explicitTenantId ?? "", slug: fallbackSlug },
      items: [],
    };

    next.items.push({ productId: it.productId as string, quantity: it.quantity as number });
    itemsByTenant.set(mapKey, next);
  }

  const tenantIds = Array.from(itemsByTenant.values())
    .map((v) => v.key.id)
    .filter((id) => mongoose.isValidObjectId(id));
  const tenantSlugs = Array.from(itemsByTenant.values())
    .map((v) => v.key.slug)
    .filter(Boolean);

  if (tenantIds.length === 0 && tenantSlugs.length === 0) {
    return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
  }

  const tenantDocs = await TenantModel.find({
    $or: [{ _id: { $in: tenantIds } }, { slug: { $in: tenantSlugs } }],
  })
    .select({ _id: 1, slug: 1 })
    .lean();

  const tenantById = new Map<string, any>();
  const tenantBySlug = new Map<string, any>();
  for (const t of tenantDocs as any[]) {
    tenantById.set(String(t._id), t);
    tenantBySlug.set(String(t.slug), t);
  }

  // Load all products (across all tenants) once
  const allProductIds = items.flatMap((i) => (i?.productId ? [String(i.productId)] : []));
  const objectIds = allProductIds.filter((id) => mongoose.isValidObjectId(id));
  const slugs = allProductIds.filter((id) => !mongoose.isValidObjectId(id));

  const products = await ProductModel.find({
    $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }],
  }).lean();
  const byKey = new Map<string, any>();
  for (const p of products as any[]) {
    byKey.set(String(p._id), p);
    if (p.slug) byKey.set(String(p.slug), p);
  }

  const createdOrders: any[] = [];

  for (const bucket of Array.from(itemsByTenant.values())) {
    const resolvedTenant = bucket.key.id ? tenantById.get(bucket.key.id) : tenantBySlug.get(bucket.key.slug);
    if (!resolvedTenant) {
      return NextResponse.json(
        { error: bucket.key.id ? `Invalid tenant: ${bucket.key.id}` : `Invalid tenant: ${bucket.key.slug}` },
        { status: 400 }
      );
    }

    const slug = String(resolvedTenant.slug);
    const tenantId = String(resolvedTenant._id);
    const tenantItems = bucket.items;

    const orderItems: any[] = [];
    let subtotal = 0;

    for (const it of tenantItems) {
      const key = it.productId;
      const p = byKey.get(key);
      if (!p) {
        return NextResponse.json({ error: `Product not found: ${key}` }, { status: 400 });
      }
      if (String(p.tenantId) !== tenantId) {
        return NextResponse.json({ error: "Cross-tenant checkout not allowed" }, { status: 400 });
      }

      // Check stock availability
      const productStock = p.stock === null ? null : Number(p.stock);
      if (productStock !== null && productStock < it.quantity) {
        if (productStock === 0) {
          return NextResponse.json({ error: `${p.name} is out of stock` }, { status: 400 });
        }
        return NextResponse.json({ error: `Only ${productStock} available for ${p.name} (requested ${it.quantity})` }, { status: 400 });
      }

      const unitPrice = Number(p.price) || 0;
      subtotal += unitPrice * it.quantity;

      orderItems.push({
        productId: p._id,
        name: p.name,
        price: unitPrice,
        quantity: it.quantity,
        tenantSlug: slug,
        images: p.images ?? [],
      });
    }

    const shipping = 0;
    const tax = 0;
    const total = subtotal + shipping + tax;

    const created = await OrderModel.create({
      userId: (auth.user as any)._id,
      status: "pending",
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      statusHistory: [{
        status: "pending",
        note: "Order placed",
        changedAt: new Date(),
      }],
    });

    // Deduct stock for each item (only for products with finite stock)
    for (const item of orderItems) {
      const productDoc = await ProductModel.findById(item.productId);
      if (productDoc && (productDoc as any).stock !== null && (productDoc as any).stock !== undefined && (productDoc as any).stock > 0) {
        (productDoc as any).stock = Math.max(0, (productDoc as any).stock - item.quantity);
        await productDoc.save();
      }
    }

    createdOrders.push({
      id: String((created as any)._id),
      userId: String((created as any).userId),
      status: (created as any).status,
      items: (created as any).items,
      subtotal: (created as any).subtotal,
      shipping: (created as any).shipping,
      tax: (created as any).tax,
      total: (created as any).total,
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    });
  }

  return NextResponse.json({
    ok: true,
    orders: createdOrders,
  });
}
