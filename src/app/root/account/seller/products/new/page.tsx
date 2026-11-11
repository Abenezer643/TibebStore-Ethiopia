"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_CATEGORIES } from "@/types/mock-data";
import { Package, DollarSign, Layers, ImagePlus, X, Upload, ArrowLeft, Tag, FileText, Hash } from "lucide-react";

export default function SellerNewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (user.isSuspended) {
      router.replace("/account");
      return;
    }
    if (user.role !== "seller" || user.sellerStatus !== "approved") {
      router.replace("/account/become-seller");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const canSave = useMemo(() => {
    return name.trim().length > 2 && Number(price) > 0 && category.trim().length > 1 && description.trim().length > 10;
  }, [name, price, category, description]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const limitedFiles = files.slice(0, 5 - imageFiles.length);
    if (limitedFiles.length === 0) {
      toast("error", "Maximum 5 images allowed");
      return;
    }

    const newFiles = [...imageFiles, ...limitedFiles].slice(0, 5);
    setImageFiles(newFiles);

    const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews].slice(0, 5));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  const save = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      const form = new FormData();
      form.set("name", name);
      form.set("price", price);
      form.set("stock", stock);
      form.set("category", category);
      form.set("description", description);
      imageFiles.forEach((file) => {
        form.append("images", file);
      });

      const res = await fetch("/api/seller/products/create", { method: "POST", body: form });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to create product");
      }

      toast("success", "Product created successfully!");
      router.push("/account/seller/products");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Add Product</h1>
            <p className="text-sm text-text-secondary">Create a new listing for your store</p>
          </div>
        </div>
        <Link href="/account/seller/products">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </Link>
      </div>

      {/* Product Details Section */}
      <Card className="p-6 sm:p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[rgba(15,23,42,0.10)]">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Product Details</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Package className="h-4 w-4 text-text-secondary" />
                Product Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Handwoven Mesob Basket"
                className="w-full h-11 px-4 rounded-xl border border-[rgba(15,23,42,0.10)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-text-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Layers className="h-4 w-4 text-text-secondary" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[rgba(15,23,42,0.10)] bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a category</option>
                {MOCK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <DollarSign className="h-4 w-4 text-text-secondary" />
                Price (ETB)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full h-11 px-4 rounded-xl border border-[rgba(15,23,42,0.10)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-text-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Hash className="h-4 w-4 text-text-secondary" />
                Stock Quantity
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Leave blank for unlimited"
                min="0"
                className="w-full h-11 px-4 rounded-xl border border-[rgba(15,23,42,0.10)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-text-secondary/50"
              />
              <p className="text-xs text-text-secondary">
                {stock === "" || stock === undefined
                  ? "Blank = Made to order / unlimited"
                  : Number(stock) === 0
                  ? "0 = Out of stock (hidden from buyers)"
                  : `Buyers can order up to ${stock} units`}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FileText className="h-4 w-4 text-text-secondary" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product in detail — materials, dimensions, craftsmanship story, care instructions..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(15,23,42,0.10)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-text-secondary/50 resize-none leading-relaxed"
            />
            <p className="text-xs text-text-secondary text-right">{description.length}/500 characters (min 10)</p>
          </div>
        </div>
      </Card>

      {/* Images Section */}
      <Card className="p-6 sm:p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[rgba(15,23,42,0.10)]">
            <ImagePlus className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-text-primary">Product Images</h2>
              <p className="text-xs text-text-secondary">Add up to 5 photos. First image will be the cover.</p>
            </div>
          </div>

          {/* Image Previews Grid */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl border-2 border-[rgba(15,23,42,0.10)] group-hover:border-primary/50 transition-colors"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase bg-primary text-white px-2 py-0.5 rounded-md">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-[rgba(15,23,42,0.10)] text-text-secondary rounded-full flex items-center justify-center shadow-sm hover:bg-error hover:text-white hover:border-error transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add more button if under 5 */}
              {imageFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[rgba(15,23,42,0.15)] hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all group"
                >
                  <Upload className="h-6 w-6 text-text-secondary group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-semibold text-text-secondary group-hover:text-primary transition-colors">Add More</span>
                </button>
              )}
            </div>
          )}

          {/* Upload Area */}
          {imageFiles.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-12 rounded-xl border-2 border-dashed border-[rgba(15,23,42,0.15)] hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  Click to upload images
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  PNG, JPG, WEBP up to 5 images
                </p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
            disabled={imageFiles.length >= 5}
          />

          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{imageFiles.length}/5 images selected</span>
            {imageFiles.length > 0 && imageFiles.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline font-semibold"
              >
                Add more images
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => router.push("/account/seller/products")} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {!canSave && (
              <p className="text-xs text-text-secondary hidden sm:block">Fill in all required fields to save</p>
            )}
            <Button
              variant="primary"
              onClick={save}
              disabled={!canSave || isSaving}
              isLoading={isSaving}
              className="gap-2 min-w-[140px]"
            >
              <Package className="h-4 w-4" />
              Create Product
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
