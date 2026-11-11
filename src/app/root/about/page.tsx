import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <div className="bg-background">
      <section className="py-16 bg-[rgba(66,157,254,0.06)] border-b border-[rgba(255,255,255,0.35)]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-6">
            <Badge variant="outline" className="bg-[rgba(255,255,255,0.70)] backdrop-filter-[saturate(180%)_blur(20px)] border-[rgba(15,23,42,0.12)] px-4 py-2 text-sm">
              About TibebStore
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl leading-[0.95] text-text-primary">
              A marketplace built for Ethiopian makers
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              TibebStore connects artisans and small studios across Ethiopia with customers worldwide—without losing the story behind the craft.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Card variant="elevated">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">Our mission</h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Help Ethiopian craftsmanship thrive through fair trade, direct-to-maker commerce, and modern storefront tools.
              </p>
            </Card>
            <Card variant="elevated">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">How multi-tenant works</h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Each artisan brand gets its own storefront, products, and checkout flow—while still being discoverable on the main marketplace.
              </p>
            </Card>
            <Card variant="elevated">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">What we sell</h2>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Leather goods, woven baskets, traditional textiles, jewelry, pottery, and contemporary art—made with heritage and intention.
              </p>
            </Card>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link href="/products">
              <Button variant="outline" className="w-full sm:w-auto">
                Browse products
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="primary" className="w-full sm:w-auto">
                Contact us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
