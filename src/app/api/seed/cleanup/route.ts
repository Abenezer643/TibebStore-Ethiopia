import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { TenantModel } from "@/models/Tenant";
import { UserModel } from "@/models/User";

// DELETE - Remove all mock products and tenants (keep only mark and beka's products)
export async function DELETE(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Get mark and beka's tenant IDs
  const markUser = await UserModel.findOne({ email: "mark@gmail.com" }).lean();
  const bekaUser = await UserModel.findOne({ email: "beka@gmail.com" }).lean();

  const keepTenantIds: string[] = [];

  if (markUser) {
    const markTenant = await TenantModel.findOne({ ownerId: String((markUser as any)._id) }).lean();
    if (markTenant) keepTenantIds.push(String((markTenant as any)._id));
  }

  if (bekaUser) {
    const bekaTenant = await TenantModel.findOne({ ownerId: String((bekaUser as any)._id) }).lean();
    if (bekaTenant) keepTenantIds.push(String((bekaTenant as any)._id));
  }

  // Delete all products NOT from mark or beka's tenants
  const deleteResult = await ProductModel.deleteMany({
    tenantId: { $nin: keepTenantIds },
  });

  // Delete old tenants (ethiopian-artisans and any other mock tenants)
  const deleteTenantsResult = await TenantModel.deleteMany({
    _id: { $nin: keepTenantIds },
  });

  // Delete old seller account if exists
  const oldSeller = await UserModel.findOne({ email: "seller@tibebstore.com" });
  if (oldSeller && !markUser && !bekaUser) {
    await UserModel.deleteOne({ email: "seller@tibebstore.com" });
  }

  const remainingProducts = await ProductModel.countDocuments();
  const remainingTenants = await TenantModel.countDocuments();

  return NextResponse.json({
    ok: true,
    message: "Mock products removed",
    deletedProducts: deleteResult.deletedCount,
    deletedTenants: deleteTenantsResult.deletedCount,
    remainingProducts,
    remainingTenants,
    keptTenantIds: keepTenantIds,
  });
}
