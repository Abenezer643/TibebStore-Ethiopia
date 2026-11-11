import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { UserModel } from "@/models/User";
import { SellerApplicationModel } from "@/models/SellerApplication";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as null | {
    storeName?: string;
    phone?: string;
    country?: string;
    city?: string;
    addressLine1?: string;
    addressLine2?: string;
    payoutMethod?: "bank" | "paypal";
    payoutAccount?: string;
    idDocumentName?: string;
  };

  const storeName = body?.storeName?.trim() ?? "";
  const phone = body?.phone?.trim() ?? "";
  const country = body?.country?.trim() ?? "";
  const city = body?.city?.trim() ?? "";
  const addressLine1 = body?.addressLine1?.trim() ?? "";
  const addressLine2 = body?.addressLine2?.trim() || undefined;
  const payoutMethod = body?.payoutMethod;
  const payoutAccount = body?.payoutAccount?.trim() ?? "";
  const idDocumentName = body?.idDocumentName?.trim() || undefined;

  if (!storeName || !phone || !country || !city || !addressLine1 || !payoutAccount || (payoutMethod !== "bank" && payoutMethod !== "paypal")) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await dbConnect();

  const userId = String((auth.user as any)._id);

  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { sellerStatus: "pending" } },
    { new: true }
  ).lean();

  if (!updated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeSlug = storeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const app = await SellerApplicationModel.findOneAndUpdate(
    { userId: (auth.user as any)._id },
    {
      $set: {
        email: (updated as any).email,
        username: (updated as any).username,
        storeName,
        storeSlug,
        phone,
        country,
        city,
        addressLine1,
        addressLine2,
        payoutMethod,
        payoutAccount,
        idDocumentName,
        status: "pending",
        submittedAt: new Date(),
        reviewedAt: undefined,
        reviewNotes: undefined,
      },
    },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({
    ok: true,
    user: {
      id: String((updated as any)._id),
      email: (updated as any).email,
      username: (updated as any).username,
      role: (updated as any).role,
      sellerStatus: (updated as any).sellerStatus,
      isSuspended: !!(updated as any).isSuspended,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
    },
    application: app
      ? {
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
        }
      : null,
  });
}
