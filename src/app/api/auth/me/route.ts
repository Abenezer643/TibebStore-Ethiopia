import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { readSessionFromRequest, toSafeUser } from "@/lib/auth";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) return NextResponse.json({ user: null });

  await dbConnect();
  const user = await UserModel.findById(session.userId);
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user: toSafeUser(user) });
}
