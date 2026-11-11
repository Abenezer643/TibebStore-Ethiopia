import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { hashPassword, makeSessionCookie, signSession, toSafeUser } from "@/lib/auth";

// Create a test approved seller
export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const email = "seller@tibebstore.com";
  const password = "Seller2024";
  const username = "testseller";

  const existing = await UserModel.findOne({ email });

  if (existing) {
    // Update to approved seller if exists
    existing.role = "seller";
    existing.sellerStatus = "approved";
    existing.isSuspended = false;
    await existing.save();

    const token = signSession({ 
      id: String(existing._id), 
      role: existing.role,
      sellerStatus: existing.sellerStatus,
      isSuspended: existing.isSuspended
    });
    const cookie = makeSessionCookie(token);
    const res = NextResponse.json({ 
      ok: true, 
      message: "Seller updated and approved",
      seller: toSafeUser(existing as any),
      credentials: { email, password }
    });
    res.cookies.set(cookie.name, cookie.value, cookie);
    return res;
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    email,
    username,
    passwordHash,
    role: "seller",
    sellerStatus: "approved",
    isSuspended: false,
  });

  const token = signSession({ 
    id: String((user as any)._id), 
    role: (user as any).role,
    sellerStatus: (user as any).sellerStatus,
    isSuspended: (user as any).isSuspended
  });
  const cookie = makeSessionCookie(token);
  const res = NextResponse.json({ 
    ok: true, 
    message: "Test seller created and approved",
    seller: toSafeUser(user as any),
    credentials: { email, password }
  });
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}
