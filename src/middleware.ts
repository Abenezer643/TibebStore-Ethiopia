import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

async function verifySessionToken(token: string): Promise<any | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Middleware] JWT_SECRET is not set');
    return null;
  }
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    console.error('[Middleware] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Define excluded paths
  const isApi = url.pathname.startsWith('/api');
  const isStatic = url.pathname.startsWith('/_next') || url.pathname.includes('.');

  if (isApi || isStatic) return NextResponse.next();

  // Auth pages exist at top-level routes; don't rewrite them under /root.
  if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
    return NextResponse.next();
  }

  // Tenant storefront routes exist at a real segment; don't rewrite them under /root.
  if (url.pathname.startsWith('/tenant/')) {
    return NextResponse.next();
  }

  // For seller routes, just verify authentication - page will check seller status from DB
  if (url.pathname.startsWith('/account/seller')) {
    const token = request.cookies.get('tibeb_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    // Seller status check is handled at the page level (can query DB there)
  }

  // Extract subdomain
  let subdomain = '';
  const hostWithoutPort = hostname.split(':')[0] ?? '';
  if (hostWithoutPort.endsWith('.localhost')) {
    subdomain = hostWithoutPort.replace('.localhost', '');
  } else if (hostWithoutPort.endsWith('.tibebstore.com')) {
    subdomain = hostWithoutPort.replace('.tibebstore.com', '');
  }

  // Handle www as no subdomain
  if (subdomain === 'www') subdomain = '';

  // Rewrite based on subdomain
  if (subdomain) {
    return NextResponse.rewrite(
      new URL(`/tenant/${subdomain}${url.pathname}`, request.url)
    );
  }

  // Route groups (e.g. /(platform)) are not part of the URL path, so middleware cannot rewrite to them.
  // Instead, we keep platform pages under a real segment: /root
  return NextResponse.rewrite(
    new URL(`/root${url.pathname}`, request.url)
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
