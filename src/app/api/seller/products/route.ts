import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireApprovedSeller } from "@/lib/requireAuth";
import { TenantModel } from "@/models/Tenant";
import { ProductModel } from "@/models/Product";

export async function GET(request: Request) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  await dbConnect();

  const tenant = await TenantModel.findOne({ ownerId: String((auth.user as any)._id) })
    .select({ _id: 1, slug: 1 })
    .lean();
  if (!tenant) {
    return NextResponse.json({ products: [] });
  }

  const docs = await ProductModel.find({ tenantId: String((tenant as any)._id) })
    .sort({ createdAt: -1 })
    .lean();

  const products = docs.map((p: any) => ({
    id: String(p._id),
    tenantId: String(p.tenantId),
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    category: p.category,
    images: p.images,
    materials: p.materials,
    craftRegion: p.craftRegion,
    refundPolicy: p.refundPolicy,
    stock: p.stock ?? null,
    isArchived: !!p.isArchived,
    isPrivate: !!p.isPrivate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return NextResponse.json({ products, tenantSlug: String((tenant as any).slug) });
}
