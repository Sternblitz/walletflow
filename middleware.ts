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
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
