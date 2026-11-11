import { OrderModel } from "@/models/Order";
import { TenantModel } from "@/models/Tenant";
import { TransactionModel } from "@/models/Transaction";
import { PayoutModel } from "@/models/Payout";
import { UserModel } from "@/models/User";
import { getChapaService } from "@/lib/chapa";
import { sendEmail } from "@/lib/email";

const DEFAULT_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE) || 10;
const DEFAULT_SHIPPING_DEADLINE_HOURS = Number(process.env.SHIPPING_DEADLINE_HOURS) || 48;
const DEFAULT_DELIVERY_DEADLINE_DAYS = Number(process.env.DELIVERY_DEADLINE_DAYS) || 7;
const AUTO_RELEASE_HOURS = Number(process.env.AUTO_RELEASE_HOURS) || 24;

/**
 * Calculate commission for an order
 */
export function calculateCommission(
  total: number,
  commissionRate?: number
): { platformFee: number; sellerEarnings: number; rate: number } {
  const rate = commissionRate || DEFAULT_COMMISSION_RATE;
  const platformFee = Math.max(1, Math.round((total * rate) / 100));
  const sellerEarnings = total - platformFee;
  return { platformFee, sellerEarnings, rate };
}

/**
 * Set escrow deadlines on an order when payment confirmed
 */
export function setEscrowDeadlines(order: any, tenant: any) {
  const shippingHours = tenant?.shippingDeadlineHours ?? DEFAULT_SHIPPING_DEADLINE_HOURS;
  const deliveryDays = tenant?.deliveryDeadlineDays ?? DEFAULT_DELIVERY_DEADLINE_DAYS;

  const now = new Date();
  const autoRefundAt = new Date(now.getTime() + shippingHours * 60 * 60 * 1000);

  order.autoRefundAt = autoRefundAt; // if not shipped by this time, auto-refund
  // delivery deadline is set when order is shipped (see setShippedDeadline)
}

/**
 * Set delivery deadline when order shipped
 */
export function setShippedDeadline(order: any, tenant: any) {
  const deliveryDays = tenant?.deliveryDeadlineDays ?? DEFAULT_DELIVERY_DEADLINE_DAYS;
  const now = new Date();

  // New auto-refund deadline based on delivery
  const autoRefundAt = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
  order.autoRefundAt = autoRefundAt;

  // Auto-release 24h after delivery deadline
  const autoReleaseAt = new Date(
    autoRefundAt.getTime() + AUTO_RELEASE_HOURS * 60 * 60 * 1000
  );
  order.autoReleaseAt = autoReleaseAt;
}

/**
 * Release funds to seller — called when order is delivered
 */
export async function releaseFundsToSeller(order: any) {
  if (order.releaseStatus === "released") return { alreadyReleased: true };
  if (order.paymentStatus !== "paid") return { error: "Order not paid" };
  if (order.status !== "delivered") return { error: "Order not delivered" };

  const now = new Date();
  order.releaseStatus = "released";
  order.releasedAt = now;
  await order.save();

  // Create payout record
  const tenant = await TenantModel.findOne({
    slug: order.items?.[0]?.tenantSlug,
  }).lean();

  if (tenant && order.sellerEarnings > 0) {
    await PayoutModel.create({
      sellerId: tenant.ownerId,
      amount: order.sellerEarnings,
      currency: "ETB",
      status: "pending",
      payoutMethod: (tenant as any).payoutMethod || "bank",
      payoutAccount: (tenant as any).payoutAccount || "",
      periodStart: order.createdAt,
      periodEnd: now,
      orderCount: 1,
      notes: `Auto-release for order ${String(order._id).slice(-6).toUpperCase()}`,
    });
  }

  // Create transaction records
  await TransactionModel.create([
    {
      orderId: order._id,
      type: "commission",
      amount: order.platformFee,
      currency: "ETB",
      status: "completed",
      fromUserId: order.userId,
      toUserId: null, // platform
      tenantId: tenant?._id,
      description: `Platform commission (${order.commissionRate}%) for order ${String(order._id).slice(-6).toUpperCase()}`,
      processedAt: now,
    },
    {
      orderId: order._id,
      type: "payout",
      amount: order.sellerEarnings,
      currency: "ETB",
      status: "pending",
      fromUserId: null, // platform
      toUserId: tenant?.ownerId,
      tenantId: tenant?._id,
      description: `Seller payout for order ${String(order._id).slice(-6).toUpperCase()}`,
    },
  ]);

  // Send release notification emails
  try {
    const seller = tenant ? await UserModel.findById(tenant.ownerId).lean() : null;
    if (seller && (seller as any).email) {
      await sendEmail({
        to: (seller as any).email,
        subject: `Funds Released — Order #${String(order._id).slice(-6).toUpperCase()}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="color:#10b981;text-align:center;">Funds Released!</h1>
          <p>Your earnings for order #${String(order._id).slice(-6).toUpperCase()} have been released.</p>
          <div style="background:#f9f9f9;padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Seller Earnings:</strong> ETB ${order.sellerEarnings.toLocaleString()}</p>
            <p><strong>Platform Fee:</strong> ETB ${order.platformFee.toLocaleString()} (${order.commissionRate}%)</p>
          </div>
          <p style="color:#999;font-size:12px;">Payout will be processed to your ${((tenant as any).payoutMethod || "bank")} account.</p>
        </div>`,
      });
    }
  } catch (emailErr) {
    console.error("[Escrow] Release email error:", emailErr);
  }

  return { released: true, sellerEarnings: order.sellerEarnings, platformFee: order.platformFee };
}

/**
 * Refund buyer — called when order is cancelled or overdue
 */
export async function refundBuyer(order: any, reason: string) {
  if (order.releaseStatus === "refunded") return { alreadyRefunded: true };
  if (order.releaseStatus === "released") return { error: "Funds already released to seller" };
  if (order.paymentStatus !== "paid") return { error: "Order not paid, nothing to refund" };

  const now = new Date();

  // Attempt Chapa refund if payment was via Chapa
  let chapaRefundResult = null;
  if (order.paymentMethod === "chapa" && order.paymentRef) {
    try {
      chapaRefundResult = await getChapaService().refundPayment({
        txRef: order.paymentRef,
      });
      if (!chapaRefundResult.ok) {
        console.warn("[Escrow] Chapa refund failed:", chapaRefundResult.message);
        // Continue with internal refund tracking even if Chapa refund fails
      }
    } catch (chapaErr) {
      console.error("[Escrow] Chapa refund error:", chapaErr);
      // Continue — internal tracking still marks as refunded
    }
  }

  order.releaseStatus = "refunded";
  order.refundedAt = now;
  order.paymentStatus = "refunded";
  order.status = "cancelled";
  order.cancelReason = reason;
  order.statusHistory.push({
    status: "cancelled",
    note: `Auto-refund: ${reason}`,
    changedAt: now,
  });
  await order.save();

  // Create refund transaction
  await TransactionModel.create({
    orderId: order._id,
    type: "refund",
    amount: order.total,
    currency: "ETB",
    status: chapaRefundResult?.ok ? "completed" : "pending",
    fromUserId: null, // platform
    toUserId: order.userId,
    description: `Refund for order ${String(order._id).slice(-6).toUpperCase()}: ${reason}`,
    transactionRef: chapaRefundResult?.refundRef,
    processedAt: chapaRefundResult?.ok ? now : undefined,
  });

  // Send refund notification email to buyer
  try {
    const buyer = await UserModel.findById(order.userId).lean();
    if (buyer && (buyer as any).email) {
      await sendEmail({
        to: (buyer as any).email,
        subject: `Refund Processed — Order #${String(order._id).slice(-6).toUpperCase()}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="color:#429DFE;text-align:center;">Refund Processed</h1>
          <p>Your payment for order #${String(order._id).slice(-6).toUpperCase()} has been refunded.</p>
          <div style="background:#f9f9f9;padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Refund Amount:</strong> ETB ${order.total.toLocaleString()}</p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          <p style="color:#999;font-size:12px;">The refund will appear in your account within 3-5 business days.</p>
        </div>`,
      });
    }
  } catch (emailErr) {
    console.error("[Escrow] Refund email error:", emailErr);
  }

  return { refunded: true, amount: order.total, reason, chapaRefund: chapaRefundResult };
}

/**
 * Process overdue orders — called by cron job
 * Finds orders that have passed their auto-refund deadline
 */
export async function processOverdueOrders() {
  const now = new Date();
  const results = { refunded: 0, released: 0, errors: 0 };

  // 1. Auto-refund: confirmed orders not shipped within deadline
  const overdueShipping = await OrderModel.find({
    status: { $in: ["confirmed", "processing"] },
    paymentStatus: "paid",
    releaseStatus: "held",
    autoRefundAt: { $lte: now },
  });

  for (const order of overdueShipping) {
    try {
      await refundBuyer(order, "Order not shipped within deadline");
      results.refunded++;
    } catch (err) {
      console.error("[Escrow] Auto-refund error:", err);
      results.errors++;
    }
  }

  // 2. Auto-refund: shipped orders not delivered within deadline
  const overdueDelivery = await OrderModel.find({
    status: "shipped",
    paymentStatus: "paid",
    releaseStatus: "held",
    autoRefundAt: { $lte: now },
  });

  for (const order of overdueDelivery) {
    try {
      await refundBuyer(order, "Order not delivered within deadline");
      results.refunded++;
    } catch (err) {
      console.error("[Escrow] Auto-refund delivery error:", err);
      results.errors++;
    }
  }

  // 3. Auto-release: delivered orders past auto-release time
  const readyForRelease = await OrderModel.find({
    status: "delivered",
    paymentStatus: "paid",
    releaseStatus: "held",
    autoReleaseAt: { $lte: now },
  });

  for (const order of readyForRelease) {
    try {
      await releaseFundsToSeller(order);
      results.released++;
    } catch (err) {
      console.error("[Escrow] Auto-release error:", err);
      results.errors++;
    }
  }

  return results;
}
