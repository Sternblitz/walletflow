'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate input
    if (!email || !password) {
        return { error: 'Bitte E-Mail und Passwort eingeben' }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Attempt to sign in with Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // Return error message to display on the client
        return { error: 'Ungültige Anmeldedaten' }
    }

    // Successfully authenticated - redirect to dashboard (root of admin subdomain)
    redirect('/admin')
}
