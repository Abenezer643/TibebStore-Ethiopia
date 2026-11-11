import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireApprovedSeller } from "@/lib/requireAuth";
import { TenantModel } from "@/models/Tenant";

export async function GET(request: Request) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  await dbConnect();
  const tenant = await TenantModel.findOne({ ownerId: String((auth.user as any)._id) }).lean();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    tenant: {
      id: String((tenant as any)._id),
      name: (tenant as any).name,
      slug: (tenant as any).slug,
      description: (tenant as any).description ?? "",
      logo: (tenant as any).logo,
      ownerId: (tenant as any).ownerId,
      stripeAccountId: (tenant as any).stripeAccountId,
      stripeDetailsSubmitted: !!(tenant as any).stripeDetailsSubmitted,
      isDisabled: !!(tenant as any).isDisabled,
      createdAt: (tenant as any).createdAt,
      updatedAt: (tenant as any).updatedAt,
    },
  });
}
