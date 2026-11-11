import { Suspense } from 'react';
import { ProductListingContainer } from '@/components/products/ProductListingContainer';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <Skeleton className="mb-8 h-20 w-1/2" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <Skeleton className="h-[600px] w-full" />
          <div className="lg:col-span-3 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductListingContainer />
    </Suspense>
  );
}
