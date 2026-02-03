import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname (e.g. 'pulse.gg', 'aashish.pulse.gg', 'localhost:3000')
  let hostname = req.headers.get('host')!;

  // Remove port number if present (for localhost)
  hostname = hostname.replace(':3000', '');

  // Get the Root Domain from environment, or default to what we know
  // On Vercel, this should be set to 'pulsegg.vercel.app'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.vercel.app';

  // Check if we are on the main domain (Landing Page)
  // We check if the hostname IS the root domain, or if it's localhost
  if (hostname === rootDomain || hostname === 'localhost' || hostname === 'www.' + rootDomain) {
    return NextResponse.next();
  }

  // If we are here, it means we are on a SUBDOMAIN (e.g. aashish.pulse.gg)
  // We extract the subdomain by removing the root domain parts
  const currentHost = hostname.replace(`.${rootDomain}`, '').replace('.localhost', '');

  // Rewrite the URL to the dynamic user route
  // Internal path becomes: /username/current-path
  return NextResponse.rewrite(new URL(`/${currentHost}${url.pathname}`, req.url));
}