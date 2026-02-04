import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname (e.g. 'pulsegg.in', 'aashish.pulsegg.in', 'localhost:3000')
  let hostname = req.headers.get('host')!;

  // Remove port number if present (for localhost)
  hostname = hostname.replace(':3000', '');

  // Get the Root Domain from environment, defaulting to your new domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in';

  // 1. If we are on the main domain or localhost, allow the request to proceed normally.
  // This allows pages like /login, /signup, /dashboard to work on the root domain.
  if (
    hostname === rootDomain || 
    hostname === 'localhost' || 
    hostname === 'www.' + rootDomain
  ) {
    return NextResponse.next();
  }

  // 2. If we are here, we are on a SUBDOMAIN (e.g. aashish.pulsegg.in)
  // We extract the subdomain ("aashish") by removing the root domain parts
  const currentHost = hostname
    .replace(`.${rootDomain}`, '')
    .replace('.localhost', '');

  // 3. Rewrite the URL to the profile page
  // The browser shows "aashish.pulsegg.in", but Next.js renders "src/app/(profile)/[username]/page.tsx"
  return NextResponse.rewrite(new URL(`/${currentHost}${url.pathname}`, req.url));
}