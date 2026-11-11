import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireApprovedSeller } from "@/lib/requireAuth";
import { TenantModel } from "@/models/Tenant";
import { saveImageToVercelBlob } from "@/lib/vercelBlobUpload";
import { validateUploadedImage } from "@/lib/imageUpload";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed",
      hint: "Use POST with multipart/form-data and a 'logo' file field.",
    },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("logo");
  const uploadedFile = typeof file === "object" && file && "arrayBuffer" in file ? (file as File) : null;
  if (!uploadedFile || uploadedFile.size === 0) {
    return NextResponse.json({ error: "Missing logo" }, { status: 400 });
  }

  const validation = validateUploadedImage(uploadedFile);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await dbConnect();

  const ownerId = String((auth.user as any)._id);
  const tenant = await TenantModel.findOne({ ownerId });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const saved = await saveImageToVercelBlob({
    file: uploadedFile,
    baseName: `tenant-${String((tenant as any)._id)}-logo`,
    size: 256,
  });

  (tenant as any).logo = {
    id: saved.id,
    url: saved.url,
    alt: saved.alt,
    width: saved.width,
    height: saved.height,
  };
  await tenant.save();

  const updated = await TenantModel.findById((tenant as any)._id).lean();

  return NextResponse.json({
    ok: true,
    logo: (updated as any)?.logo,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApprovedSeller(request);
  if (auth.response) return auth.response;

  await dbConnect();

  const ownerId = String((auth.user as any)._id);
  const tenant = await TenantModel.findOne({ ownerId });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  await TenantModel.findByIdAndUpdate((tenant as any)._id, { $unset: { logo: 1 } }, { new: false });

  return NextResponse.json({
    ok: true,
    logo: null,
  });
}
