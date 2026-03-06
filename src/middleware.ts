import { NextRequest, NextResponse } from 'next/server';

// Paths that are always accessible, even in coming soon mode
const ALLOWED_PATHS = [
  '/coming-soon',
  '/competition',
  '/admin',
  '/api',
  '/_next',
  '/favicon.ico',
];

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

  try {
    // Check coming soon status via internal API
    const baseUrl = request.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/site-settings`, {
      headers: { 'x-middleware-request': '1' },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data.comingSoon) {
        // Redirect to coming soon page
        const url = request.nextUrl.clone();
        url.pathname = '/coming-soon';
        return NextResponse.redirect(url);
      }
    }
  } catch {
    // If the check fails, let the request through
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets and API
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
