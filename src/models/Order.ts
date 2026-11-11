import mongoose, { type InferSchemaType } from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    tenantSlug: { type: String, required: true },
    images: {
      type: [
        {
          id: { type: String },
          url: { type: String, required: true },
          alt: { type: String },
          width: { type: Number },
          height: { type: Number },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    // Payment info
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: { type: String },
    paymentRef: { type: String }, // Chapa transaction reference
    paymentVerifiedAt: { type: Date },
    paymentDetails: {
      chapaId: { type: String },
      amount: { type: String },
      currency: { type: String },
      email: { type: String },
    },
    // Escrow & Commission
    commissionRate: { type: Number, default: 0 }, // percentage e.g. 10
    platformFee: { type: Number, default: 0 }, // commission amount
    sellerEarnings: { type: Number, default: 0 }, // total - platformFee
    releaseStatus: {
      type: String,
      enum: ["held", "released", "refunded"],
      default: "held",
    },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    autoReleaseAt: { type: Date }, // when funds will auto-release
    autoRefundAt: { type: Date }, // when order will auto-refund
    // Tracking info
    trackingNumber: { type: String },
    carrier: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    // Status history
    statusHistory: { type: [StatusHistorySchema], default: [] },
    // Notes
    sellerNotes: { type: String },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId };

export const OrderModel =
  (mongoose.models.Order as mongoose.Model<OrderDoc>) ||
  mongoose.model<OrderDoc>("Order", OrderSchema);
