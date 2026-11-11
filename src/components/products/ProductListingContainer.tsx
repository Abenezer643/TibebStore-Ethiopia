"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { SearchBar } from './SearchBar';
import { ProductFilters } from './ProductFilters';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import type { Product } from '@/types';

export function ProductListingContainer() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search')?.toLowerCase() || '';
  const category = searchParams.get('category');
  const priceMin = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : null;
  const priceMax = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : null;
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [isLoading, setIsLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsInitialLoading(true);
    fetch('/api/products')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setProducts(Array.isArray(json?.products) ? json.products : []);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search) || 
                         product.description.toLowerCase().includes(search);
    const matchesCategory = !category || product.category.slug === category;
    
    const productPrice = product.price;
    const matchesPrice = (priceMin === null || productPrice >= priceMin) && 
                        (priceMax === null || productPrice < priceMax);
    
    const isVisible = !product.isArchived && !product.isPrivate;
    return matchesSearch && matchesCategory && matchesPrice && isVisible;
  });

  const loadMore = () => {
    if (visibleProducts < filteredProducts.length) {
      setIsLoading(true);
      setTimeout(() => {
        setVisibleProducts((prev) => prev + 8);
        setIsLoading(false);
      }, 800);
    }
  };

  const observerTarget = useInfiniteScroll(loadMore);

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6">
      <div className="mb-12 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
            Explore Crafts
          </h1>
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
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24">
            <ProductFilters />
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        <Drawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          title="Filter Crafts"
        >
          <ProductFilters />
        </Drawer>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {isInitialLoading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-6 w-3/4" variant="text" />
                  <Skeleton className="h-4 w-1/2" variant="text" />
                </div>
              ))
            ) : null}

            {!isInitialLoading
              ? filteredProducts.slice(0, visibleProducts).map((product) => (
              <ProductCard key={product.id} product={product} />
              ))
              : null}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[rgba(66,157,254,0.1)] shadow-md">
                <Search className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary">No crafts found</h3>
              <p className="mt-2 text-text-secondary">
                Try adjusting your filters or search query
              </p>
            </div>
          )}

          {/* Loading States */}
          {isLoading && (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-6 w-3/4" variant="text" />
                  <Skeleton className="h-4 w-1/2" variant="text" />
                </div>
              ))}
            </div>
          )}

          {/* Observer Target */}
          <div ref={observerTarget} className="h-10" />
        </div>
      </div>
    </div>
  );
}
