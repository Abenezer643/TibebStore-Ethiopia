import mongoose, { type InferSchemaType } from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & { _id: mongoose.Types.ObjectId };

export const ReviewModel =
  (mongoose.models.Review as mongoose.Model<ReviewDoc>) || mongoose.model<ReviewDoc>("Review", ReviewSchema);
