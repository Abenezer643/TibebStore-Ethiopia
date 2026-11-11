import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { UserModel } from "@/models/User";

// PATCH - Update user avatar
export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    const userId = String((auth.user as any)._id);
    const body = await request.json();
    const { avatar } = body;

    if (!avatar || !avatar.url) {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        avatar: {
          id: avatar.id || avatar.url,
          url: avatar.url,
        },
      },
      { new: true }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: String((user as any)._id),
        avatar: (user as any).avatar,
      },
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }
}
