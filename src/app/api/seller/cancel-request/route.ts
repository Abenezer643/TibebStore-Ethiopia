import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { UserModel } from "@/models/User";
import { SellerApplicationModel } from "@/models/SellerApplication";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  await dbConnect();
  const updated = await UserModel.findByIdAndUpdate(
    (auth.user as any)._id,
    {
      $set: {
        sellerStatus: "none",
        role: "user",
      },
    },
    { new: true }
  ).lean();

  await SellerApplicationModel.findOneAndUpdate(
    { userId: (auth.user as any)._id },
    {
      $set: {
        status: "rejected",
        reviewedAt: new Date(),
        reviewNotes: "Cancelled by user",
      },
    },
    { new: true }
  ).lean();

  if (!updated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ ok: true });
}
