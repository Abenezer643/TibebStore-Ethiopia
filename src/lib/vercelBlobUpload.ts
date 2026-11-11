import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { validateUploadedImage, MAX_IMAGE_BYTES } from './imageUpload';

export async function saveImageToVercelBlob(params: {
  file: File;
  baseName: string;
  size: number;
}) {
  try {
    // Validate the image first
    const validation = validateUploadedImage(params.file);
    if (!validation.ok) {
      throw new Error(validation.error);
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${params.baseName}-${timestamp}.png`;

    // Convert and optimize the image
    const bytes = Buffer.from(await params.file.arrayBuffer());
    const image = sharp(bytes);
    const optimizedImage = await image
      .resize(params.size, params.size, { fit: 'cover', position: 'centre' })
      .png({ quality: 90 })
      .toBuffer();

    // Upload to Vercel Blob
    const blob = await put(filename, optimizedImage, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blob.url) {
      throw new Error('Failed to upload image to Vercel Blob');
    }

    // Get image metadata
    const meta = await image.metadata().catch(() => null);

    return {
      url: blob.url,
      alt: params.baseName,
      width: params.size,
      height: params.size,
      id: filename,
      meta,
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload image');
  }
}

// Function to delete an image from Vercel Blob
export async function deleteImageFromVercelBlob(filename: string) {
  try {
    await del(filename, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    throw new Error('Failed to delete image');
  }
}
