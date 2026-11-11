import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { EmailVerificationModel } from "@/models/EmailVerification";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

// Generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Verify email with code or token
// No rate limiting for verification - users should be able to verify freely

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, code, token } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!code && !token) {
      return NextResponse.json({ error: "Code or token is required" }, { status: 400 });
    }

    // Find verification record
    const query: any = {
      email: email.toLowerCase(),
      expiresAt: { $gt: new Date() },
    };

    if (code) {
      query.code = code;
    } else if (token) {
      query.token = token;
    }

    const verification = await EmailVerificationModel.findOne(query);

    if (!verification) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // Update user
    await UserModel.findByIdAndUpdate(verification.userId, { emailVerified: true });

    // Delete all verification tokens for this user
    await EmailVerificationModel.deleteMany({ userId: verification.userId });

    return NextResponse.json({ 
      ok: true, 
      message: "Email verified successfully! You can now sign in." 
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}

// POST - Resend verification code
export async function PUT(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((user as any).emailVerified) {
      return NextResponse.json({ ok: true, message: "Email already verified" });
    }

    // Generate new verification code
    const token = randomBytes(32).toString("hex");
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailVerificationModel.deleteMany({ userId: user._id });
    await EmailVerificationModel.create({
      userId: user._id,
      email: user.email,
      code,
      token,
      expiresAt,
    });

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tibeb-store.vercel.app";
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your TibebStore Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #429DFE; text-align: center;">Verify Your Email</h1>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin-bottom: 20px;">
              Please verify your email address.
            </p>
            
            <div style="background: #429DFE; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            
            <p style="color: #666; margin-bottom: 20px;">
              Enter this code on the verification page, or click the button below:
            </p>
            
            <a href="${verifyUrl}" 
               style="display: inline-block; background: #429DFE; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 10px 0;">
              Verify Email
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This code will expire in 10 minutes.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, message: "Verification code sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to resend code" }, { status: 500 });
  }
}

// GET - Verify email with token (for link clicks)
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid", request.url)
      );
    }

    const verification = await EmailVerificationModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid", request.url)
      );
    }

    // Update user
    await UserModel.findByIdAndUpdate(verification.userId, { emailVerified: true });

    // Delete token
    await EmailVerificationModel.deleteMany({ userId: verification.userId });

    // Redirect to success
    return NextResponse.redirect(
      new URL("/verify-email?success=true", request.url)
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(
      new URL("/verify-email?error=failed", request.url)
    );
  }
}
