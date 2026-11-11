import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ContactMessageModel } from "@/models/ContactMessage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, topic, message } = body;

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
    }

    await dbConnect();

    const contactMessage = await ContactMessageModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      topic: topic.trim(),
      message: message.trim(),
      isRead: false,
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: String(contactMessage._id),
        name: contactMessage.name,
        email: contactMessage.email,
        topic: contactMessage.topic,
        message: contactMessage.message,
        isRead: contactMessage.isRead,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Contact message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
