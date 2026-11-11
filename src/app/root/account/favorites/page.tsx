"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { Heart, Trash2 } from "lucide-react";

type FavoriteProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: { id: string; name: string; slug: string; color?: string };
  images: Array<{ id: string; url: string; alt: string }>;
  craftRegion: string;
  tenantName?: string;
  tenantSlug?: string;
};

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }

    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/favorites");
        const json = await res.json();
        if (res.ok) {
          setFavorites(json.favorites || []);
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [isHydrated, isAuthenticated, user, router]);

  const removeFavorite = async (productId: string) => {
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setFavorites(favorites.filter((f) => f.id !== productId));
        toast("success", "Removed from favorites");
      } else {
        throw new Error(json?.error || "Failed to remove");
      }
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Failed to remove");
    } finally {
      setRemovingId(null);
    }
  };

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-sm font-bold text-text-secondary uppercase">Loading favorites...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">My Favorites</h2>
            <p className="mt-1 text-sm font-bold text-text-secondary uppercase">
              {favorites.length} saved {favorites.length === 1 ? "item" : "items"}
            </p>
          </div>
          <Link href="/products">
            <Button variant="outline">Browse Products</Button>
          </Link>
        </div>
      </Card>

      {favorites.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
          <h3 className="text-lg font-bold text-text-primary mb-2">No favorites yet</h3>
          <p className="text-sm text-text-secondary mb-6">
            Start adding products to your favorites by clicking the heart icon on products you love.
          </p>
          <Link href="/products">
            <Button>Discover Products</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((product) => {
            const firstImage = product.images?.[0];
            const productUrl = product.tenantSlug 
              ? `/tenant/${product.tenantSlug}/products/${product.slug}`
              : `/products/${product.slug}`;
            return (
              <Card key={product.id} variant="elevated" className="group relative flex flex-col h-full p-0 overflow-hidden">
                <Link href={productUrl} className="flex-1">
                  <div className="relative aspect-square overflow-hidden">
                    {firstImage?.url ? (
                      <img
                        src={firstImage.url}
                        alt={firstImage.alt || product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[rgba(66,157,254,0.05)]">
                        <span className="text-sm font-medium text-text-secondary">No image</span>
                      </div>
                    )}
                    <Badge className="absolute left-3 top-3 z-10 bg-[rgba(255,255,255,0.90)] backdrop-blur-md">
                      {product.category?.name}
                    </Badge>
                  </div>

                  <div className="p-5 space-y-3 bg-[rgba(255,255,255,0.60)] backdrop-blur-lg">
                    <h3 className="font-semibold text-text-primary text-lg line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>

                    {product.tenantName && (
                      <p className="text-xs text-text-secondary">by {product.tenantName}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">{formatCurrency(product.price)}</span>
                      <span className="text-xs text-text-secondary bg-[rgba(66,157,254,0.08)] px-2 py-1 rounded-full">
                        {product.craftRegion}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => removeFavorite(product.id)}
                    disabled={removingId === product.id}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center hover:bg-error hover:text-white transition-colors disabled:opacity-50"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
