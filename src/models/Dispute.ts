import mongoose from "mongoose";

const DisputeSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { 
    type: String, 
    enum: ["item_not_received", "item_damaged", "item_not_as_described", "other"],
    required: true 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["open", "in_review", "resolved", "closed"],
    default: "open" 
  },
  resolution: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date },
  images: [{
    id: { type: String },
    url: { type: String },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const DisputeModel = mongoose.models.Dispute || mongoose.model("Dispute", DisputeSchema);
