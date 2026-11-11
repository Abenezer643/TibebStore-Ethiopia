import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAuth";
import { SellerApplicationModel } from "@/models/SellerApplication";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.response) return admin.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const filter: any = {};
  if (status === "pending" || status === "approved" || status === "rejected") {
    filter.status = status;
  }

  await dbConnect();
  const docs = await SellerApplicationModel.find(filter).sort({ submittedAt: -1 }).lean();

  const applications = docs.map((a: any) => ({
    id: String(a._id),
    userId: String(a.userId),
    email: a.email,
    username: a.username,
    storeName: a.storeName,
    storeSlug: a.storeSlug,
    phone: a.phone,
    country: a.country,
    city: a.city,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2,
    payoutMethod: a.payoutMethod,
    payoutAccount: a.payoutAccount,
    idDocumentName: a.idDocumentName,
    status: a.status,
    submittedAt: a.submittedAt,
    reviewedAt: a.reviewedAt,
    reviewNotes: a.reviewNotes,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  return NextResponse.json({ applications });
}
