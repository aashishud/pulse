import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get('host')!;
  hostname = hostname.replace(':3000', '');

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.vercel.app';

  // 1. If we are on the main domain (pulsegg.vercel.app or localhost), just allow the request.
  // Next.js will naturally match /aashish to the profile page.
  if (hostname === rootDomain || hostname === 'localhost' || hostname === 'www.' + rootDomain) {
    return NextResponse.next();
  }

  // 2. If we are on a SUBDOMAIN (e.g. aashish.pulse.gg), rewrite it to the profile path.
  // This supports custom domains if you buy one later.
  const currentHost = hostname.replace(`.${rootDomain}`, '').replace('.localhost', '');
  return NextResponse.rewrite(new URL(`/${currentHost}${url.pathname}`, req.url));
}