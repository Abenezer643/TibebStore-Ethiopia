import mongoose, { type InferSchemaType } from "mongoose";

const SellerApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    storeName: { type: String, required: true },
    storeSlug: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    payoutMethod: { type: String, enum: ["bank", "paypal"], required: true },
    payoutAccount: { type: String, required: true },
    idDocumentName: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    submittedAt: { type: Date, required: true },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

export type SellerApplicationDoc = InferSchemaType<typeof SellerApplicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SellerApplicationModel =
  (mongoose.models.SellerApplication as mongoose.Model<SellerApplicationDoc>) ||
  mongoose.model<SellerApplicationDoc>("SellerApplication", SellerApplicationSchema);
