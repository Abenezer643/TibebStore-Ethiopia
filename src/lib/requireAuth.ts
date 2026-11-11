import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { readSessionFromRequest } from "@/lib/auth";
import { UserModel } from "@/models/User";

export async function requireAuth(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  await dbConnect();
  const user = await UserModel.findById(session.userId);
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, response: null };
}

export async function requireAdmin(request: Request) {
  const { user, response } = await requireAuth(request);
  if (response) return { user: null, response };
  if (!user || user.role !== "super-admin") {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (user.isSuspended) {
    return { user: null, response: NextResponse.json({ error: "Suspended" }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function requireApprovedSeller(request: Request) {
  const { user, response } = await requireAuth(request);
  if (response) return { user: null, response };
  if (!user || user.role !== "seller" || user.sellerStatus !== "approved") {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (user.isSuspended) {
    return { user: null, response: NextResponse.json({ error: "Suspended" }, { status: 403 }) };
  }
  return { user, response: null };
}
