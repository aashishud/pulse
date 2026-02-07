import { NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
    ],
};

export default async function proxy(req: NextRequest) {
    const url = req.nextUrl;
    let hostname = req.headers.get('host')!;

    // Normalize hostname (remove port for localhost)
    hostname = hostname.replace(':3000', '');

    // Detect main domain
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'pulsegg.in';

    // FIX: Explicitly whitelist all variations of your main domain.
    // This prevents the app from thinking "pulsegg.in" is a username.
    const isMainDomain = 
        hostname === rootDomain || 
        hostname === `www.${rootDomain}` || 
        hostname === 'pulsegg.in' || 
        hostname === 'www.pulsegg.in' || 
        hostname === 'localhost';

    // 1. If on Main Domain, allow normal routing to src/app/page.tsx
    if (isMainDomain) {
        return NextResponse.next();
    }

    // 2. If on Subdomain (e.g. sour.pulsegg.in), rewrite to profile path
    // This logic extracts "sour" from "sour.pulsegg.in"
    const currentHost = hostname
        .replace(`.${rootDomain}`, '')
        .replace('.pulsegg.in', '')
        .replace('.localhost', '');

    // Safety check: if replacement didn't happen, we shouldn't rewrite
    if (currentHost === hostname) {
        return NextResponse.next();
    }

    // Rewrite to the dynamic route: /src/app/(profile)/[username]/page.tsx
    return NextResponse.rewrite(new URL(`/${currentHost}${url.pathname}`, req.url));
}