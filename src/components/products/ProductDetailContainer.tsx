"use client";

// Sign-up page with email verification
import { Product, Review } from '@/types';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { ShoppingCart, Heart, Share2, MapPin, ShieldCheck, RefreshCcw, Store, Flag, CreditCard, MessageCircle, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/hooks/useCart';
import { ReviewForm } from '@/components/products/ReviewForm';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProductDetailContainerProps {
  productId: string;
}

export function ProductDetailContainer({ productId }: ProductDetailContainerProps) {
  const { toast } = useToast();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [didLoad, setDidLoad] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>("other");
  const [reportMessage, setReportMessage] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Share functionality
  const shareProduct = async () => {
    if (!product) return;

    const url = window.location.href;
    const title = product.name;
    const text = `Check out this beautiful Ethiopian craft: ${product.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast("success", "Link copied to clipboard!");
      } catch {
        toast("error", "Failed to copy link");
      }
    }
  };

  const tenant = useMemo(() => {
    const p = product as any;
    const slug = typeof p?.tenantSlug === "string" ? p.tenantSlug : undefined;
    const tenantLabel = p?.tenantName ?? p?.tenantSlug ?? "";

    return {
      slug: slug ?? "",
      name: tenantLabel,
    };
  }, [product]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; avgRating: number; distribution: Record<number, number> } | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const fetchReviews = async (pid: string) => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(pid)}`);
      const j = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setReviews([]);
        setReviewSummary({ count: 0, avgRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
        setCanReview(false);
        return;
      }
      setReviews(Array.isArray(j?.reviews) ? j.reviews : []);
      setReviewSummary(
        j?.summary ?? { count: 0, avgRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
      );
      setCanReview(Boolean(j?.canReview));
    } catch {
      setReviews([]);
      setReviewSummary({ count: 0, avgRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      setCanReview(false);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const scrollToReviews = () => {
    if (typeof window === 'undefined') return;
    document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!product?.id) {
      setReviews([]);
      setReviewSummary(null);
      setIsLoadingReviews(false);
      setCanReview(false);
      return;
    }
    void fetchReviews(product.id);
  }, [product?.id]);

  const orderedReviews = useMemo(() => {
    if (!user?.id) return reviews;
    const mine: any[] = [];
    const others: any[] = [];
    for (const r of reviews) {
      if (String(r?.userId ?? '') === String(user.id)) mine.push(r);
      else others.push(r);
    }
    return [...mine, ...others];
  }, [reviews, user?.id]);

  // Check if product is in favorites
  useEffect(() => {
    if (!isAuthenticated || !product?.id) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      try {
        const res = await fetch("/api/favorites");
        const json = await res.json();
        if (res.ok && Array.isArray(json.favorites)) {
          const isFav = json.favorites.some((f: any) => String(f.id) === String(product.id));
          setIsFavorite(isFav);
        }
      } catch (error) {
        console.error("Failed to check favorite status:", error);
      }
    };

    checkFavorite();
  }, [isAuthenticated, product?.id]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast("error", "Please sign in to add favorites");
      return;
    }
    if (!product?.id) return;

    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        const res = await fetch(`/api/favorites?productId=${product.id}`, { method: "DELETE" });
        const json = await res.json();
        if (res.ok) {
          setIsFavorite(false);
          toast("success", "Removed from favorites");
        } else {
          throw new Error(json?.error || "Failed to remove");
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        const json = await res.json();
        if (res.ok) {
          setIsFavorite(true);
          toast("success", "Added to favorites");
        } else {
          throw new Error(json?.error || "Failed to add");
        }
      }
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Failed to update favorites");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setDidLoad(false);
    setLoadError(null);
    fetch(`/api/products/${encodeURIComponent(productId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load product (${r.status})`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setProduct(json?.product ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setProduct(null);
        setLoadError(err instanceof Error ? err.message : 'Failed to load product');
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
        setDidLoad(true);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Fetch related products (same category + same seller)
  useEffect(() => {
    if (!product?.id) {
      setRelatedProducts([]);
      setSellerProducts([]);
      return;
    }

    const fetchRelated = async () => {
      setIsLoadingRelated(true);
      try {
        // Fetch products from same seller
        const sellerRes = await fetch(`/api/products?tenantSlug=${encodeURIComponent(tenant.slug)}&limit=8`);
        const sellerJson = await sellerRes.json().catch(() => null);
        const sellerItems = Array.isArray(sellerJson?.products) 
          ? sellerJson.products.filter((p: any) => p.id !== product.id).slice(0, 6)
          : [];
        setSellerProducts(sellerItems);

        // Fetch products from same category
        const categoryRes = await fetch(`/api/products?categoryId=${product.category.id}&limit=8`);
        const categoryJson = await categoryRes.json().catch(() => null);
        const categoryItems = Array.isArray(categoryJson?.products)
          ? categoryJson.products.filter((p: any) => p.id !== product.id && !sellerItems.some((s: any) => s.id === p.id)).slice(0, 6)
          : [];
        setRelatedProducts(categoryItems);
      } catch (err) {
        console.error("Failed to fetch related products:", err);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    if (tenant.slug) {
      fetchRelated();
    }
  }, [product?.id, product?.category?.id, tenant.slug]);

  // Submit report
  const submitReport = async () => {
    if (!product) return;
    
    setIsSubmittingReport(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          tenantSlug: tenant.slug,
          tenantName: tenant.name,
          reason: reportReason,
          message: reportMessage,
        }),
      });

      const json = await res.json();
      
      if (res.ok) {
        toast("success", "Report submitted. Our team will review it.");
        setShowReportModal(false);
        setReportReason("other");
        setReportMessage("");
      } else {
        toast("error", json.error || "Failed to submit report");
      }
    } catch (err) {
      toast("error", "Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!product && didLoad) {
    console.error('Product not found:', productId, loadError ? `(${loadError})` : '');
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-10 shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-text-primary">Product Not Found</h1>
          <p className="mb-4 text-text-secondary">The product you're looking for doesn't exist.</p>
          <p className="mb-4 text-sm text-text-secondary">Looking for: {productId}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const handleAddToCart = () => {
    if (product.stock === 0) { // stock=0 means out of stock; undefined/null means unlimited
      toast("error", "This item is out of stock");
      return;
    }
    addItem(product, tenant.slug);
    toast("success", `Added ${product.name} to cart!`);
  };

  const isOutOfStock = product.stock === 0; // only true when explicitly set to 0

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left: Images */}
        <ProductImageGallery images={product.images} />

        {/* Right: Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{product.category.name}</Badge>
              {product.createdAt && (
                <span className="text-xs text-text-secondary">Listed {timeAgo(product.createdAt)}</span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-none text-text-primary">
              {product.name}
            </h1>

            <div className="flex items-center gap-4">
              <StarRating rating={reviewSummary?.avgRating ?? 0} />
              <button
                type="button"
                onClick={scrollToReviews}
                className="text-sm text-primary hover:underline"
              >
                {reviewSummary ? `${reviewSummary.count} Reviews` : 'Reviews'}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(product.price)}
              </div>
              {product.stock === 0 ? (
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Out of Stock</Badge>
              ) : product.stock == null ? (
                <Badge variant="secondary">Made to Order</Badge>
              ) : (product.stock ?? 0) <= 3 ? (
                <Badge variant="warning">Only {product.stock} left</Badge>
              ) : (
                <Badge variant="secondary">In Stock ({product.stock})</Badge>
              )}
            </div>
          </div>

          <div className="border-y border-[rgba(15,23,42,0.10)] py-6 space-y-4">
            <p className="font-bold text-lg">
              Crafted by <Link href={`/tenant/${tenant.slug}`} className="text-primary hover:underline">{tenant.name || "Store"}</Link>
            </p>
            <p className="text-text-secondary leading-relaxed">
              {product.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <MapPin className="h-4 w-4" />
                {product.craftRegion || 'Ethiopia'}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <ShieldCheck className="h-4 w-4" />
                Authentic Material
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button size="lg" className="flex-1 h-16 text-lg" onClick={handleAddToCart} disabled={isOutOfStock}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button 
                variant={isFavorite ? "primary" : "outline"} 
                size="lg" 
                className="h-16 px-6 bg-[rgba(255,255,255,0.60)] border-[rgba(15,23,42,0.10)]"
                onClick={toggleFavorite}
                disabled={isTogglingFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            </div>
            <Button variant="outline" className="w-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-white" onClick={shareProduct}>
              <Share2 className="mr-2 h-4 w-4" />
              Share this masterpiece
            </Button>
          </div>

          {/* Seller Card */}
          <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-text-primary">{tenant.name || "Artisan Store"}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={reviewSummary?.avgRating ?? 0} />
                  <span className="text-sm text-text-secondary">({reviewSummary?.count ?? 0} reviews)</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
                  <MapPin className="h-4 w-4" />
                  {product.craftRegion || "Ethiopia"}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Link href={`/tenant/${tenant.slug}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Store className="mr-2 h-4 w-4" />
                  Visit Store
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setShowReportModal(true)}
              >
                <Flag className="mr-2 h-4 w-4" />
                Report
              </Button>
            </div>
          </div>

          {/* Trust & Safety Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-text-primary">Buy with Confidence</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-xs text-text-primary">Payment Protected</h4>
                </div>
                <p className="text-[10px] text-text-secondary">
                  Secure checkout via TibebStore
                </p>
              </div>
              <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCcw className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-xs text-text-primary">Return Policy</h4>
                </div>
                <p className="text-[10px] text-text-secondary">
                  {product.refundPolicy === 'no-refunds' ? 'Final Sale' : `${product.refundPolicy} returns`}
                </p>
              </div>
              <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-xs text-text-primary">Handmade Authentic</h4>
                </div>
                <p className="text-[10px] text-text-secondary">
                  Verified artisan craft
                </p>
              </div>
              <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-xs text-text-primary">Support</h4>
                </div>
                <p className="text-[10px] text-text-secondary">
                  Contact us anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-text-primary">Report Listing</h3>
              <button onClick={() => setShowReportModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Reason</label>
                <select 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(15,23,42,0.10)] p-2 text-sm"
                >
                  <option value="scam">Scam / Misleading</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="copyright">Copyright / Stolen Photos</option>
                  <option value="wrong-category">Wrong Category</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Details (optional)</label>
                <textarea 
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Tell us more about the issue..."
                  className="w-full rounded-lg border border-[rgba(15,23,42,0.10)] p-2 text-sm h-24 resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600" 
                  onClick={submitReport}
                  isLoading={isSubmittingReport}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Submit Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* More from this Artisan */}
      {sellerProducts.length > 0 && (
        <section className="mt-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">More from {tenant.name || "this Artisan"}</h2>
            <Link href={`/tenant/${tenant.slug}`} className="text-primary hover:underline text-sm">
              View all products
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sellerProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group">
                <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                        <Store className="h-8 w-8 text-text-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-text-primary truncate">{p.name}</h3>
                    <p className="text-primary font-bold text-sm mt-1">{formatCurrency(p.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Items */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">You Might Also Like</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group">
                <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-secondary/20 flex items-center justify-center">
                        <Store className="h-8 w-8 text-text-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-text-primary truncate">{p.name}</h3>
                    <p className="text-primary font-bold text-sm mt-1">{formatCurrency(p.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section id="product-reviews" className="mt-24 border-t border-[rgba(15,23,42,0.10)] pt-16">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-12">Customer Reviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Summary */}
          <div className="space-y-6">
            <div className="flex items-end gap-4">
              <span className="text-7xl font-bold leading-none text-text-primary">
                {reviewSummary ? reviewSummary.avgRating.toFixed(1) : "0.0"}
              </span>
              <div className="space-y-1">
                <StarRating rating={reviewSummary?.avgRating ?? 0} />
                <p className="text-sm text-text-secondary">
                  {reviewSummary ? `Based on ${reviewSummary.count} reviews` : "Loading reviews..."}
                </p>
              </div>
            </div>
            {/* Bar chart */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-4">
                  <span className="text-sm w-4 text-text-secondary">{stars}</span>
                  <div className="flex-1 h-3 rounded-full bg-[rgba(255,255,255,0.40)] border border-[rgba(15,23,42,0.10)]">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{
                        width: reviewSummary && reviewSummary.count
                          ? `${Math.round(((reviewSummary.distribution?.[stars] ?? 0) / reviewSummary.count) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-8">
             {canReview ? (
               <ReviewForm productId={product.id} onChanged={() => fetchReviews(product.id)} />
             ) : (
               <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-6 shadow-md">
                 <p className="text-sm text-text-secondary">
                   Only delivered buyers can leave a review.
                 </p>
               </div>
             )}
             {isLoadingReviews ? (
               <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-6 shadow-md">
                 <p className="text-sm text-text-secondary">Loading reviews...</p>
               </div>
             ) : reviews.length === 0 ? (
               <div className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-6 shadow-md">
                 <p className="text-sm text-text-secondary">No reviews yet</p>
               </div>
             ) : (
               orderedReviews.map((r) => (
                 <div
                   key={r.id}
                   className={`rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] p-6 shadow-md ${
                     user?.id && String(r?.userId ?? '') === String(user.id) ? 'ring-2 ring-primary' : ''
                   }`}
                 >
                   <div className="flex justify-between items-start mb-4">
                     <div className="flex gap-4 items-center">
                       <div className="h-12 w-12 rounded-full bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)] flex items-center justify-center font-semibold overflow-hidden">
                         {r?.user?.avatar?.url ? (
                           <img src={r.user.avatar.url} alt={r.user.username} className="h-full w-full object-cover" />
                         ) : (
                           <span className="uppercase">{String(r?.user?.username ?? 'U')[0]}</span>
                         )}
                       </div>
                       <div>
                         <h4 className="font-semibold text-text-primary">{r?.user?.username ?? 'User'}</h4>
                         <StarRating rating={Number(r?.rating ?? 0)} className="scale-75 origin-left" />
                       </div>
                     </div>
                     <span className="text-xs text-text-secondary">
                       {r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                     </span>
                   </div>
                   <p className="text-text-primary leading-relaxed">{r?.description ?? ''}</p>
                 </div>
               ))
             )}
          </div>
        </div>
      </section>
    </div>
  );
}
