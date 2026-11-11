import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await dbConnect();

    const adminEmail = "admin@tibebstore.com";
    const passwordHash = await hashPassword(password);

    const updated = await UserModel.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          passwordHash,
          updatedAt: new Date().toISOString()
        }
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Admin password updated successfully"
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
