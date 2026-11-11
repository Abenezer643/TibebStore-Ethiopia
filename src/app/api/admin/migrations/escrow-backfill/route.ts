import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";
import { TenantModel } from "@/models/Tenant";
import { TransactionModel } from "@/models/Transaction";
import { calculateCommission } from "@/lib/escrow";

/**
 * Backfill escrow fields for existing paid orders and fix Transaction records.
 * Run after deploying the escrow system or after fixing the commission rate bug.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  try {
    await dbConnect();

    // Find paid orders missing escrow fields OR with 0 commission
    const orders = await OrderModel.find({
      paymentStatus: "paid",
      $or: [
        { releaseStatus: { $exists: false } },
        { releaseStatus: null },
        { platformFee: { $exists: false } },
        { platformFee: 0 },
      ],
    }).lean();

    let ordersUpdated = 0;
    let txUpdated = 0;
    let errors = 0;

    for (const doc of orders) {
      try {
        const o = doc as any;
        const tenantSlug = o.items?.[0]?.tenantSlug;
        const tenant = tenantSlug ? await TenantModel.findOne({ slug: tenantSlug }).lean() : null;

        const commission = calculateCommission(o.total, (tenant as any)?.commissionRate);

        const update: any = {
          commissionRate: commission.rate,
          platformFee: commission.platformFee,
          sellerEarnings: commission.sellerEarnings,
          releaseStatus: o.status === "delivered" ? "released" : o.status === "cancelled" ? "refunded" : "held",
        };

        if (o.status === "delivered" && o.deliveredAt) {
          update.releasedAt = o.deliveredAt;
        }
        if (o.status === "cancelled") {
          update.refundedAt = o.updatedAt || o.createdAt;
        }

        await OrderModel.updateOne({ _id: o._id }, { $set: update });
        ordersUpdated++;

        // Fix commission transaction records for this order
        const commissionTxs = await TransactionModel.find({
          orderId: o._id,
          type: "commission",
        });

        for (const tx of commissionTxs) {
          if ((tx as any).amount !== commission.platformFee) {
            (tx as any).amount = commission.platformFee;
            (tx as any).description = `Platform commission (${commission.rate}%) for order ${String(o._id).slice(-6).toUpperCase()}`;
            await (tx as any).save();
            txUpdated++;
          }
        }

        // Fix payout transaction records for this order
        const payoutTxs = await TransactionModel.find({
          orderId: o._id,
          type: "payout",
        });

        for (const tx of payoutTxs) {
          if ((tx as any).amount !== commission.sellerEarnings) {
            (tx as any).amount = commission.sellerEarnings;
            (tx as any).description = `Seller payout for order ${String(o._id).slice(-6).toUpperCase()}`;
            await (tx as any).save();
            txUpdated++;
          }
        }

        // Create missing commission transaction if none exists
        if (commissionTxs.length === 0) {
          await TransactionModel.create({
            orderId: o._id,
            type: "commission",
            amount: commission.platformFee,
            currency: "ETB",
            status: "completed",
            fromUserId: null,
            toUserId: null,
            tenantId: tenant?._id,
            description: `Platform commission (${commission.rate}%) for order ${String(o._id).slice(-6).toUpperCase()}`,
            processedAt: o.paymentVerifiedAt || o.createdAt,
          });
          txUpdated++;
        }

      } catch (err) {
        console.error("[Escrow Backfill] Error updating order:", (doc as any)._id, err);
        errors++;
      }
    }

    return NextResponse.json({
      message: `Backfill complete`,
      ordersTotal: orders.length,
      ordersUpdated,
      transactionsUpdated: txUpdated,
      errors,
    });
  } catch (error) {
    console.error("[Escrow Backfill Error]", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
