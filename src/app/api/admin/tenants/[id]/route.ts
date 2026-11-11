import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { TenantModel } from "@/models/Tenant";
import mongoose from "mongoose";

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  const { id } = await Promise.resolve(params);
  const body = (await request.json().catch(() => null)) as null | { isDisabled?: boolean };

  if (typeof body?.isDisabled !== "boolean") {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await dbConnect();

  const filter = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };
  const updated = await TenantModel.findOneAndUpdate(
    filter,
    { $set: { isDisabled: body.isDisabled } },
    { new: true }
  ).lean();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    tenant: {
      id: String((updated as any)._id),
      name: (updated as any).name,
      slug: (updated as any).slug,
      description: (updated as any).description ?? "",
      ownerId: (updated as any).ownerId,
      stripeAccountId: (updated as any).stripeAccountId,
      stripeDetailsSubmitted: !!(updated as any).stripeDetailsSubmitted,
      isDisabled: !!(updated as any).isDisabled,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    },
  });
}
