import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { PasswordResetModel } from "@/models/PasswordReset";
import { hash } from "bcryptjs";

// POST - Reset password with token
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find valid reset token
    const resetToken = await PasswordResetModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Find user
    const user = await UserModel.findById(resetToken.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update user password
    user.passwordHash = hashedPassword;
    await user.save();

    // Delete used reset token
    await PasswordResetModel.deleteMany({ userId: user._id });

    return NextResponse.json({ 
      ok: true, 
      message: "Password reset successfully. You can now sign in with your new password." 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

// GET - Verify reset token
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const resetToken = await PasswordResetModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    return NextResponse.json({ valid: !!resetToken });
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
