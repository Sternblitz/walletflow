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

    // IMPORTANT: Main domain (getqard.com) without subdomain
    // This project should NOT handle the main domain!
    // Redirect to www.getqard.com or show a message
    if (!subdomain && !isLocalhost) {
        // Main domain accessed directly - this shouldn't happen if DNS is configured correctly
        // Return a helpful message or redirect to landing page project
        return new NextResponse(
            `This application runs on subdomains only:
            
• admin.getqard.com - Agency Dashboard
• app.getqard.com - POS System
• start.getqard.com - Customer Onboarding

For the main website, visit: www.getqard.com`,
            {
                status: 404,
                headers: {
                    'Content-Type': 'text/plain',
                },
            }
        );
    }

    // Shouldn't reach here in production
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
         * - api routes (they handle their own logic)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
