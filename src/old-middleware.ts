import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // -----------------------------------------------------------------------------
  // SYSTEM DOMAINS
  // These are the domains that should render the main Landing Page / Dashboard.
  // We MUST include both the naked domain and the www subdomain.
  // -----------------------------------------------------------------------------
  const systemDomains = new Set([
    "pulsegg.in",
    "www.pulsegg.in",
    "localhost:3000",
    "localhost"
  ]);

  // Check if the current hostname is one of our system domains
  const isSystemDomain = systemDomains.has(hostname);

  // IF this is a main domain, let Next.js handle routing naturally.
  // This ensures 'pulsegg.in' -> 'src/app/page.tsx' (Landing Page)
  // instead of being rewritten to a profile path.
  if (isSystemDomain) {
    return NextResponse.next();
  }

  // --- SUBDOMAIN LOGIC (Placeholder) ---
  // If you eventually want 'sour.pulsegg.in', you would handle rewrites here.
  // For now, allow standard routing to prevent the "Claim @pulsegg.in" bug.
  // Also dumbass, stop changing stuff without letting me know first
  
  return NextResponse.next();
}