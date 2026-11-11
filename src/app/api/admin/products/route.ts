import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { ProductModel } from "@/models/Product";
import { TenantModel } from "@/models/Tenant";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  await dbConnect();

  const docs = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
  const tenantIds = Array.from(new Set(docs.map((p: any) => String(p.tenantId)).filter(Boolean)));

  const tenants = await TenantModel.find({ _id: { $in: tenantIds } })
    .select({ _id: 1, name: 1 })
    .lean();
  const tenantNameById = new Map<string, string>(tenants.map((t: any) => [String(t._id), String(t.name)]));

  const products = docs.map((p: any) => ({
    id: String(p._id),
    tenantId: String(p.tenantId),
    tenantName: tenantNameById.get(String(p.tenantId)) ?? "Unknown",
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    category: p.category,
    images: p.images,
    materials: p.materials,
    craftRegion: p.craftRegion,
    refundPolicy: p.refundPolicy,
    isArchived: !!p.isArchived,
    isPrivate: !!p.isPrivate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return NextResponse.json({ products });
}
