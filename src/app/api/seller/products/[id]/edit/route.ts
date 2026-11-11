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

// GET - Fetch single product for editing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  const { id } = await params;

  await dbConnect();

  const tenant = await TenantModel.findOne({ ownerId: String((auth.user as any)._id) }).lean();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const product = await ProductModel.findOne({
    _id: id,
    tenantId: String((tenant as any)._id),
  }).lean();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      id: String((product as any)._id),
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
      isArchived: (product as any).isArchived,
      isPrivate: (product as any).isPrivate,
    },
  });
}

// PUT - Update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  const { id } = await params;
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

  const file = form.get("image");
  const uploadedFile = typeof file === "object" && file && "arrayBuffer" in file ? (file as File) : null;

  if (!name || name.length < 3) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!description || description.length < 10) return NextResponse.json({ error: "Description is required" }, { status: 400 });
  if (!categoryName || categoryName.length < 2) return NextResponse.json({ error: "Category is required" }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Price must be > 0" }, { status: 400 });
  if (stock !== null && (!Number.isFinite(stock) || stock < 0)) return NextResponse.json({ error: "Stock must be a non-negative number or blank for unlimited" }, { status: 400 });

  await dbConnect();

  const tenant = await TenantModel.findOne({ ownerId: String((auth.user as any)._id) }).lean();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const product = await ProductModel.findOne({
    _id: id,
    tenantId: String((tenant as any)._id),
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Update slug if name changed
  const baseSlug = toSlug(name);
  if (baseSlug && baseSlug !== product.slug) {
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const exists = await ProductModel.findOne({ slug, _id: { $ne: id } }).select({ _id: 1 }).lean();
      if (!exists) break;
      slug = `${baseSlug}-${i}`;
    }
    product.slug = slug;
  }

  // Handle image upload
  if (uploadedFile && uploadedFile.size > 0) {
    const saved = await saveImageToVercelBlob({
      file: uploadedFile,
      baseName: `${product.slug}-image`,
      size: 512,
    });

    (product as any).images = [
      {
        id: saved.url,
        url: saved.url,
        alt: saved.alt || name,
      },
    ];
  }

  product.name = name;
  product.description = description;
  product.price = price;
  (product as any).stock = stock;
  (product as any).materials = materials || undefined;
  (product as any).craftRegion = craftRegion || undefined;
  (product as any).refundPolicy = refundPolicy || undefined;
  product.category = {
    id: toSlug(categoryName),
    name: categoryName,
    slug: toSlug(categoryName),
    color: product.category?.color || "#2A9D8F",
  };

  await product.save();

  return NextResponse.json({
    ok: true,
    product: {
      id: String(product._id),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      stock: (product as any).stock ?? null,
      materials: (product as any).materials ?? "",
      craftRegion: (product as any).craftRegion ?? "",
      refundPolicy: (product as any).refundPolicy ?? "",
    },
  });
}
