"use client";

import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/products/ProductCard';
import { SearchBar } from '@/components/products/SearchBar';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Button } from '@/components/ui/Button';
import { Filter, ShoppingBag, MapPin, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import type { Product, Tenant } from '@/types';

interface TenantHomeContainerProps {
  tenantSlug: string;
}

export function TenantHomeContainer({ tenantSlug }: TenantHomeContainerProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get('search')?.toLowerCase() || '';
  const category = searchParams.get('category');
  const { toast } = useToast();

  const normalizedTenantSlug = useMemo(() => {
    try {
      return decodeURIComponent(tenantSlug).trim().toLowerCase();
    } catch {
      return tenantSlug.trim().toLowerCase();
    }
  }, [tenantSlug]);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [tenant, setTenant] = useState<(Tenant & { isDisabled?: boolean }) | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ avgRating: number; count: number }>({ avgRating: 0, count: 0 });

  // Share functionality
  const shareStore = async () => {
    if (!tenant) return;

    const url = window.location.href;
    const title = `${tenant.name} - Tibeb Store`;
    const text = `Hello! I'm selling on Tibeb Store! 🎨 Check out ${tenant.name} for authentic Ethiopian handcrafted treasures. ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        toast("success", "Store link copied to clipboard!");
      } catch {
        toast("error", "Failed to copy link");
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    setIsInitialLoading(true);
    fetch('/api/tenants')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const tenants = Array.isArray(json?.tenants) ? (json.tenants as any[]) : [];
        const found =
          tenants.find((t) => String(t?.slug ?? '').trim().toLowerCase() === normalizedTenantSlug) ?? null;
        setTenant(found);
      })
      .catch(() => {
        if (cancelled) return;
        setTenant(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedTenantSlug]);

  useEffect(() => {
    if (!tenant?.id) return;
    let cancelled = false;
    fetch(`/api/products?tenantId=${encodeURIComponent(String(tenant.id))}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setProducts(Array.isArray(json?.products) ? json.products : []);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [tenant?.id]);

  // Fetch reviews for all tenant products to calculate real rating
  useEffect(() => {
    if (products.length === 0) return;
    
    const productIds = products.map(p => p.id).join(',');
    
    Promise.all(
      products.map(p => 
        fetch(`/api/reviews?productId=${p.id}`).then(r => r.json()).catch(() => ({ summary: { count: 0, avgRating: 0 } }))
      )
    ).then(results => {
      const totalReviews = results.reduce((acc, r) => acc + (r.summary?.count || 0), 0);
      const totalRating = results.reduce((acc, r) => acc + ((r.summary?.avgRating || 0) * (r.summary?.count || 0)), 0);
      const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      setReviewSummary({ avgRating, count: totalReviews });
    }).catch(() => {
      setReviewSummary({ avgRating: 0, count: 0 });
    });
  }, [products]);

  const tenantProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);
      const matchesCategory = !category || product.category.slug === category;
      const isVisible = !product.isArchived && !product.isPrivate;
      return matchesSearch && matchesCategory && isVisible;
    });
  }, [products, search, category]);

  if (isInitialLoading && !tenant) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-10 text-center shadow-md">
          <p className="text-sm text-text-secondary">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-10 text-center shadow-md">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Store Not Found</h1>
          <p className="mt-4 text-sm text-text-secondary">
            This store does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (tenant?.isDisabled) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-10 text-center shadow-md">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Store Unavailable</h1>
          <p className="mt-4 text-sm text-text-secondary">
            This store is currently disabled by an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Tenant Header/Hero */}
      <section className="py-16 bg-[rgba(66,157,254,0.06)] border-b border-[rgba(255,255,255,0.35)]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="shrink-0">
              <div className="h-32 w-32 md:h-48 md:w-48 rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md flex items-center justify-center">
                {tenant.logo ? (
                  <img src={tenant.logo.url} alt={tenant.name} className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-6xl font-bold text-primary">{tenant.name[0]}</span>
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">{tenant.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Harar, Ethiopia
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {reviewSummary.count > 0 ? `${reviewSummary.avgRating.toFixed(1)} (${reviewSummary.count} Reviews)` : 'No reviews yet'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4" />
                    {tenantProducts.length} Products
                  </div>
                </div>
              </div>
              
              <p className="max-w-2xl text-lg text-text-secondary leading-relaxed">
                {tenant?.description}
              </p>

              <div className="flex gap-4">
                <Button variant="outline" onClick={shareStore}>Share</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight text-text-primary">Our Collection</h2>
              <Button
                variant="outline"
                className="lg:hidden bg-[rgba(66,157,254,0.08)] border-[rgba(66,157,254,0.3)]"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className="mr-2 h-5 w-5" />
                Filters
              </Button>
            </div>
            <SearchBar />
          </div>

          <div className="flex flex-col gap-12 lg:flex-row">
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24">
                <ProductFilters />
              </div>
            </aside>

            <Drawer
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              title="Filter Products"
            >
              <ProductFilters />
            </Drawer>

            <div className="flex-1">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {tenantProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {tenantProducts.length === 0 && (
                <div className="py-20 text-center rounded-2xl bg-[rgba(255,255,255,0.40)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)]">
                  <h3 className="text-2xl font-semibold text-text-primary">No products found</h3>
                  <p className="text-text-secondary mt-2">Try different filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
