import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ProductModel } from "@/models/Product";
import { readSessionFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

// GET - Get user's favorites
export async function GET(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const user = await UserModel.findById(session.userId).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const favoriteIds = (user as any).favorites || [];
  
  if (favoriteIds.length === 0) {
    return NextResponse.json({ favorites: [] });
  }

  // Convert string IDs to ObjectIds
  const objectIds = favoriteIds
    .map((id: string) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return null;
      }
    })
    .filter((id: mongoose.Types.ObjectId | null) => id !== null);

  const products = await ProductModel.find({ _id: { $in: objectIds } })
    .populate("tenantId", "name slug")
    .lean();

  const favorites = products.map((p: any) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    category: p.category,
    images: p.images,
    craftRegion: p.craftRegion,
    materials: p.materials,
    tenantId: p.tenantId?._id ? String(p.tenantId._id) : p.tenantId,
    tenantName: p.tenantId?.name,
    tenantSlug: p.tenantId?.slug,
    isArchived: p.isArchived,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return NextResponse.json({ favorites });
}

// POST - Add to favorites
export async function POST(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = body?.productId;

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  await dbConnect();

  const product = await ProductModel.findById(productId).lean();
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const user = await UserModel.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const favorites = (user as any).favorites || [];
  const productIdStr = String(productId);

  if (favorites.includes(productIdStr)) {
    return NextResponse.json({ ok: true, message: "Already in favorites", isFavorite: true });
  }

  (user as any).favorites = [...favorites, productIdStr];
  await user.save();

  return NextResponse.json({ ok: true, message: "Added to favorites", isFavorite: true });
}

// DELETE - Remove from favorites
export async function DELETE(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  await dbConnect();

  const user = await UserModel.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const favorites = (user as any).favorites || [];
  const productIdStr = String(productId);

  (user as any).favorites = favorites.filter((id: string) => id !== productIdStr);
  await user.save();

  return NextResponse.json({ ok: true, message: "Removed from favorites", isFavorite: false });
}
