"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loader2, Upload, X, User } from "lucide-react";

interface ImageUploadProps {
  type?: "avatar" | "logo";
  currentImage?: { url: string; alt?: string } | null;
  onUpload: (image: { id: string; url: string }) => void;
  className?: string;
}

export function ImageUpload({
  type = "avatar",
  currentImage,
  onUpload,
  className = "",
}: ImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage?.url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast("error", "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast("error", "File too large. Maximum size is 5MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        onUpload(json.image);
        toast("success", "Image uploaded successfully");
      } else {
        toast("error", json.error || "Failed to upload image");
        setPreview(currentImage?.url || null);
      }
    } catch (error) {
      toast("error", "Failed to upload image");
      setPreview(currentImage?.url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isAvatar = type === "avatar";

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {isAvatar ? (
        // Avatar upload
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center ${
                isUploading ? "opacity-50" : ""
              }`}
            >
              {preview ? (
                <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {preview ? "Change" : "Upload"}
            </Button>
            {preview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                className="text-red-500 hover:text-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Logo upload
        <div className="space-y-3">
          <div
            className={`w-full h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Logo" className="max-h-28 max-w-full object-contain" />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Click to upload logo</p>
              </div>
            )}
          </div>
          {preview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className="w-full text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Remove Logo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
