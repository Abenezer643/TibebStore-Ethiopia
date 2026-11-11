import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { TenantModel } from "@/models/Tenant";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  await dbConnect();
  const resolved = await Promise.resolve(params);
  const raw = resolved.slug;
  const decoded = decodeURIComponent(raw);
  const normalized = decoded.trim().toLowerCase();

  const doc = await ProductModel.findOne({ slug: normalized }).lean();
  if (!doc) {
    const byOriginal = await ProductModel.findOne({ slug: raw }).lean();
    if (byOriginal) {
      const tenantDoc = await TenantModel.findById((byOriginal as any).tenantId)
        .select({ _id: 1, slug: 1, name: 1 })
        .lean()
        .catch(() => null);
      const product = {
        tenantSlug: tenantDoc ? String((tenantDoc as any).slug) : undefined,
        tenantName: tenantDoc ? String((tenantDoc as any).name) : undefined,
        id: String((byOriginal as any)._id),
        tenantId: String((byOriginal as any).tenantId),
        name: (byOriginal as any).name,
        slug: (byOriginal as any).slug,
        description: (byOriginal as any).description,
        price: (byOriginal as any).price,
        category: (byOriginal as any).category,
        images: (byOriginal as any).images,
        materials: (byOriginal as any).materials,
        craftRegion: (byOriginal as any).craftRegion,
        refundPolicy: (byOriginal as any).refundPolicy,
        stock: (byOriginal as any).stock ?? null,
        isArchived: !!(byOriginal as any).isArchived,
        isPrivate: !!(byOriginal as any).isPrivate,
        createdAt: (byOriginal as any).createdAt,
        updatedAt: (byOriginal as any).updatedAt,
      };
      return NextResponse.json({ product });
    }

    // fallback: allow lookup by Mongo _id
    const byId = await ProductModel.findById(raw).lean().catch(() => null);
    if (!byId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const tenantDoc = await TenantModel.findById((byId as any).tenantId)
      .select({ _id: 1, slug: 1, name: 1 })
      .lean()
      .catch(() => null);
    const product = {
      tenantSlug: tenantDoc ? String((tenantDoc as any).slug) : undefined,
      tenantName: tenantDoc ? String((tenantDoc as any).name) : undefined,
      id: String((byId as any)._id),
      tenantId: String((byId as any).tenantId),
      name: (byId as any).name,
      slug: (byId as any).slug,
      description: (byId as any).description,
      price: (byId as any).price,
      category: (byId as any).category,
      images: (byId as any).images,
      materials: (byId as any).materials,
      craftRegion: (byId as any).craftRegion,
      refundPolicy: (byId as any).refundPolicy,
      stock: (byId as any).stock ?? null,
      isArchived: !!(byId as any).isArchived,
      isPrivate: !!(byId as any).isPrivate,
      createdAt: (byId as any).createdAt,
      updatedAt: (byId as any).updatedAt,
    };
    return NextResponse.json({ product });
  }

  const tenantDoc = await TenantModel.findById((doc as any).tenantId)
    .select({ _id: 1, slug: 1, name: 1 })
    .lean()
    .catch(() => null);
  const product = {
    tenantSlug: tenantDoc ? String((tenantDoc as any).slug) : undefined,
    tenantName: tenantDoc ? String((tenantDoc as any).name) : undefined,
    id: String((doc as any)._id),
    tenantId: String((doc as any).tenantId),
    name: (doc as any).name,
    slug: (doc as any).slug,
    description: (doc as any).description,
    price: (doc as any).price,
    category: (doc as any).category,
    images: (doc as any).images,
    materials: (doc as any).materials,
    craftRegion: (doc as any).craftRegion,
    refundPolicy: (doc as any).refundPolicy,
    stock: (doc as any).stock ?? null,
    isArchived: !!(doc as any).isArchived,
    isPrivate: !!(doc as any).isPrivate,
    createdAt: (doc as any).createdAt,
    updatedAt: (doc as any).updatedAt,
  };

  return NextResponse.json({ product });
}
