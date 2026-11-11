import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { UserModel } from "@/models/User";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { TenantModel } from "@/models/Tenant";
import { ContactMessageModel } from "@/models/ContactMessage";
import { NewsletterModel } from "@/models/Newsletter";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    await dbConnect();

    // Run all queries in parallel for faster loading
    const [
      totalUsers,
      buyers,
      sellers,
      approvedSellers,
      pendingSellers,
      suspendedUsers,
      totalOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
      grossSalesResult,
      totalProducts,
      totalTenants,
      activeTenants,
      unreadMessages,
      totalSubscribers,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: "buyer" }),
      UserModel.countDocuments({ role: "seller" }),
      UserModel.countDocuments({ role: "seller", sellerStatus: "approved" }),
      UserModel.countDocuments({ role: "seller", sellerStatus: "pending" }),
      UserModel.countDocuments({ isSuspended: true }),
      OrderModel.countDocuments(),
      OrderModel.countDocuments({ status: "processing" }),
      OrderModel.countDocuments({ status: "shipped" }),
      OrderModel.countDocuments({ status: "delivered" }),
      OrderModel.countDocuments({ status: "cancelled" }),
      // Platform commission earned (fallback: calculate 10% if platformFee not set)
      OrderModel.aggregate([
        { $match: { status: { $ne: "cancelled" }, paymentStatus: "paid" } },
        { $project: {
          platformFee: {
            $cond: [
              { $gt: ["$platformFee", 0] },
              "$platformFee",
              { $round: [{ $multiply: ["$total", 0.1] }, 0] }
            ]
          }
        }},
        { $group: { _id: null, total: { $sum: "$platformFee" } } },
      ]),
      // Gross sales (for reference)
      OrderModel.aggregate([
        { $match: { status: { $ne: "cancelled" }, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      ProductModel.countDocuments(),
      TenantModel.countDocuments(),
      TenantModel.countDocuments({ isDisabled: false }),
      ContactMessageModel.countDocuments({ isRead: false }),
      NewsletterModel.countDocuments({ isActive: true }),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const grossSales = grossSalesResult[0]?.total || 0;

    return NextResponse.json({
      users: {
        total: totalUsers,
        buyers,
        sellers,
        approvedSellers,
        pendingSellers,
        suspended: suspendedUsers,
      },
      orders: {
        total: totalOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        pending: processingOrders + shippedOrders,
      },
      revenue: totalRevenue,
      grossSales,
      products: totalProducts,
      tenants: {
        total: totalTenants,
        active: activeTenants,
      },
      messages: {
        unread: unreadMessages,
      },
      newsletter: {
        subscribers: totalSubscribers,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
