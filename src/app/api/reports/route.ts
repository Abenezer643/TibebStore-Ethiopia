import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ReportModel } from "@/models/Report";
import { readSessionFromRequest } from "@/lib/auth";

// GET - List reports (super-admin only)
export async function GET(request: Request) {
  try {
    const session = await readSessionFromRequest(request);
    if (!session || session.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    const query: any = {};
    if (status && ["open", "reviewed", "resolved"].includes(status)) {
      query.status = status;
    }
    
    const reports = await ReportModel.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[Reports] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// POST - Submit a report (anyone can report)
export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const session = await readSessionFromRequest(request);
    
    const body = await request.json();
    const { productId, productName, tenantSlug, tenantName, reason, message } = body;
    
    if (!productId || !productName || !tenantSlug || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    if (!["scam", "inappropriate", "copyright", "wrong-category", "other"].includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }
    
    const report = await ReportModel.create({
      productId,
      productName,
      tenantSlug,
      tenantName,
      reporterId: session?.userId || null,
      reason,
      message: message || "",
      status: "open",
    });
    
    return NextResponse.json({ ok: true, reportId: report._id });
  } catch (error) {
    console.error("[Reports] POST error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
