import mongoose, { type InferSchemaType } from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    id: { type: String },
    url: { type: String, required: true },
    alt: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    color: { type: String },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: CategorySchema, required: true },
    images: { type: [MediaSchema], default: [] },
    materials: { type: String },
    craftRegion: { type: String },
    refundPolicy: { type: String },
    stock: { type: Number, default: null }, // null = unlimited/made-to-order, 0 = out of stock, 1+ = in stock
    isArchived: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: mongoose.Types.ObjectId };

export const ProductModel =
  (mongoose.models.Product as mongoose.Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", ProductSchema);
