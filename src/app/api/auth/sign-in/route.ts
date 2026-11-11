import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { makeSessionCookie, signSession, toSafeUser, verifyPassword } from "@/lib/auth";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const rl = rateLimitOrThrow({
    request,
    key: "auth:sign-in",
    options: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 min
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } }
    );
  }

  const body = (await request.json().catch(() => null)) as null | {
    email?: string;
    password?: string;
  };

  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await dbConnect();
  const user = await UserModel.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Check if email is verified (except for super admin)
  const isSuperAdmin = email === "admin@tibebstore.com";
  if (!(user as any).emailVerified && !isSuperAdmin) {
    return NextResponse.json({ 
      error: "Please verify your email first. Check your inbox for the verification code.",
      needsVerification: true,
      email: user.email,
    }, { status: 403 });
  }

  const token = signSession({
    id: String(user._id),
    role: user.role,
    sellerStatus: (user as any).sellerStatus,
    isSuspended: !!(user as any).isSuspended,
  });
  const res = NextResponse.json({ user: toSafeUser(user) });
  const cookie = makeSessionCookie(token);
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}
