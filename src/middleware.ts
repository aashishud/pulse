import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Get the host (e.g., 'network.pulsegg.in' or 'localhost:3000')
  const hostname = req.headers.get('host') || '';

  const isNetworkSubdomain = hostname.startsWith('network.');

  // 1. STRICT ENFORCEMENT: If they manually type /network on the main site, 
  // redirect them instantly to the actual subdomain.
  if (!isNetworkSubdomain && url.pathname.startsWith('/network')) {
    // Strip port for the redirect calculation if needed, or keep it for localhost
    const newUrl = new URL(req.url);
    newUrl.hostname = `network.${hostname.split(':')[0]}`;
    newUrl.pathname = url.pathname.replace('/network', '') || '/';
    return NextResponse.redirect(newUrl);
  }

  // 2. SERVE THE SUBDOMAIN: If they are on the network subdomain, 
  // secretly serve the /network folder while keeping the URL bar clean.
  if (isNetworkSubdomain) {
    url.pathname = `/network${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Only run middleware on actual pages, skip API routes and static images for performance
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};