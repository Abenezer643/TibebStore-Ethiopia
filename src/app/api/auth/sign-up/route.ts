import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { EmailVerificationModel } from "@/models/EmailVerification";
import { hashPassword } from "@/lib/auth";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

const SUPER_ADMIN_EMAIL = "admin@tibebstore.com";

// Generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const rl = rateLimitOrThrow({
      request,
      key: "auth:sign-up",
      options: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 per hour
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } }
      );
    }

    const body = (await request.json().catch(() => null)) as null | {
      email?: string;
      username?: string;
      password?: string;
    };

    const email = body?.email?.trim().toLowerCase() ?? "";
    const username = body?.username?.trim() ?? "";
    const password = body?.password ?? "";

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const role = email === SUPER_ADMIN_EMAIL ? "super-admin" : "user";
    const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

    const user = await UserModel.create({
      email,
      username,
      passwordHash,
      role,
      sellerStatus: "none",
      isSuspended: false,
      emailVerified: isSuperAdmin, // Auto-verify super admin
    });

    // Skip email verification for super admin
    if (isSuperAdmin) {
      return NextResponse.json({ 
        ok: true,
        email: user.email,
        verified: true,
        message: "Super admin account created! You can now sign in."
      });
    }

    // Generate verification token and 6-digit code
    const token = randomBytes(32).toString("hex");
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
          <h1 style="color: #429DFE; text-align: center;">Welcome to TibebStore!</h1>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin-bottom: 20px;">
              Hi ${username}! Please verify your email address to activate your account.
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
          
          <p style="text-align: center; color: #999; font-size: 12px;">
            TibebStore - Ethiopian Artisan Marketplace
          </p>
        </div>
      `,
    });

    // Return email for verification page (don't sign in yet)
    return NextResponse.json({ 
      ok: true,
      email: user.email,
      message: "Account created! Please verify your email to continue."
    });
  } catch (err) {
    console.error("/api/auth/sign-up error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Internal Server Error", message }, { status: 500 });
  }
}
