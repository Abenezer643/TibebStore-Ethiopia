import mongoose, { type InferSchemaType } from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    tenantSlug: { type: String, required: true, index: true },
    tenantName: { type: String },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    reason: { 
      type: String, 
      required: true, 
      enum: ["scam", "inappropriate", "copyright", "wrong-category", "other"] 
    },
    message: { type: String },
    status: { 
      type: String, 
      enum: ["open", "reviewed", "resolved"], 
      default: "open",
      index: true 
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export type ReportDoc = InferSchemaType<typeof ReportSchema> & { _id: mongoose.Types.ObjectId };

export const ReportModel =
  (mongoose.models.Report as mongoose.Model<ReportDoc>) ||
  mongoose.model<ReportDoc>("Report", ReportSchema);
