import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { SellerApplicationModel } from "@/models/SellerApplication";
import { UserModel } from "@/models/User";
import { TenantModel } from "@/models/Tenant";
import mongoose from "mongoose";

export async function PATCH(request: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  const { id } = await Promise.resolve(params);
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as null | {
    status?: "approved" | "rejected" | "pending";
    reviewNotes?: string;
  };

  const status = body?.status;
  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await dbConnect();

  const app = await SellerApplicationModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        reviewedAt: status === "pending" ? undefined : new Date(),
        reviewNotes: body?.reviewNotes?.trim() || undefined,
      },
    },
    { new: true }
  ).lean();

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // keep user document in sync
  if (status === "approved") {
    await UserModel.findByIdAndUpdate((app as any).userId, { $set: { sellerStatus: "approved", role: "seller" } });

    const baseSlug = String((app as any).storeSlug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    const storeSlug = baseSlug || `seller-${String((app as any).userId).slice(-6)}`;

    // Ensure slug is unique. If taken, suffix with -2, -3, ...
    let uniqueSlug = storeSlug;
    for (let i = 2; i < 50; i++) {
      const existing = await TenantModel.findOne({ slug: uniqueSlug }).select({ _id: 1, ownerId: 1 }).lean();
      if (!existing) break;
      if (String((existing as any).ownerId) === String((app as any).userId)) break;
      uniqueSlug = `${storeSlug}-${i}`;
    }

    await TenantModel.findOneAndUpdate(
      { ownerId: String((app as any).userId) },
      {
        $set: {
          name: (app as any).storeName,
          slug: uniqueSlug,
          description: `Seller store: ${(app as any).storeName}`,
          isDisabled: false,
          ownerId: String((app as any).userId),
          payoutMethod: (app as any).payoutMethod || "bank",
          payoutAccount: (app as any).payoutAccount || "",
        },
      },
      { upsert: true, new: true }
    );
  } else if (status === "rejected") {
    await UserModel.findByIdAndUpdate((app as any).userId, { $set: { sellerStatus: "rejected", role: "user" } });
  } else {
    await UserModel.findByIdAndUpdate((app as any).userId, { $set: { sellerStatus: "pending", role: "user" } });
  }

  return NextResponse.json({
    application: {
      id: String((app as any)._id),
      userId: String((app as any).userId),
      email: (app as any).email,
      username: (app as any).username,
      storeName: (app as any).storeName,
      storeSlug: (app as any).storeSlug,
      phone: (app as any).phone,
      country: (app as any).country,
      city: (app as any).city,
      addressLine1: (app as any).addressLine1,
      addressLine2: (app as any).addressLine2,
      payoutMethod: (app as any).payoutMethod,
      payoutAccount: (app as any).payoutAccount,
      idDocumentName: (app as any).idDocumentName,
      status: (app as any).status,
      submittedAt: (app as any).submittedAt,
      reviewedAt: (app as any).reviewedAt,
      reviewNotes: (app as any).reviewNotes,
      createdAt: (app as any).createdAt,
      updatedAt: (app as any).updatedAt,
    },
  });
}
