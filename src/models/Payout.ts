import mongoose from "mongoose";

const PayoutSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "ETB" },
  status: { 
    type: String, 
    enum: ["pending", "processing", "completed", "failed"], 
    default: "pending" 
  },
  payoutMethod: { type: String, enum: ["bank", "paypal"], required: true },
  payoutAccount: { type: String, required: true },
  periodStart: { type: Date, required: true }, // Start of sales period
  periodEnd: { type: Date, required: true }, // End of sales period
  orderCount: { type: Number, default: 0 }, // Number of orders included
  transactionRef: { type: String }, // Reference from payment provider
  notes: { type: String },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const PayoutModel = mongoose.models.Payout || mongoose.model("Payout", PayoutSchema);
