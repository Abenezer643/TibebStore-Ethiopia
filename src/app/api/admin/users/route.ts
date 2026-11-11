import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  await dbConnect();
  const docs = await UserModel.find({}).sort({ createdAt: -1 }).lean();

  const users = docs.map((u: any) => ({
    id: String(u._id),
    email: u.email,
    username: u.username,
    role: u.role,
    sellerStatus: u.sellerStatus,
    isSuspended: !!u.isSuspended,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return NextResponse.json({ users });
}
