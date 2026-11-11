import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ReviewModel } from "@/models/Review";
import { UserModel } from "@/models/User";
import { requireAuth } from "@/lib/requireAuth";
import { OrderModel } from "@/models/Order";
import mongoose from "mongoose";
import { readSessionFromRequest } from "@/lib/auth";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId")?.trim();

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  await dbConnect();

  const productObjectId = mongoose.isValidObjectId(productId) ? new mongoose.Types.ObjectId(productId) : null;

  let canReview = false;
  const session = readSessionFromRequest(request);
  if (session?.userId && productObjectId) {
    const eligible = await OrderModel.exists({
      userId: session.userId,
      status: "delivered",
      "items.productId": productObjectId,
    });
    canReview = Boolean(eligible);
  }

  const reviews = await ReviewModel.find({ productId }).sort({ createdAt: -1 }).lean();

  const userIds = Array.from(new Set(reviews.map((r) => String((r as any).userId)).filter(Boolean)));
  const users = await UserModel.find({ _id: { $in: userIds } }, { username: 1, avatar: 1 })
    .lean()
    .catch(() => [] as any[]);
  const userById = new Map(users.map((u: any) => [String(u._id), u]));

  const items = reviews.map((r: any) => {
    const u = userById.get(String(r.userId));
    return {
      id: String(r._id),
      rating: r.rating,
      description: r.description,
      productId: String(r.productId),
      userId: String(r.userId),
      user: {
        username: u?.username ?? "User",
        avatar: u?.avatar,
      },
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });

  const count = items.length;
  const avgRating = count ? items.reduce((acc, it) => acc + (Number(it.rating) || 0), 0) / count : 0;
  const distribution = [1, 2, 3, 4, 5].reduce((acc: any, s) => {
    acc[s] = items.filter((it) => Number(it.rating) === s).length;
    return acc;
  }, {} as Record<number, number>);

  return NextResponse.json({
    ok: true,
    reviews: items,
    summary: {
      count,
      avgRating,
      distribution,
    },
    canReview,
  });
}

export async function POST(request: Request) {
  const rl = rateLimitOrThrow({
    request,
    key: "reviews:write",
    options: { windowMs: 10 * 60 * 1000, max: 10 },
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } }
    );
  }

  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "").trim();
  const rating = Number(body?.rating);
  const description = String(body?.description ?? "").trim();

  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }
  if (description.length < 10 || description.length > 500) {
    return NextResponse.json({ error: "Description must be 10-500 characters" }, { status: 400 });
  }

  await dbConnect();

  const userId = (auth.user as any)._id;

  const productObjectId = mongoose.isValidObjectId(productId) ? new mongoose.Types.ObjectId(productId) : null;
  if (!productObjectId) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  const hasPurchased = await OrderModel.exists({
    userId,
    status: "delivered",
    "items.productId": productObjectId,
  });

  if (!hasPurchased) {
    return NextResponse.json({ error: "Only verified buyers can leave a review" }, { status: 403 });
  }

  const doc = await ReviewModel.findOneAndUpdate(
    { productId, userId },
    { $set: { rating, description } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({
    ok: true,
    review: {
      id: String((doc as any)._id),
      rating: (doc as any).rating,
      description: (doc as any).description,
      productId: String((doc as any).productId),
      userId: String((doc as any).userId),
      user: {
        username: (auth.user as any).username,
        avatar: (auth.user as any).avatar,
      },
      createdAt: (doc as any).createdAt,
      updatedAt: (doc as any).updatedAt,
    },
  });
}

export async function DELETE(request: Request) {
  const rl = rateLimitOrThrow({
    request,
    key: "reviews:delete",
    options: { windowMs: 10 * 60 * 1000, max: 10 },
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } }
    );
  }

  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId")?.trim();

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  await dbConnect();

  await ReviewModel.deleteOne({ productId, userId: (auth.user as any)._id });

  return NextResponse.json({ ok: true });
}
