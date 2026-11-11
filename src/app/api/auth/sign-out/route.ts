import { NextResponse } from "next/server";
import { makeClearSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookie = makeClearSessionCookie();
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}
