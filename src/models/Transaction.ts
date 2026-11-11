import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["payment", "commission", "payout", "refund"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "ETB" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    // Who is involved
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // payer
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // payee
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // seller's tenant
    // External reference
    transactionRef: { type: String }, // Chapa tx_ref, bank ref, etc.
    providerRef: { type: String }, // provider-specific ID
    // Details
    description: { type: String },
    processedAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ toUserId: 1, status: 1 });

export const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
