import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { TenantModel } from "@/models/Tenant";

export async function GET(request: Request) {
  try {
    await dbConnect();

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId");
  const tenantSlug = url.searchParams.get("tenantSlug");
  const includeArchived = url.searchParams.get("includeArchived") === "true";
  const includePrivate = url.searchParams.get("includePrivate") === "true";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 0;

  const filter: Record<string, any> = {};
  if (tenantId) filter.tenantId = tenantId;

  if (!includeArchived) filter.isArchived = { $ne: true };
  if (!includePrivate) filter.isPrivate = { $ne: true };

  // tenantSlug filtering requires a join; keep API simple for now.
  if (tenantSlug) {
    return NextResponse.json(
      { error: "tenantSlug filter not supported; use tenantId" },
      { status: 400 }
    );
  }

  let query = ProductModel.find(filter).sort({ createdAt: -1 });
  if (limit > 0) query = query.limit(limit);
  const docs = await query.lean();

  const tenantIds = Array.from(
    new Set(docs.map((p) => String((p as any).tenantId)).filter(Boolean))
  );
  const tenantDocs = await TenantModel.find({ _id: { $in: tenantIds } })
    .select({ _id: 1, slug: 1, name: 1 })
    .lean();
  const tenantById = new Map<string, { slug: string; name: string }>();
  for (const t of tenantDocs as any[]) {
    tenantById.set(String((t as any)._id), { slug: String((t as any).slug), name: String((t as any).name) });
  }

  const products = docs.map((p) => ({
    tenantSlug: tenantById.get(String((p as any).tenantId))?.slug,
    tenantName: tenantById.get(String((p as any).tenantId))?.name,
    id: String((p as any)._id),
    tenantId: String((p as any).tenantId),
    name: (p as any).name,
    slug: (p as any).slug,
    description: (p as any).description,
    price: (p as any).price,
    category: (p as any).category,
    images: (p as any).images,
    materials: (p as any).materials,
    craftRegion: (p as any).craftRegion,
    refundPolicy: (p as any).refundPolicy,
    stock: (p as any).stock ?? null,
    isArchived: !!(p as any).isArchived,
    isPrivate: !!(p as any).isPrivate,
    createdAt: (p as any).createdAt,
    updatedAt: (p as any).updatedAt,
  }));

  return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
