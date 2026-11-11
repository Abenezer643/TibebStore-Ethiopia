"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { MOCK_CATEGORIES } from '@/types/mock-data';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const selectedPriceMin = searchParams.get('priceMin');
  const selectedPriceMax = searchParams.get('priceMax');

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (selectedCategory === slug) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    router.push(`?${params.toString()}`);
  };

  const handlePriceClick = (min: number | null, max: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (min === null && max === null) {
      params.delete('priceMin');
      params.delete('priceMax');
    } else {
      params.set('priceMin', String(min));
      if (max !== null) {
        params.set('priceMax', String(max));
      } else {
        params.delete('priceMax');
      }
    }
    router.push(`?${params.toString()}`);
  };

  const isPriceSelected = (min: number | null, max: number | null) => {
    const currentMin = selectedPriceMin ? Number(selectedPriceMin) : null;
    const currentMax = selectedPriceMax ? Number(selectedPriceMax) : null;
    return currentMin === min && currentMax === max;
  };

  const priceRanges = [
    { label: 'Under ETB 1,000', min: 0, max: 1000 },
    { label: 'ETB 1,000 - 5,000', min: 1000, max: 5000 },
    { label: 'ETB 5,000 - 10,000', min: 5000, max: 10000 },
    { label: 'Over ETB 10,000', min: 10000, max: null },
  ];

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(255,255,255,0.35)] shadow-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {MOCK_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
            >
              <Badge
                variant={selectedCategory === category.slug ? 'primary' : 'outline'}
                className="cursor-pointer transition-all py-1.5 px-3 "
              >
                {category.name}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(255,255,255,0.35)] shadow-md">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Price Range</h3>
        <div className="space-y-3">
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => handlePriceClick(range.min, range.max)}
              className={`flex items-center gap-3 w-full text-left group transition-all ${
                isPriceSelected(range.min, range.max) ? 'text-primary' : ''
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                isPriceSelected(range.min, range.max) 
                  ? 'border-primary bg-primary' 
                  : 'border-[rgba(15,23,42,0.12)] group-hover:border-primary/50'
              }`}>
                {isPriceSelected(range.min, range.max) && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <span className={`text-sm group-hover:text-primary transition-colors ${
                isPriceSelected(range.min, range.max) ? 'font-semibold' : 'text-text-secondary'
              }`}>
                {range.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full bg-[rgba(66,157,254,0.08)] border-[rgba(66,157,254,0.3)]"
        onClick={() => router.push(window.location.pathname)}
      >
        Clear All Filters
      </Button>
    </div>
  );
}

import { Button } from '@/components/ui/Button';
