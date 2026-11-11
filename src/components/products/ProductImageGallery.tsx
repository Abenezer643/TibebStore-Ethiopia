"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: { url: string; alt: string }[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [hasError, setHasError] = useState(false);

  if (!Array.isArray(images) || images.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="aspect-square w-full rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md overflow-hidden flex items-center justify-center">
          <span className="text-sm font-bold text-text-secondary">No image</span>
        </div>
      </div>
    );
  }

  const active = images[Math.min(activeImage, images.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square w-full rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md overflow-hidden">
        {hasError ? (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-sm font-bold text-text-secondary">Image unavailable</span>
          </div>
        ) : (
          <img
            src={active.url}
            alt={active.alt}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveImage(index);
              setHasError(false);
            }}
            className={cn(
              "aspect-square rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md transition-all hover:shadow-lg cursor-pointer",
              activeImage === index ? "ring-2 ring-primary ring-offset-2 border-primary" : "opacity-70 hover:opacity-100"
            )}
          >
            <img src={image.url} alt={image.alt} className="h-full w-full object-cover rounded-xl" />
          </button>
        ))}
      </div>
    </div>
  );
}
