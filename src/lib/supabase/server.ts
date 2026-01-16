import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // CRITICAL FIX: Set cookie domain to work across all subdomains
                            // This allows auth session to work on admin.getqard.com, app.getqard.com, etc.
                            const cookieOptions = {
                                ...options,
                                domain: process.env.NODE_ENV === 'production'
                                    ? '.getqard.com'  // Leading dot = works for all subdomains
                                    : undefined,       // localhost doesn't need domain
                                sameSite: 'lax' as const,
                                secure: process.env.NODE_ENV === 'production',
                            }
                            cookieStore.set(name, value, cookieOptions)
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
