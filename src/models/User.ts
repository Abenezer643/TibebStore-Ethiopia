import mongoose, { type InferSchemaType } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "seller", "super-admin"], default: "user" },
    emailVerified: { type: Boolean, default: false },
    avatar: {
      id: { type: String },
      url: { type: String },
      alt: { type: String },
      width: { type: Number },
      height: { type: Number },
    },
    sellerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    isSuspended: { type: Boolean, default: false },
    favorites: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);
