"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_CATEGORIES } from "@/types/mock-data";
import { Package, DollarSign, Layers, ImagePlus, X, Upload, ArrowLeft, Tag, FileText, Hash, Loader2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number | null;
  category: { id: string; name: string; slug: string };
  images: Array<{ id: string; url: string; alt: string }>;
};

export default function SellerEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const { toast } = useToast();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentImages, setCurrentImages] = useState<Array<{ id: string; url: string; alt: string }>>([]);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load product data
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
      return;
    }
    if (!productId) {
      router.replace("/account/seller/products");
      return;
    }

    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/seller/products/${productId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load product");

        const p = json.product as Product;
        setName(p.name);
        setPrice(String(p.price));
        setStock(p.stock === null || p.stock === undefined ? "" : String(p.stock));
        setCategory(p.category?.name ?? "");
        setDescription(p.description);
        if (p.images?.length) {
          setCurrentImages(p.images);
        }
      } catch (error) {
        toast("error", error instanceof Error ? error.message : "Failed to load product");
        router.replace("/account/seller/products");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [isHydrated, isAuthenticated, user, productId, router, toast]);

  const canSave = useMemo(() => {
    return name.trim().length > 2 && Number(price) > 0 && category.trim().length > 1 && description.trim().length > 10;
  }, [name, price, category, description]);

  const totalImageCount = currentImages.length + imageFiles.length;

  // Handle multiple image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = currentImages.length + imageFiles.length + files.length;
    if (totalImages > 5) {
      toast("error", "Maximum 5 images allowed");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // Remove existing image
  const removeExistingImage = (index: number) => {
    setCurrentImages(currentImages.filter((_, i) => i !== index));
  };

  // Remove new image preview
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  const save = async () => {
    if (!canSave || !productId) return;

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
      // Send which existing images to keep
      form.set("keepImages", JSON.stringify(currentImages.map(img => img.id)));

      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PUT",
        body: form,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to update product");
      }

      toast("success", "Product updated");
      router.push("/account/seller/products");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-text-secondary">Loading product...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Edit Product</h1>
            <p className="text-sm text-text-secondary">Update your listing details</p>
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

          {/* All images grid */}
          {(currentImages.length > 0 || imagePreviews.length > 0) && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {/* Current images */}
              {currentImages.map((img, index) => (
                <div key={img.id} className="relative group aspect-square">
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover rounded-xl border-2 border-[rgba(15,23,42,0.10)] group-hover:border-primary/50 transition-colors"
                  />
                  {index === 0 && imagePreviews.length === 0 && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase bg-primary text-white px-2 py-0.5 rounded-md">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-[rgba(15,23,42,0.10)] text-text-secondary rounded-full flex items-center justify-center shadow-sm hover:bg-error hover:text-white hover:border-error transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* New image previews */}
              {imagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative group aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl border-2 border-primary/30 group-hover:border-primary/50 transition-colors"
                  />
                  <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-secondary text-text-secondary px-2 py-0.5 rounded-md">
                    New
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-[rgba(15,23,42,0.10)] text-text-secondary rounded-full flex items-center justify-center shadow-sm hover:bg-error hover:text-white hover:border-error transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add more button */}
              {totalImageCount < 5 && (
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

          {/* Upload Area when no images */}
          {totalImageCount === 0 && (
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
            disabled={totalImageCount >= 5}
          />

          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{totalImageCount}/5 images</span>
            {totalImageCount > 0 && totalImageCount < 5 && (
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
              Update Product
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
