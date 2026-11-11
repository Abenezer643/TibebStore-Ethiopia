import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { processOverdueOrders } from "@/lib/escrow";
import { requireAdmin } from "@/lib/requireAuth";

// Cron job endpoint to process overdue orders
// Called periodically (e.g. every hour via external cron) or manually by admin
// Protected by CRON_SECRET or admin authentication
export async function POST(request: Request) {
  // Allow admin-authenticated calls (manual trigger from dashboard)
  const admin = await requireAdmin(request);
  if (admin.response) {
    // If admin auth fails, try cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await dbConnect();
    const results = await processOverdueOrders();

    console.log("[Escrow Cron] Results:", results);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Escrow Cron] Error:", error);
    return NextResponse.json(
      { error: "Cron processing failed" },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const results = await processOverdueOrders();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Escrow Cron] Error:", error);
    return NextResponse.json(
      { error: "Cron processing failed" },
      { status: 500 }
    );
  }
}
