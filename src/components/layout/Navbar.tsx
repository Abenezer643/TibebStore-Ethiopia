"use client";

import Link from 'next/link';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  Wallet,
  ShoppingBasket,
  Gem,
  Shirt,
  CircleDashed,
  Palette,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useState, useRef, useEffect } from 'react';
import { MOCK_CATEGORIES } from '@/types/mock-data';
import { SUPER_ADMIN_EMAIL, useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { getItemCount } = useCart();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Debug function
  const handleMobileMenuToggle = () => {
    console.log('Mobile menu clicked, current state:', isMobileMenuOpen);
    setIsMobileMenuOpen((v) => !v);
  };

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

  const openCategories = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsCategoriesOpen(true);
  };

  const closeCategories = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsCategoriesOpen(false);
    }, 150);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close categories dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    }
    if (isCategoriesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCategoriesOpen]);

  // Simplified mobile menu close - remove click outside for now to debug
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        setIsMobileCategoriesOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isMobileMenuOpen]);

  return (
    <>
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled 
            ? 'bg-[rgba(255,255,255,0.80)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.35)] shadow-soft' 
            : 'bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border-b border-[rgba(255,255,255,0.20)]'
        }`}
      >
      <div className="relative flex h-16 items-center px-4 sm:px-6">
        {/* Logo at left corner */}
        <Link href="/" className="group flex items-center gap-3 absolute left-4 sm:left-6">
          <img src="/Headerlogo.png" alt="TibebStore" className="h-12 w-auto group-hover:scale-105 transition-all" />
        </Link>

        {/* Navigation centered */}
        <nav className="hidden items-center gap-6 lg:flex mx-auto">
            <Link
              href="/"
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#429DFE] group-hover:w-full transition-all duration-300" />
            </Link>

            <div
              ref={categoriesRef}
              className="relative"
              onMouseEnter={openCategories}
              onMouseLeave={closeCategories}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:text-primary transition-colors relative group"
                aria-haspopup="menu"
                aria-expanded={isCategoriesOpen}
                onClick={() => setIsCategoriesOpen((v) => !v)}
              >
                Categories
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#429DFE] group-hover:w-full transition-all duration-300" />
              </button>

              {isCategoriesOpen && (
                <div
                  className="absolute left-0 top-full mt-3 w-64 rounded-[16px] overflow-hidden z-50 bg-[rgba(255,255,255,0.85)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-lg"
                  role="menu"
                >
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-2">
                      {MOCK_CATEGORIES.map((category) => {
                        const Icon = getCategoryIcon(category.slug);
                        return (
                          <Link
                            key={category.id}
                            href={`/products?category=${category.slug}`}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-[rgba(66,157,254,0.05)] transition-colors"
                            role="menuitem"
                          >
                            <span>{category.name}</span>
                            <div className="w-8 h-8 rounded-lg bg-[#429DFE] flex items-center justify-center">
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/products"
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors relative group"
            >
              Shop
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#429DFE] group-hover:w-full transition-all duration-300" />
            </Link>

            <Link
              href="/about"
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors relative group"
            >
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#429DFE] group-hover:w-full transition-all duration-300" />
            </Link>

            <Link
              href="/contact"
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#429DFE] group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

        {/* Right side elements */}
        <div className="flex items-center gap-3 absolute right-4 sm:right-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary z-10" />
            <input
              type="text"
              placeholder="Search crafts..."
              className="h-10 w-56 pl-11 pr-4 text-sm rounded-full bg-[rgba(15,23,42,0.05)] border border-[rgba(15,23,42,0.10)] text-text-primary placeholder:text-text-secondary focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {isHydrated && isAuthenticated && user ? (
              <>
                {user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL ? (
                  <Link href="/super-admin" className="hidden sm:flex">
                    <Button variant="outline" size="sm">
                      Admin
                    </Button>
                  </Link>
                ) : null}
                <Link href="/account" className="hidden sm:flex">
                  <Button variant="ghost" size="sm" className="rounded-full hover:bg-[rgba(255,255,255,0.50)]">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/sign-in" className="hidden sm:flex">
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-[rgba(255,255,255,0.50)]">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button 
              variant="secondary" 
              size="sm" 
              className="relative rounded-full"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {getItemCount() > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#429DFE] text-[10px] font-bold text-white shadow-sm">
                  {getItemCount()}
                </span>
              )}
            </Button>
            <button
              type="button"
              className="lg:hidden p-2 rounded-full hover:bg-[rgba(255,255,255,0.50)] transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={handleMobileMenuToggle}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>

    {/* Mobile Menu - Outside header for proper z-index stacking */}
    {isMobileMenuOpen && (
      <div className="lg:hidden fixed inset-0 z-[60] bg-[rgba(240,243,255,0.98)] backdrop-blur-xl flex flex-col">
        {/* Close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(15,23,42,0.10)] shrink-0 bg-white/80">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/Headerlogo.png" alt="TibebStore" className="h-12 w-auto" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-full bg-[rgba(66,157,254,0.10)] hover:bg-[rgba(66,157,254,0.20)] transition-colors"
          >
            <X className="h-6 w-6 text-text-primary" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Navigation Links */}
          <nav className="space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-semibold text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#429DFE]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#429DFE]" />
              </div>
              Home
            </Link>

            <div className="pt-2">
              <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary"
                onClick={() => setIsMobileCategoriesOpen((v) => !v)}
              >
                <span>Categories</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMobileCategoriesOpen && (
                <div className="mt-2 space-y-1 pl-4">
                  {MOCK_CATEGORIES.map((category) => {
                    const Icon = getCategoryIcon(category.slug);
                    return (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsMobileCategoriesOpen(false);
                        }}
                        className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
                      >
                        <span>{category.name}</span>
                        <span className="h-8 w-8 rounded-lg bg-[#429DFE] flex items-center justify-center">
                          <Icon className="h-4 w-4 text-white" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-semibold text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#429DFE]/10 flex items-center justify-center">
                <ShoppingBasket className="w-5 h-5 text-[#429DFE]" />
              </div>
              Shop
            </Link>

            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-semibold text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#429DFE]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#429DFE]" />
              </div>
              About
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-semibold text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#429DFE]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#429DFE]" />
              </div>
              Contact
            </Link>
          </nav>

          {/* Divider */}
          <div className="my-6 h-px bg-[rgba(15,23,42,0.10)]" />

          {/* Account Section */}
          <div className="space-y-2">
            {isHydrated && isAuthenticated && user ? (
              <>
                {user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL ? (
                  <Link
                    href="/super-admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-semibold text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#429DFE]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#429DFE]" />
                    </div>
                    Admin Dashboard
                  </Link>
                ) : null}
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-semibold text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#429DFE]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#429DFE]" />
                  </div>
                  My Account
                </Link>
              </>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 rounded-2xl px-4 py-4 text-lg font-semibold text-text-primary hover:bg-[rgba(66,157,254,0.08)] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#429DFE]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#429DFE]" />
                </div>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
