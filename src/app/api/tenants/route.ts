import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TenantModel } from "@/models/Tenant";

export async function GET() {
  await dbConnect();
  const docs = await TenantModel.find({}).sort({ createdAt: -1 }).lean();
  const tenants = docs.map((t) => ({
    id: String(t._id),
    name: t.name,
    slug: t.slug,
    description: t.description ?? "",
    logo: (t as any).logo,
    ownerId: t.ownerId,
    stripeAccountId: t.stripeAccountId,
    stripeDetailsSubmitted: !!t.stripeDetailsSubmitted,
    isDisabled: !!t.isDisabled,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
  return NextResponse.json({ tenants });
}
