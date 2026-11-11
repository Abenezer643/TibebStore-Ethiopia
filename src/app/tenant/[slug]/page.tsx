import { Suspense } from 'react';
import { TenantHomeContainer } from '@/components/tenants/TenantHomeContainer';
import { Skeleton } from '@/components/ui/Skeleton';

export default async function TenantHomePage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = await Promise.resolve(params);
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="flex gap-12 mb-16">
          <Skeleton className="h-48 w-48" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="lg:col-span-3 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      </div>
    }>
      <TenantHomeContainer tenantSlug={resolved.slug} />
    </Suspense>
  );
}
