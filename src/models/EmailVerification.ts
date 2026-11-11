import mongoose from "mongoose";

const EmailVerificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  code: { type: String, required: true }, // 6-digit code
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for automatic cleanup of expired tokens
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationModel = mongoose.models.EmailVerification || mongoose.model("EmailVerification", EmailVerificationSchema);
