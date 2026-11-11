import { Suspense } from 'react';
import { ProductDetailContainer } from '@/components/products/ProductDetailContainer';
import { Skeleton } from '@/components/ui/Skeleton';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { productId } = await params;

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    }>
      <ProductDetailContainer productId={productId} />
    </Suspense>
  );
}
