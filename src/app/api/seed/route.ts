
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TenantModel } from "@/models/Tenant";
import { ProductModel } from "@/models/Product";
import { UserModel } from "@/models/User";
import { MOCK_TENANTS } from "@/types/mock-data";
import { MOCK_PRODUCTS } from "@/types/mock-data";
import { hashPassword, makeSessionCookie, signSession, toSafeUser } from "@/lib/auth";

const SUPER_ADMIN_EMAIL = "admin@tibebstore.com";

export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Require a privately configured admin password
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  // Optional: ensure super admin exists in dev
  const url = new URL(request.url);
  const resetAdmin = url.searchParams.get("resetAdmin") === "true";

  if (adminPassword) {
    const email = SUPER_ADMIN_EMAIL;
    const existing = await UserModel.findOne({ email });
    if (!existing || resetAdmin) {
      const passwordHash = await hashPassword(adminPassword);
      const user = existing
        ? await UserModel.findByIdAndUpdate(
            existing._id,
            {
              $set: {
                passwordHash,
                role: "super-admin",
                isSuspended: false,
              },
            },
            { new: true }
          )
        : await UserModel.create({
            email,
            username: "admin",
            passwordHash,
            role: "super-admin",
            sellerStatus: "none",
            isSuspended: false,
          });

      const token = signSession({ id: String((user as any)._id), role: (user as any).role });
      const cookie = makeSessionCookie(token);
      const res = NextResponse.json({ ok: true, admin: toSafeUser(user as any), resetAdmin });
      res.cookies.set(cookie.name, cookie.value, cookie);
      return res;
    }
  }

  const results: {
    tenants: Array<{ slug: string; action: "created" | "skipped" | "updated" }>;
    products: Array<{ slug: string; action: "created" | "skipped" | "updated" }>;
  } = { tenants: [], products: [] };

  for (const t of MOCK_TENANTS) {
    const existing = await TenantModel.findOne({ slug: t.slug });
    if (!existing) {
      await TenantModel.create({
        name: t.name,
        slug: t.slug,
        description: t.description,
        isDisabled: false,
        ownerId: t.ownerId,
        stripeAccountId: t.stripeAccountId,
        stripeDetailsSubmitted: t.stripeDetailsSubmitted,
        logo: t.logo,
      });
      results.tenants.push({ slug: t.slug, action: "created" });
      continue;
    }

    const patch = {
      name: t.name,
      description: t.description,
      isDisabled: (existing as any).isDisabled ?? false,
      ownerId: t.ownerId,
      stripeAccountId: t.stripeAccountId,
      stripeDetailsSubmitted: t.stripeDetailsSubmitted,
      logo: t.logo,
    };

    const changed = Object.entries(patch).some(([k, v]) => {
      return (existing as any)[k] !== v;
    });

    if (changed) {
      await TenantModel.updateOne({ _id: existing._id }, { $set: patch });
      results.tenants.push({ slug: t.slug, action: "updated" });
    } else {
      results.tenants.push({ slug: t.slug, action: "skipped" });
    }
  }

  const tenantsInDb = await TenantModel.find({}).select({ slug: 1 }).lean();
  const tenantSlugToId = new Map<string, string>();
  for (const t of tenantsInDb) {
    tenantSlugToId.set(String((t as any).slug), String((t as any)._id));
  }

  for (const p of MOCK_PRODUCTS) {
    const tenantSlug = MOCK_TENANTS.find((t) => t.id === p.tenantId)?.slug;
    const tenantMongoId = tenantSlug ? tenantSlugToId.get(tenantSlug) : undefined;
    if (!tenantMongoId) {
      continue;
    }

    const existing = await ProductModel.findOne({ slug: p.slug });
    const patch = {
      tenantId: tenantMongoId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      category: p.category,
      images: p.images,
      materials: p.materials,
      craftRegion: p.craftRegion,
      refundPolicy: p.refundPolicy,
      isArchived: !!p.isArchived,
      isPrivate: !!p.isPrivate,
    };

    if (!existing) {
      await ProductModel.create(patch);
      results.products.push({ slug: p.slug, action: "created" });
      continue;
    }

    const changed = Object.entries(patch).some(([k, v]) => {
      const cur = (existing as any)[k];
      if (Array.isArray(v) || (v && typeof v === "object")) {
        return JSON.stringify(cur) !== JSON.stringify(v);
      }
      return cur !== v;
    });

    if (changed) {
      await ProductModel.updateOne({ _id: existing._id }, { $set: patch });
      results.products.push({ slug: p.slug, action: "updated" });
    } else {
      results.products.push({ slug: p.slug, action: "skipped" });
    }
  }

  const tenantCount = await TenantModel.countDocuments();
  const productCount = await ProductModel.countDocuments();
  return NextResponse.json({ ok: true, tenantsInDb: tenantCount, productsInDb: productCount, results });
}
