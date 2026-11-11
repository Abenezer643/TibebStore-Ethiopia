"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  description: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review is too long'),
});

type ReviewInput = z.infer<typeof reviewSchema>;

export function ReviewForm({ productId, onChanged }: { productId: string; onChanged?: () => void }) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      description: '',
    },
  });

  const rating = watch('rating');

  const onSubmit = async (data: ReviewInput) => {
    try {
      if (!isAuthenticated) {
        toast('error', 'Please sign in to leave a review');
        return;
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, rating: data.rating, description: data.description }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? 'Failed to submit review');
      toast('success', 'Thank you for your review!');
      reset();
      onChanged?.();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Failed to submit review');
    }
  };

  const onRemove = async () => {
    try {
      if (!isAuthenticated) {
        toast('error', 'Please sign in');
        return;
      }

      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? 'Failed to remove review');
      toast('success', 'Review removed');
      reset();
      onChanged?.();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Failed to remove review');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-6 space-y-6">
      <h3 className="text-xl font-black uppercase tracking-tight">Write a Review</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-bold uppercase tracking-tight text-text-secondary">Rating</label>
        <StarRating
          interactive
          rating={rating}
          onRatingChange={(val) => setValue('rating', val, { shouldValidate: true })}
        />
        {errors.rating && (
          <p className="text-xs font-bold text-error uppercase">{errors.rating.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold uppercase tracking-tight text-text-secondary">Your Experience</label>
        <textarea
          {...register('description')}
          className="w-full resize-none bg-[rgba(255,255,255,0.50)] backdrop-filter-[saturate(180%)_blur(20px)] border border-[rgba(15,23,42,0.12)] rounded-2xl px-4 py-3 min-h-[120px] text-base text-text-primary placeholder:text-text-secondary transition-all duration-150 ease-out focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
          placeholder="Share your thoughts on the craftsmanship, material, and story of this piece..."
        />
        {errors.description && (
          <p className="text-xs font-bold text-error uppercase">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Submit Review
        </Button>
        <Button type="button" variant="outline" onClick={onRemove} disabled={isSubmitting} className="flex-1">
          Remove My Review
        </Button>
      </div>
    </form>
  );
}
