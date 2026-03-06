import { NextRequest, NextResponse } from 'next/server';

// Paths that are always accessible, even in coming soon mode
const ALLOWED_PATHS = [
  '/coming-soon',
  '/competition',
  '/admin',
  '/api',
  '/_next',
  '/favicon.ico',
  '/login',
  '/signup',
  '/forgot-password',
  '/submit-idea',
  '/dashboard',
  '/startup-dashboard',
  '/profile',
  '/notifications',
  '/edit-startup',
];

// Simple in-memory cache for Edge Runtime
let cachedComingSoon: boolean | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

async function isComingSoon(origin: string): Promise<boolean> {
  const now = Date.now();
  if (cachedComingSoon !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedComingSoon;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${origin}/api/site-settings`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const result = data.success && data.data.comingSoon === true;
      cachedComingSoon = result;
      cacheTimestamp = now;
      return result;
    }
  } catch {
    // On error, use cached value if available, otherwise don't block
    if (cachedComingSoon !== null) return cachedComingSoon;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for allowed paths
  if (ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip for static files
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  const comingSoon = await isComingSoon(request.nextUrl.origin);
  if (comingSoon) {
    const url = request.nextUrl.clone();
    url.pathname = '/coming-soon';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets and API
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
