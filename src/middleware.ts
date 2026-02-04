import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get('host')!;
  
  // Normalize hostname
  hostname = hostname.replace(':3000', '');

  // Detect main domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in';
  const isMainDomain = hostname === rootDomain || hostname === 'localhost' || hostname === 'www.' + rootDomain;

  // 1. If on Main Domain, allow normal routing.
  if (isMainDomain) {
    return NextResponse.next();
  }

  // 2. If on Subdomain (e.g. user.pulsegg.in), rewrite to profile path
  // (Only useful if you upgrade Vercel plan later)
  const currentHost = hostname.replace(`.${rootDomain}`, '').replace('.localhost', '');
  return NextResponse.rewrite(new URL(`/${currentHost}${url.pathname}`, req.url));
}