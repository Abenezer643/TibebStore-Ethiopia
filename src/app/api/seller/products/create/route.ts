import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireApprovedSeller } from "@/lib/requireAuth";
import { TenantModel } from "@/models/Tenant";
import { ProductModel } from "@/models/Product";
import { saveImageToVercelBlob } from "@/lib/vercelBlobUpload";

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function POST(request: Request) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const categoryName = String(form.get("category") ?? "").trim();
  const priceRaw = String(form.get("price") ?? "");
  const price = Number(priceRaw);
  const stockRaw = String(form.get("stock") ?? "");
  const stock = stockRaw === "" || stockRaw === "null" ? null : Math.max(0, Math.floor(Number(stockRaw)));
  const materials = String(form.get("materials") ?? "").trim();
  const craftRegion = String(form.get("craftRegion") ?? "").trim();
  const refundPolicy = String(form.get("refundPolicy") ?? "").trim();

  const files = form.getAll("images");
  const uploadedFiles = files.filter(
    (file): file is File => typeof file === "object" && file !== null && "arrayBuffer" in file && (file as File).size > 0
  );

  if (!name || name.length < 3) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!description || description.length < 10) return NextResponse.json({ error: "Description is required" }, { status: 400 });
  if (!categoryName || categoryName.length < 2) return NextResponse.json({ error: "Category is required" }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Price must be > 0" }, { status: 400 });
  if (stock !== null && (!Number.isFinite(stock) || stock < 0)) return NextResponse.json({ error: "Stock must be a non-negative number or blank for unlimited" }, { status: 400 });

  await dbConnect();

  const ownerId = String((auth.user as any)._id);
  let tenant: any = await TenantModel.findOne({ ownerId }).lean();
  if (!tenant) {
    const base = toSlug(String((auth.user as any).username ?? (auth.user as any).email ?? "seller"));
    const baseSlug = base || `seller-${ownerId.slice(-6)}`;
    let uniqueSlug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const existing = await TenantModel.findOne({ slug: uniqueSlug }).select({ _id: 1 }).lean();
      if (!existing) break;
      uniqueSlug = `${baseSlug}-${i}`;
    }

    tenant = await TenantModel.create({
      name: String((auth.user as any).username ?? "Seller Store"),
      slug: uniqueSlug,
      description: "Seller store",
      isDisabled: false,
      ownerId,
      stripeDetailsSubmitted: false,
    });
  }

  const baseSlug = toSlug(name);
  if (!baseSlug) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const exists = await ProductModel.findOne({ slug }).select({ _id: 1 }).lean();
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }

  // Upload all images to Vercel Blob
  const images: Array<{ id: string; url: string; alt: string }> = [];
  for (let i = 0; i < uploadedFiles.length && i < 5; i++) {
    const file = uploadedFiles[i];
    const saved = await saveImageToVercelBlob({
      file,
      baseName: `${slug}-image-${i}`,
      size: 512,
    });
    images.push({
      id: saved.url,
      url: saved.url,
      alt: saved.alt || name,
    });
  }

  const product = await ProductModel.create({
    tenantId: (tenant as any)._id,
    name,
    slug,
    description,
    price,
    category: {
      id: toSlug(categoryName),
      name: categoryName,
      slug: toSlug(categoryName),
      color: "#2A9D8F",
    },
    images,
    stock,
    materials: materials || undefined,
    craftRegion: craftRegion || undefined,
    refundPolicy: refundPolicy || undefined,
    isArchived: false,
    isPrivate: false,
  });

  return NextResponse.json({
    ok: true,
    product: {
      id: String((product as any)._id),
      tenantId: String((product as any).tenantId),
      name: (product as any).name,
      slug: (product as any).slug,
      description: (product as any).description,
      price: (product as any).price,
      category: (product as any).category,
      images: (product as any).images,
      stock: (product as any).stock ?? null,
      materials: (product as any).materials ?? "",
      craftRegion: (product as any).craftRegion ?? "",
      refundPolicy: (product as any).refundPolicy ?? "",
      isArchived: !!(product as any).isArchived,
      isPrivate: !!(product as any).isPrivate,
      createdAt: (product as any).createdAt,
      updatedAt: (product as any).updatedAt,
    },
  });
}
