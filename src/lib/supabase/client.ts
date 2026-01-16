import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            // Configure cookie options for cross-subdomain auth
            cookieOptions: {
                domain: process.env.NODE_ENV === 'production'
                    ? '.getqard.com'  // Works across all subdomains
                    : undefined,       // localhost doesn't need domain
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            }
        }
    )
}
