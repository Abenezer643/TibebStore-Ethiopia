"use client";

import Link from 'next/link';
import { Sparkles, Instagram, Facebook, Twitter, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      
      if (!res.ok) throw new Error(json?.error || 'Failed to subscribe');
      
      setMessage({ type: 'success', text: 'Subscribed!' });
      setEmail('');
    } catch {
      setMessage({ type: 'error', text: 'Failed to subscribe' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <footer className="w-full relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[rgba(66,157,254,0.03)]" />
      
      <div className="relative z-10 bg-[rgba(255,255,255,0.60)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.35)]">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3 group">
                <img src="/Headerlogo.png" alt="TibebStore" className="h-12 w-auto group-hover:scale-105 transition-all" />
              </Link>
              <p className="text-sm text-text-secondary leading-relaxed">
                Empowering Ethiopian artisans by connecting their unique crafts with the world.
              </p>
              <div className="flex gap-3">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.50)] border border-[rgba(255,255,255,0.35)] flex items-center justify-center text-text-secondary hover:text-primary hover:bg-[rgba(255,255,255,0.80)] transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            {/* Shop */}
            <div>
              <h4 className="mb-6 text-sm font-bold text-text-primary">Shop</h4>
              <ul className="space-y-3">
                <li><Link href="/products" className="text-sm text-text-secondary hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href="/products?featured=true" className="text-sm text-text-secondary hover:text-primary transition-colors">Featured</Link></li>
                <li><Link href="/products" className="text-sm text-text-secondary hover:text-primary transition-colors">Categories</Link></li>
                <li><Link href="/about" className="text-sm text-text-secondary hover:text-primary transition-colors">Artisans</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-6 text-sm font-bold text-text-primary">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">Shipping</Link></li>
                <li><Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">Returns</Link></li>
                <li><Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="mb-6 text-sm font-bold text-text-primary">Stay Connected</h4>
              <p className="text-sm text-text-secondary mb-4">
                Get updates on new crafts and exclusive offers
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-full bg-white/50 border border-white/30 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-10 h-10 rounded-full bg-[#429DFE] text-white flex items-center justify-center hover:bg-[#3688e8] transition-colors shrink-0 disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              {message && (
                <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-success' : 'text-error'}`}>
                  {message.text}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.35)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-secondary">
              © 2026 TibebStore. Handcrafted with pride in Ethiopia.
            </p>
            <div className="flex gap-6">
              <Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">Terms</Link>
              <Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">Privacy</Link>
              <Link href="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">Seller Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
