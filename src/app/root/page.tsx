"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Globe,
  Wallet,
  ShoppingBasket,
  Gem,
  Shirt,
  CircleDashed,
  Palette,
  Star,
  Heart,
  MapPin,
  Package,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/products/ProductCard';
import { MOCK_CATEGORIES } from '@/types/mock-data';

type Artisan = {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  location: string;
  image: string | null;
  products: number;
  rating: number | null;
  reviewCount?: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: { id: string; name: string; slug: string; color?: string };
  images: Array<{ id: string; url: string; alt: string }>;
  craftRegion: string;
  tenantName?: string;
  tenantSlug?: string;
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingArtisans, setIsLoadingArtisans] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=8');
        if (!res.ok) {
          console.error('Failed to fetch products:', res.status, res.statusText);
          setFeaturedProducts([]);
          return;
        }
        const json = await res.json();
        if (Array.isArray(json.products)) {
          setFeaturedProducts(json.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setFeaturedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchArtisans = async () => {
      try {
        const res = await fetch('/api/artisans');
        if (!res.ok) {
          console.error('Failed to fetch artisans:', res.status, res.statusText);
          setArtisans([]);
          return;
        }
        const json = await res.json();
        if (Array.isArray(json.artisans)) {
          setArtisans(json.artisans);
        }
      } catch (error) {
        console.error('Failed to fetch artisans:', error);
        setArtisans([]);
      } finally {
        setIsLoadingArtisans(false);
      }
    };

    fetchProducts();
    fetchArtisans();
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'leather':
        return Wallet;
      case 'baskets':
        return ShoppingBasket;
      case 'jewelry':
        return Gem;
      case 'textiles':
        return Shirt;
      case 'pottery':
        return CircleDashed;
      case 'paintings':
        return Palette;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/TheHeroImage.png"
            alt="Hero Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-white/10" />
        </div>
        
        {/* Floating Background Decorations */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl z-0 pointer-events-none" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl z-0 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="space-y-8 flex flex-col items-center">
            <div className="bg-white/40 backdrop-blur-md rounded-[24px] p-6 md:p-8 shadow-xl">
              <h1 className="heading-1 text-text-primary">
                Discover <span className="text-primary">Ethiopia's</span> Finest Crafts
              </h1>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row justify-center w-full">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto group">
                  Explore Products
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-white/60 hover:bg-white/80">
                  Meet Our Artisans
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-12 pt-12">
              <div className="text-center">
                <div className="text-5xl font-black text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">500+</div>
                <div className="text-xs font-black text-white uppercase tracking-[0.2em] mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Artisans</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">10K+</div>
                <div className="text-xs font-black text-white uppercase tracking-[0.2em] mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Products</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">50+</div>
                <div className="text-xs font-black text-white uppercase tracking-[0.2em] mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Browse Collections</Badge>
            <h2 className="heading-2 text-text-primary mb-4">Shop by Category</h2>
            <p className="max-w-2xl mx-auto text-text-secondary">
              Explore our diverse collections of authentic Ethiopian handcrafted treasures
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {MOCK_CATEGORIES.map((category, index) => {
              const Icon = getCategoryIcon(category.slug);
              return (
                <Link key={category.id} href={`/products?category=${category.slug}`}>
                  <Card 
                    variant="default" 
                    className="flex flex-col items-center justify-center gap-4 text-center aspect-square p-6 group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#429DFE] flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {category.name}
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[rgba(66,157,254,0.03)]" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <Badge variant="secondary" className="mb-4">Featured Collection</Badge>
              <h2 className="heading-2 text-text-primary mb-4">Discover Our Finest Crafts</h2>
              <p className="max-w-xl text-text-secondary">
                Handpicked treasures from our most talented Ethiopian artisans
              </p>
            </div>
            <Link href="/products" className="mt-6 md:mt-0">
              <Button variant="outline" className="group">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="aspect-[3/4] animate-pulse bg-[rgba(66,157,254,0.05)]">
                  <div className="w-full h-full" />
                </Card>
              ))
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-text-secondary">No products available yet. Check back soon!</p>
              </div>
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Our Promise</Badge>
            <h2 className="heading-2 text-text-primary mb-4">Why Choose Tibeb Store</h2>
            <p className="max-w-2xl mx-auto text-text-secondary">
              We're committed to preserving Ethiopian heritage while empowering artisans globally
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card variant="elevated" className="p-8 text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#429DFE] flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Unique Artistry</h3>
              <p className="text-text-secondary leading-relaxed">
                Every piece tells a story of centuries-old Ethiopian heritage and craftsmanship passed down through generations.
              </p>
            </Card>
            
            <Card variant="elevated" className="p-8 text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#10b981] flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Fair Trade</h3>
              <p className="text-text-secondary leading-relaxed">
                Our direct-to-artisan model ensures fair compensation and sustainable livelihoods for talented craftspeople.
              </p>
            </Card>
            
            <Card variant="elevated" className="p-8 text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#9b51e0] flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Global Shipping</h3>
              <p className="text-text-secondary leading-relaxed">
                Bringing the beauty of Ethiopian culture to customers worldwide with care and secure packaging.
              </p>
            </Card>
          </div>
        </div>
      </section>

      
      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <Card variant="elevated" className="p-12 md:p-16 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-[rgba(66,157,254,0.15)] rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-[rgba(155,81,224,0.15)] rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <h2 className="heading-2 text-text-primary mb-4">
                Ready to Discover Ethiopian Artistry?
              </h2>
              <p className="max-w-2xl mx-auto text-text-secondary mb-8">
                Join thousands of customers who have found unique, handcrafted treasures that tell a story.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products">
                  <Button size="lg" className="group">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="secondary" size="lg">
                    <Heart className="mr-2 h-5 w-5" />
                    Become a Seller
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Featured Artisans */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[rgba(155,81,224,0.03)]" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Meet the Makers</Badge>
            <h2 className="heading-2 text-text-primary mb-4">Featured Artisans</h2>
            <p className="max-w-2xl mx-auto text-text-secondary">
              Talented craftspeople preserving Ethiopian heritage through their art
            </p>
          </div>
          
          {isLoadingArtisans ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : artisans.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              No artisans found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {artisans.map((artisan) => (
                <Link key={artisan.id} href={`/tenant/${artisan.slug}`}>
                  <Card variant="elevated" className="p-6 text-center group cursor-pointer h-full">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[rgba(255,255,255,0.35)] group-hover:border-primary transition-colors bg-[rgba(255,255,255,0.40)]">
                        {artisan.image ? (
                          <img src={artisan.image} alt={artisan.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-secondary text-2xl font-bold">
                            {artisan.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#429DFE] text-white text-xs px-3 py-1 rounded-full font-semibold">
                        {artisan.specialty}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mt-4">{artisan.name}</h3>
                    <div className="flex items-center justify-center gap-1 text-text-secondary text-sm mt-1">
                      <MapPin className="w-3 h-3" />
                      {artisan.location}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-text-secondary">{artisan.products} products</span>
                      </div>
                      {artisan.rating !== null ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="text-text-secondary">{artisan.rating}</span>
                        </div>
                      ) : (
                        <span className="text-text-secondary text-xs">No reviews</span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/about">
              <Button variant="outline" className="group">
                View All Artisans
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      
      
      {/* Promo Banner */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[#429DFE]" />
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/pattern/1200/400')] opacity-10 bg-cover" />
            
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <Badge className="bg-white/20 text-white border-white/30 mb-4">Limited Time Offer</Badge>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Get 20% Off Your First Order
                </h3>
                <p className="text-white/80">
                  Use code <span className="font-bold text-white">WELCOME20</span> at checkout
                </p>
              </div>
              <Link href="/products">
                <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90 shrink-0">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      
      {/* Marketplace Values */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[rgba(66,157,254,0.03)]" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative">
              <div className="aspect-[4/3] rounded-[24px] overflow-hidden shadow-soft border border-[rgba(255,255,255,0.35)]">
                <img
                  src="/Green-AddisAbaba.jpg"
                  alt="Ethiopian Artisans"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">Our Marketplace</Badge>
              <h2 className="heading-2 text-text-primary">
                Connecting <span className="text-primary">Artisans</span> with the World
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Tibeb Store is a vibrant marketplace where talented Ethiopian artisans showcase their unique crafts. 
                Each piece tells a story of heritage, skill, and cultural pride passed down through generations.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Sparkles, text: 'Authentic handcrafted treasures' },
                  { icon: ShieldCheck, text: 'Direct support to artisans' },
                  { icon: Globe, text: 'Worldwide shipping available' },
                  { icon: Heart, text: 'Preserving cultural heritage' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.15)] flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-text-primary font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              
              <Link href="/about">
                <Button variant="secondary" className="mt-4">
                  Meet Our Artisans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      
          </div>
  );
}
