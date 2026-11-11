import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { ProductModel } from "@/models/Product";
import mongoose from "mongoose";

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  const { id } = await Promise.resolve(params);
  const body = (await request.json().catch(() => null)) as null | { isArchived?: boolean; isPrivate?: boolean };

  const patch: Record<string, any> = {};
  if (typeof body?.isArchived === "boolean") patch.isArchived = body.isArchived;
  if (typeof body?.isPrivate === "boolean") patch.isPrivate = body.isPrivate;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await dbConnect();

  const filter = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
  const updated = await ProductModel.findOneAndUpdate(filter, { $set: patch }, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    product: {
      id: String((updated as any)._id),
      tenantId: String((updated as any).tenantId),
      name: (updated as any).name,
      slug: (updated as any).slug,
      description: (updated as any).description,
      price: (updated as any).price,
      category: (updated as any).category,
      images: (updated as any).images,
      materials: (updated as any).materials,
      craftRegion: (updated as any).craftRegion,
      refundPolicy: (updated as any).refundPolicy,
      isArchived: !!(updated as any).isArchived,
      isPrivate: !!(updated as any).isPrivate,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    },
  });
}
