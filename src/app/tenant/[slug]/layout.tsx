import { TenantNavbar } from '@/components/layout/TenantNavbar';
import { ToastProvider } from '@/components/ui/Toast';
import { CartProvider } from '@/hooks/useCart';
import type { Tenant } from '@/types';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tenantName = slug;
  let tenantLogo: string | undefined;

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/tenants`, { cache: 'no-store' });
    const json = (await res.json().catch(() => null)) as any;
    const tenants = Array.isArray(json?.tenants) ? (json.tenants as Tenant[]) : [];
    const found = tenants.find((t) => String(t?.slug).toLowerCase() === String(slug).toLowerCase());
    if (found) {
      tenantName = found.name;
      tenantLogo = found.logo?.url;
    }
  } catch {
    // ignore
  }

  return (
    <ToastProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-background text-text-primary">
          <TenantNavbar tenantName={tenantName} tenantLogo={tenantLogo} />
          <main className="flex-1">{children}</main>
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
