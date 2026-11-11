import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TenantModel } from "@/models/Tenant";
import { UserModel } from "@/models/User";
import { ProductModel } from "@/models/Product";
import { ReviewModel } from "@/models/Review";

export async function GET() {
  try {
    await dbConnect();

  // Get all tenants with approved sellers
  const tenants = await TenantModel.find({ isDisabled: { $ne: true } })
    .select({ _id: 1, name: 1, slug: 1, logo: 1, description: 1, ownerId: 1 })
    .lean();

  if (!tenants.length) {
    return NextResponse.json({ artisans: [] });
  }

  // Get owner IDs and product counts
  const artisans = await Promise.all(
    tenants.map(async (tenant: any) => {
      // Get seller info
      const seller = await UserModel.findOne({ _id: tenant.ownerId })
        .select({ username: 1, avatar: 1 })
        .lean();

      // Get products for this tenant
      const products = await ProductModel.find({ tenantId: tenant._id, isArchived: { $ne: true }, isPrivate: { $ne: true } })
        .select({ _id: 1, category: 1 })
        .lean();

      const productIds = products.map((p: any) => p._id);
      const productCount = products.length;

      // Get specialty from most common category
      const categoryCount: Record<string, number> = {};
      products.forEach((p: any) => {
        if (p.category?.name) {
          categoryCount[p.category.name] = (categoryCount[p.category.name] || 0) + 1;
        }
      });

      const topCategory = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Artisan";

      // Calculate real rating from reviews
      let rating = 0;
      let reviewCount = 0;
      if (productIds.length > 0) {
        const reviews = await ReviewModel.find({ productId: { $in: productIds } })
          .select({ rating: 1 })
          .lean();
        reviewCount = reviews.length;
        if (reviewCount > 0) {
          const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
          rating = Math.round((totalRating / reviewCount) * 10) / 10; // Round to 1 decimal
        }
      }

      return {
        id: String(tenant._id),
        name: tenant.name,
        slug: tenant.slug,
        specialty: topCategory,
        location: "Ethiopia",
        image: tenant.logo?.url || seller?.avatar?.url || null,
        products: productCount,
        rating: rating || null, // null if no reviews
        reviewCount,
        description: tenant.description || "",
      };
    })
  );

  // Filter out artisans with no products and sort by product count
  const activeArtisans = artisans
    .filter((a) => a.products > 0)
    .sort((a, b) => b.products - a.products)
    .slice(0, 8);

  return NextResponse.json({ artisans: activeArtisans });
  } catch (error) {
    console.error('Error fetching artisans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artisans', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
