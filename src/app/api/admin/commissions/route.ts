import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { TransactionModel } from "@/models/Transaction";
import { OrderModel } from "@/models/Order";

const DEFAULT_RATE = Number(process.env.PLATFORM_COMMISSION_RATE) || 10;

// GET - Commission report for admin
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "all";

    const now = new Date();
    let startDate: Date | null = null;

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    // Commission from Orders (with fallback: calculate 10% if platformFee is 0)
    const commissionAgg = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" }, ...dateFilter } },
      { $project: {
        platformFee: {
          $cond: [
            { $gt: ["$platformFee", 0] },
            "$platformFee",
            { $round: [{ $multiply: ["$total", DEFAULT_RATE / 100] }, 0] }
          ]
        }
      }},
      { $group: { _id: null, total: { $sum: "$platformFee" }, count: { $sum: 1 } } },
    ]);

    // Total payments (from orders)
    const paymentAgg = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" }, ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    // Pending payouts (sellerEarnings for held orders)
    const payoutPendingAgg = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid", releaseStatus: "held", status: { $ne: "cancelled" }, ...dateFilter } },
      { $project: {
        sellerEarnings: {
          $cond: [
            { $gt: ["$sellerEarnings", 0] },
            "$sellerEarnings",
            { $subtract: ["$total", { $round: [{ $multiply: ["$total", DEFAULT_RATE / 100] }, 0] }] }
          ]
        }
      }},
      { $group: { _id: null, total: { $sum: "$sellerEarnings" }, count: { $sum: 1 } } },
    ]);

    // Completed payouts (from released orders)
    const payoutCompletedAgg = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid", releaseStatus: "released", ...dateFilter } },
      { $project: {
        sellerEarnings: {
          $cond: [
            { $gt: ["$sellerEarnings", 0] },
            "$sellerEarnings",
            { $subtract: ["$total", { $round: [{ $multiply: ["$total", DEFAULT_RATE / 100] }, 0] }] }
          ]
        }
      }},
      { $group: { _id: null, total: { $sum: "$sellerEarnings" }, count: { $sum: 1 } } },
    ]);

    // Total refunds
    const refundAgg = await TransactionModel.aggregate([
      { $match: { type: "refund", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    // Escrow balance (held funds)
    const escrowAgg = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid", releaseStatus: "held", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    // Recent transactions — use Orders as source for commission/payout display
    const recentOrders = await OrderModel.find({ paymentStatus: "paid", ...dateFilter })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const recentTransactions = recentOrders.flatMap((o: any) => {
      const fee = o.platformFee > 0 ? o.platformFee : Math.round(o.total * DEFAULT_RATE / 100);
      const earnings = o.sellerEarnings > 0 ? o.sellerEarnings : o.total - fee;
      const rate = o.commissionRate || DEFAULT_RATE;
      const orderShort = String(o._id).slice(-6).toUpperCase();
      const items: any[] = [
        {
          id: String(o._id) + "-commission",
          type: "commission",
          amount: fee,
          status: "completed",
          description: `Platform commission (${rate}%) for order ${orderShort}`,
          createdAt: o.createdAt,
        },
      ];
      if (o.releaseStatus === "held") {
        items.push({
          id: String(o._id) + "-payout",
          type: "payout",
          amount: earnings,
          status: "pending",
          description: `Seller payout for order ${orderShort}`,
          createdAt: o.createdAt,
        });
      } else if (o.releaseStatus === "released") {
        items.push({
          id: String(o._id) + "-payout",
          type: "payout",
          amount: earnings,
          status: "completed",
          description: `Seller payout for order ${orderShort}`,
          createdAt: o.releasedAt || o.createdAt,
        });
      } else if (o.releaseStatus === "refunded") {
        items.push({
          id: String(o._id) + "-refund",
          type: "refund",
          amount: o.total,
          status: "completed",
          description: `Refund for order ${orderShort}`,
          createdAt: o.refundedAt || o.createdAt,
        });
      }
      return items;
    });

    const getVal = (agg: any[]) => agg[0]?.total || 0;
    const getCount = (agg: any[]) => agg[0]?.count || 0;

    return NextResponse.json({
      summary: {
        totalPayments: getVal(paymentAgg),
        paymentCount: getCount(paymentAgg),
        totalCommission: getVal(commissionAgg),
        commissionCount: getCount(commissionAgg),
        pendingPayouts: getVal(payoutPendingAgg),
        pendingPayoutCount: getCount(payoutPendingAgg),
        completedPayouts: getVal(payoutCompletedAgg),
        completedPayoutCount: getCount(payoutCompletedAgg),
        totalRefunds: getVal(refundAgg),
        refundCount: getCount(refundAgg),
        escrowHeld: getVal(escrowAgg),
        escrowCount: getCount(escrowAgg),
      },
      recentTransactions,
    });
  } catch (error) {
    console.error("Commission report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
