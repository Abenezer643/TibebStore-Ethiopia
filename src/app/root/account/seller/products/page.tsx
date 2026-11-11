"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Archive, Trash2, RotateCcw, Pencil } from "lucide-react";

type SellerProduct = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  price: number;
  stock: number | null;
  isArchived: boolean;
  isPrivate: boolean;
};

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/seller/products");
      const json = await res.json();
      setProducts(Array.isArray(json?.products) ? json.products : []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) return;
    if (user.isSuspended) return;
    if (user.role !== "seller" || user.sellerStatus !== "approved") return;
    loadProducts();
  }, [isHydrated, isAuthenticated, user]);

  const handleArchive = async (productId: string, currentStatus: boolean) => {
    setActionLoading(productId);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !currentStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to update");

      toast("success", currentStatus ? "Product unarchived" : "Product archived");
      await loadProducts();
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setActionLoading(productId);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete");

      toast("success", "Product deleted");
      await loadProducts();
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Products</h2>
            <p className="mt-1 text-sm font-bold text-text-secondary uppercase">
              Add and manage your listings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/account/seller/products/new">
              <Button variant="secondary">Add Product</Button>
            </Link>
            <Link href="/account/seller">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-text-secondary uppercase">
            {isLoading ? "Loading..." : products.length === 0 ? "No products yet." : "Your products"}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{products.filter(p => !p.isArchived).length} active</Badge>
            <Badge variant="outline">{products.filter(p => p.isArchived).length} archived</Badge>
          </div>
        </div>
      </Card>

      {products.length > 0 ? (
        <Card className="p-6">
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black uppercase tracking-tight truncate">{p.name}</p>
                    {p.isArchived ? <Badge variant="primary">archived</Badge> : null}
                    {p.isPrivate ? <Badge variant="outline">private</Badge> : null}
                    {p.stock === 0 ? <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">out of stock</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs font-bold text-text-secondary uppercase truncate">{p.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">ETB {p.price}</Badge>
                  {p.stock === null ? (
                    <Badge variant="secondary" className="text-xs">Made to Order</Badge>
                  ) : p.stock > 0 ? (
                    <Badge variant="secondary" className="text-xs">Stock: {p.stock}</Badge>
                  ) : null}
                  
                  {/* Edit Button */}
                  <Link href={`/account/seller/products/edit?id=${p.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === p.id}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  
                  {/* Archive/Unarchive Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === p.id}
                    onClick={() => handleArchive(p.id, p.isArchived)}
                    className="gap-2"
                  >
                    {p.isArchived ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Unarchive</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4" />
                        <span className="hidden sm:inline">Archive</span>
                      </>
                    )}
                  </Button>
                  
                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === p.id}
                    onClick={() => handleDelete(p.id)}
                    className="gap-2 text-error hover:bg-error/10 hover:border-error/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
