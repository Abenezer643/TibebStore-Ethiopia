export interface MediaReference {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'super-admin';
  tenants: string[]; // IDs of tenants
  avatar?: MediaReference;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: MediaReference;
  stripeAccountId?: string;
  stripeDetailsSubmitted: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  parentId?: string;
  subcategories?: Category[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export type RefundPolicy = 'no-refunds' | '7-day' | '30-day';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string; // Simplified for now, will use RichText type later
  price: number; // in cents
  category: Category;
  tags?: Tag[];
  images: MediaReference[];
  tenantId: string;
  stock?: number | null; // null = unlimited/made-to-order, 0 = out of stock, 1+ = in stock
  isArchived: boolean;
  isPrivate: boolean;
  content?: string;
  materials?: string;
  craftRegion?: string;
  refundPolicy: RefundPolicy;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  description?: string;
  productId: string;
  userId: string;
  user: {
    username: string;
    avatar?: MediaReference;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  products: Product[];
  stripeCheckoutSessionId: string;
  stripeAccountId: string;
  total: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
