import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { ContactMessageModel } from "@/models/ContactMessage";

// Admin endpoint to fetch contact form submissions
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const query = unreadOnly ? { isRead: false } : {};

    const messages = await ContactMessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: String(m._id),
        name: m.name,
        email: m.email,
        topic: m.topic,
        message: m.message,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Fetch contact messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
