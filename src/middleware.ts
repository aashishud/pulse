import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Get the host (e.g., 'sour.pulsegg.in', 'localhost:3000')
  const hostname = req.headers.get('host') || '';
  const cleanHostname = hostname.split(':')[0];
  
  // Supported base domains
  const mainDomains = ['pulsegg.in', 'localhost', 'lvh.me'];
  let subdomain = null;
  
  for (const domain of mainDomains) {
    if (cleanHostname.endsWith(`.${domain}`) && cleanHostname !== domain) {
      subdomain = cleanHostname.replace(`.${domain}`, '');
      break;
    }
  }

  // If there's a custom subdomain (and it's not 'www'), route it to the user's profile
  if (subdomain && subdomain !== 'www') {
    // Rewrite root path to the profile path /[username]
    if (url.pathname === '/') {
      url.pathname = `/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

// Only run middleware on actual pages, skip API routes and static assets for performance
export const config = {
  matcher: [
    // FIX: Added 'models' and 'cursors' to the exclusion list!
    // This stops the middleware from breaking 3D files and custom mouse cursors on the subdomain.
    '/((?!api|_next/static|_next/image|favicon.ico|models|cursors).*)',
  ],
};