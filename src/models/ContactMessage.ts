import mongoose, { type InferSchemaType } from "mongoose";

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });

export type ContactMessage = InferSchemaType<typeof ContactMessageSchema>;
export const ContactMessageModel = mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema);
