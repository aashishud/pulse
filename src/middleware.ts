import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'pulse.gg';
  const allowedDomains = ['pulse.gg', 'localhost:3000', 'localhost'];
  
  // Extract the subdomain (e.g. "aashish" from "aashish.pulse.gg")
  const subdomain = hostname
    .split('.')
    .filter((part) => !allowedDomains.some(domain => domain.includes(part)))[0];

  // If no subdomain, stay on the main page
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // Rewrite to the profile page
  return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
}