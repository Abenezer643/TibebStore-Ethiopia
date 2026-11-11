import mongoose, { type InferSchemaType } from "mongoose";

const TenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    isDisabled: { type: Boolean, default: false },
    ownerId: { type: String, required: true },
    stripeAccountId: { type: String },
    stripeDetailsSubmitted: { type: Boolean, default: false },
    // Commission & Payout
    commissionRate: { type: Number, default: 10 }, // platform commission percentage
    payoutMethod: { type: String, enum: ["bank", "paypal"], default: "bank" },
    payoutAccount: { type: String }, // bank account or paypal email
    shippingDeadlineHours: { type: Number, default: 48 }, // hours to ship after confirmation
    deliveryDeadlineDays: { type: Number, default: 7 }, // days to deliver after shipping
    logo: {
      id: { type: String },
      url: { type: String },
      alt: { type: String },
      width: { type: Number },
      height: { type: Number },
    },
  },
  { timestamps: true }
);

export type TenantDoc = InferSchemaType<typeof TenantSchema> & { _id: mongoose.Types.ObjectId };

export const TenantModel =
  (mongoose.models.Tenant as mongoose.Model<TenantDoc>) ||
  mongoose.model<TenantDoc>("Tenant", TenantSchema);
