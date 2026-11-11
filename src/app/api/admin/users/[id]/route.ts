import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { UserModel } from "@/models/User";
import mongoose from "mongoose";

const VALID_ROLES = new Set(["user", "seller", "super-admin"]);
const VALID_SELLER_STATUSES = new Set(["none", "pending", "approved", "rejected"]);

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  const { id } = await Promise.resolve(params);
  const body = (await request.json().catch(() => null)) as null | {
    role?: string;
    sellerStatus?: string;
    isSuspended?: boolean;
  };

  const patch: Record<string, any> = {};
  if (typeof body?.isSuspended === "boolean") patch.isSuspended = body.isSuspended;
  if (typeof body?.role === "string" && VALID_ROLES.has(body.role)) patch.role = body.role;
  if (typeof body?.sellerStatus === "string" && VALID_SELLER_STATUSES.has(body.sellerStatus)) {
    patch.sellerStatus = body.sellerStatus;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await dbConnect();
  const filter = mongoose.isValidObjectId(id) ? { _id: id } : { email: id };
  const updated = await UserModel.findOneAndUpdate(filter, { $set: patch }, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: String((updated as any)._id),
      email: (updated as any).email,
      username: (updated as any).username,
      role: (updated as any).role,
      sellerStatus: (updated as any).sellerStatus,
      isSuspended: !!(updated as any).isSuspended,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    },
  });
}
