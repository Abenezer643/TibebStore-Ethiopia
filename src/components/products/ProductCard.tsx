import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const firstImage = Array.isArray(product.images) ? product.images[0] : undefined;
  const imageUrl = firstImage?.url;
  const imageAlt = firstImage?.alt ?? product.name;

  // Build product URL - use tenant storefront if available
  const tenantSlug = (product as any).tenantSlug;
  const productUrl = tenantSlug 
    ? `/tenant/${tenantSlug}/products/${product.slug}`
    : `/products/${product.slug}`;

  return (
    <Card variant="elevated" className="group relative flex flex-col h-full p-0 overflow-hidden border border-[rgba(255,255,255,0.35)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
      <Link href={productUrl} className="flex-1">
        <div className="relative aspect-square overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[rgba(66,157,254,0.05)]">
              <span className="text-sm font-medium text-text-secondary">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Badge
            className="absolute left-3 top-3 z-10 bg-[rgba(255,255,255,0.90)] backdrop-blur-md text-text-primary border border-[rgba(255,255,255,0.35)] shadow-sm"
          >
            {product.category.name}
          </Badge>
        </div>
        
        <div className="p-5 space-y-3 bg-[rgba(255,255,255,0.60)] backdrop-blur-lg">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text-primary text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <StarRating rating={product.rating ?? 0} className="scale-75 origin-left" />
            <span className="text-xs text-text-secondary">({product.reviewCount ?? 0})</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.35)]">
            <span className="text-xl font-bold text-primary">{formatCurrency(product.price)}</span>
            <div className="flex items-center gap-2">
              {product.stock === 0 ? (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">Out of Stock</Badge>
              ) : product.stock == null ? (
                <Badge variant="secondary" className="text-xs">Made to Order</Badge>
              ) : (product.stock ?? 0) <= 3 ? (
                <Badge variant="warning" className="text-xs">Only {product.stock} left</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">In Stock</Badge>
              )}
              {product.craftRegion && (
                <span className="text-xs text-text-secondary bg-[rgba(66,157,254,0.08)] px-2 py-1 rounded-full">
                  {product.craftRegion}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
