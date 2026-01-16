import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const url = request.nextUrl.clone();

    // Extract subdomain
    const hostParts = hostname.split('.');

    // For production: getqard.com
    // For local dev: localhost:3000
    const isLocalhost = hostname.includes('localhost');

    if (isLocalhost) {
        // Local development - no subdomain routing
        return NextResponse.next();
    }

    // Get subdomain (e.g., 'admin' from 'admin.getqard.com')
    const subdomain = hostParts.length >= 3 ? hostParts[0] : null;

    // Handle subdomain routing
    if (subdomain === 'admin') {
        // admin.getqard.com → /admin (Agentur)
        url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`;
        return NextResponse.rewrite(url);
    }

    if (subdomain === 'app') {
        // app.getqard.com → /app (POS für Läden)
        url.pathname = `/app${url.pathname === '/' ? '' : url.pathname}`;
        return NextResponse.rewrite(url);
    }

    if (subdomain === 'start') {
        // start.getqard.com → /start
        url.pathname = `/start${url.pathname === '/' ? '' : url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // SECURITY: Block direct access to protected routes on main domain
    // Only block ROOT paths, not subpages (e.g. block /admin but allow /admin/something would already be blocked by Next.js routing)
    if (!subdomain) {
        const pathname = url.pathname;

        // Block exact matches and root-level access
        if (pathname === '/admin' ||
            pathname === '/start' ||
            pathname === '/app' ||
            pathname.startsWith('/admin/') ||
            pathname.startsWith('/start/') ||
            pathname.startsWith('/app/')) {
            // Return 404 for direct access attempts
            return NextResponse.rewrite(new URL('/404', request.url));
        }
    }

    // Main domain (getqard.com) - serve normally
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (let them handle their own logic)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
