import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { PayoutModel } from "@/models/Payout";
import { OrderModel } from "@/models/Order";
import { TenantModel } from "@/models/Tenant";

// GET - Fetch payouts for seller
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    const userId = String((auth.user as any)._id);
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("stats") === "true";

    // Fetch payouts
    const payouts = await PayoutModel.find({ sellerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate earnings stats if requested
    let stats = null;
    if (includeStats) {
      // Find the seller's tenant to get the store slug
      const tenant = await TenantModel.findOne({ ownerId: userId }).lean();
      
      if (!tenant) {
        // No tenant found - return zeros
        stats = {
          totalEarnings: 0,
          totalPayouts: 0,
          pendingPayouts: 0,
          availableBalance: 0,
          orderCount: 0,
        };
      } else {
        const storeSlug = (tenant as any).slug;

        // Get orders with escrow data (released = seller earnings confirmed)
        const releasedOrders = await OrderModel.find({
          "items.tenantSlug": storeSlug,
          paymentStatus: "paid",
          releaseStatus: "released",
        }).lean();

        // Get orders still in escrow (held)
        const heldOrders = await OrderModel.find({
          "items.tenantSlug": storeSlug,
          paymentStatus: "paid",
          releaseStatus: "held",
        }).lean();

        // Total released earnings (sellerEarnings from escrow)
        const totalEarnings = releasedOrders.reduce((sum: number, order: any) => {
          return sum + (order.sellerEarnings || 0);
        }, 0);

        // Earnings still held in escrow
        const escrowHeld = heldOrders.reduce((sum: number, order: any) => {
          return sum + (order.sellerEarnings || order.total || 0);
        }, 0);

        const totalPayouts = payouts
          .filter((p: any) => p.status === "completed")
          .reduce((sum: number, p: any) => sum + p.amount, 0);

        const pendingPayouts = payouts
          .filter((p: any) => p.status === "pending" || p.status === "processing")
          .reduce((sum: number, p: any) => sum + p.amount, 0);

        stats = {
          totalEarnings,
          totalPayouts,
          pendingPayouts,
          escrowHeld,
          availableBalance: totalEarnings - totalPayouts - pendingPayouts,
          releasedOrderCount: releasedOrders.length,
          heldOrderCount: heldOrders.length,
        };
      }
    }

    return NextResponse.json({
      payouts: payouts.map((p: any) => ({
        id: String(p._id),
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        payoutMethod: p.payoutMethod,
        payoutAccount: p.payoutAccount,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        orderCount: p.orderCount,
        transactionRef: p.transactionRef,
        notes: p.notes,
        processedAt: p.processedAt,
        createdAt: p.createdAt,
      })),
      stats,
    });
  } catch (error) {
    console.error("Fetch payouts error:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}
