import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";

const PLACEHOLDER_URL = "/uploads/placeholder.png";

export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "remove"; // remove | replace
  const dryRun = url.searchParams.get("dryRun") === "true";

  if (mode !== "remove" && mode !== "replace") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  await dbConnect();

  const docs = await ProductModel.find({ "images.url": PLACEHOLDER_URL })
    .select({ _id: 1, slug: 1, images: 1 })
    .lean();

  const results: Array<{ id: string; slug: string; action: "removed" | "replaced" | "skipped" }> = [];

  for (const p of docs as any[]) {
    const images = Array.isArray(p.images) ? p.images : [];
    const nextImages =
      mode === "remove"
        ? images.filter((img: any) => String(img?.url) !== PLACEHOLDER_URL)
        : images.map((img: any) => {
            if (String(img?.url) !== PLACEHOLDER_URL) return img;
            return { ...img, url: "https://placehold.co/800x800?text=Product" };
          });

    const changed = JSON.stringify(images) !== JSON.stringify(nextImages);
    if (!changed) {
      results.push({ id: String(p._id), slug: String(p.slug), action: "skipped" });
      continue;
    }

    if (!dryRun) {
      await ProductModel.updateOne({ _id: p._id }, { $set: { images: nextImages } });
    }

    results.push({ id: String(p._id), slug: String(p.slug), action: mode === "remove" ? "removed" : "replaced" });
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    mode,
    matched: docs.length,
    updated: results.filter((r) => r.action !== "skipped").length,
    results,
  });
}
