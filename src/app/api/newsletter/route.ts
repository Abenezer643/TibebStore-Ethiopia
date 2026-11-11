import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { NewsletterModel } from "@/models/Newsletter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    await dbConnect();

    // Check if already subscribed
    const existing = await NewsletterModel.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ ok: true, message: "Already subscribed" });
      }
      // Reactivate if previously unsubscribed
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
      return NextResponse.json({ ok: true, message: "Resubscribed successfully" });
    }

    // Create new subscription
    await NewsletterModel.create({
      email: normalizedEmail,
      isActive: true,
    });

    return NextResponse.json({ ok: true, message: "Subscribed successfully" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { requireAdmin } = await import("@/lib/requireAuth");
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const subscribers = await NewsletterModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      subscribers: subscribers.map((s) => ({
        id: String(s._id),
        email: s.email,
        subscribedAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Newsletter fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}
