import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ReportModel } from "@/models/Report";
import { readSessionFromRequest } from "@/lib/auth";

// PATCH - Update report status (super-admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await readSessionFromRequest(request);
    if (!session || session.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;
    
    if (!status || !["open", "reviewed", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    
    const update: any = {
      status,
      reviewedBy: session.userId,
      reviewedAt: new Date(),
    };
    
    if (adminNotes !== undefined) {
      update.adminNotes = adminNotes;
    }
    
    const report = await ReportModel.findByIdAndUpdate(id, update, { new: true });
    
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error("[Reports] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

// DELETE - Delete a report (super-admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await readSessionFromRequest(request);
    if (!session || session.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    
    const report = await ReportModel.findByIdAndDelete(id);
    
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Reports] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
