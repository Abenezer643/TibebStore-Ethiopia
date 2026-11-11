import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAuth } from "@/lib/requireAuth";
import { UserModel } from "@/models/User";
import { saveImageToVercelBlob } from "@/lib/vercelBlobUpload";
import { validateUploadedImage } from "@/lib/imageUpload";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("avatar");
  const uploadedFile = typeof file === "object" && file && "arrayBuffer" in file ? (file as File) : null;
  if (!uploadedFile || uploadedFile.size === 0) {
    return NextResponse.json({ error: "Missing avatar" }, { status: 400 });
  }

  const validation = validateUploadedImage(uploadedFile);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await dbConnect();

  const saved = await saveImageToVercelBlob({
    file: uploadedFile,
    baseName: `avatar-${String((auth.user as any)._id)}`,
    size: 256,
  });

  const updated = await UserModel.findByIdAndUpdate(
    (auth.user as any)._id,
    {
      $set: {
        avatar: {
          id: saved.id,
          url: saved.url,
          alt: saved.alt,
          width: saved.width,
          height: saved.height,
        },
      },
    },
    { new: true }
  ).lean();

  return NextResponse.json({
    ok: true,
    avatar: (updated as any)?.avatar,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  await dbConnect();

  await UserModel.findByIdAndUpdate((auth.user as any)._id, { $unset: { avatar: 1 } }, { new: false });

  return NextResponse.json({
    ok: true,
    avatar: null,
  });
}
