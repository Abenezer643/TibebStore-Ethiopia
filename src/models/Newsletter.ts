import mongoose, { type InferSchemaType } from "mongoose";

const NewsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true },
    unsubscribedAt: { type: Date },
  },
  { timestamps: true }
);

export type Newsletter = InferSchemaType<typeof NewsletterSchema>;
export const NewsletterModel = mongoose.models.Newsletter || mongoose.model("Newsletter", NewsletterSchema);
