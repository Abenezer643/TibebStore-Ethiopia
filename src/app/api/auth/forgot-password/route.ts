import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { PasswordResetModel } from "@/models/PasswordReset";
import { sendEmail } from "@/lib/email";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { randomBytes } from "crypto";

// POST - Request password reset
export async function POST(request: Request) {
  // Lenient rate limit: 10 requests per hour
  const rl = rateLimitOrThrow({
    request,
    key: "auth:forgot-password",
    options: { windowMs: 60 * 60 * 1000, max: 10 },
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({ 
        ok: true, 
        message: "If an account with that email exists, we've sent a reset link." 
      });
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this user
    await PasswordResetModel.deleteMany({ userId: user._id });

    // Create new reset token
    await PasswordResetModel.create({
      userId: user._id,
      token,
      expiresAt,
    });

    // Send reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tibeb-store.vercel.app";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your TibebStore Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #429DFE; text-align: center;">Password Reset</h1>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <a href="${resetUrl}" 
               style="display: inline-block; background: #429DFE; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 10px 0;">
              Reset Password
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px;">
            TibebStore - Ethiopian Artisan Marketplace
          </p>
        </div>
      `,
    });

    return NextResponse.json({ 
      ok: true, 
      message: "If an account with that email exists, we've sent a reset link." 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
