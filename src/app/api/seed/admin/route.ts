
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { hashPassword, makeSessionCookie, signSession, toSafeUser } from "@/lib/auth";

const SUPER_ADMIN_EMAIL = "admin@tibebstore.com";

// Minimal seed - only creates super admin, no mock data
export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  await dbConnect();

  const email = SUPER_ADMIN_EMAIL;

  const existing = await UserModel.findOne({ email });

  if (existing) {
    return NextResponse.json({
      ok: true,
      message: "Super admin already exists",
      admin: toSafeUser(existing as any)
    });
  }

  const passwordHash = await hashPassword(adminPassword);
  const user = await UserModel.create({
    email,
    username: "admin",
    passwordHash,
    role: "super-admin",
    sellerStatus: "none",
    isSuspended: false,
  });

  const token = signSession({ id: String((user as any)._id), role: (user as any).role });
  const cookie = makeSessionCookie(token);
  const res = NextResponse.json({
    ok: true,
    message: "Super admin created successfully",
    admin: toSafeUser(user as any)
  });
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}
