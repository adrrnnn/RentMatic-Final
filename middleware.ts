import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is trying to access dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/(dashboard)')) {
    // Check if the request is coming from tenant-invite page
    const referer = request.headers.get('referer');
    const isFromTenantInvite = referer && referer.includes('/tenant-invite');
    
    // If coming from tenant-invite, redirect back to tenant registration
    if (isFromTenantInvite) {
      return NextResponse.redirect(new URL('/tenant-invite', request.url));
    }
  }
  
  // Allow tenant-invite page to be accessed freely
  if (pathname.startsWith('/tenant-invite')) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
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


