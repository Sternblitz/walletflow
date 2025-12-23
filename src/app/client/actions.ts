'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function verifyPinAndLogin(slug: string, pin: string) {
    const supabase = await createClient()

    const { data: client } = await supabase
        .from('clients')
        .select('admin_pin, staff_pin')
        .eq('slug', slug)
        .single()

    if (!client) {
        return { error: 'Geschäft nicht gefunden' }
    }

    if (pin === client.admin_pin) {
        // Admin Login
        const cookieStore = await cookies()
        cookieStore.set(`auth_${slug}`, 'admin', { secure: true, httpOnly: true, maxAge: 60 * 60 * 24 }) // 24h
        return { success: true, role: 'admin', redirect: `/client/${slug}` }
    }

    if (pin === client.staff_pin) {
        // Staff Login
        const cookieStore = await cookies()
        cookieStore.set(`auth_${slug}`, 'staff', { secure: true, httpOnly: true, maxAge: 60 * 60 * 12 }) // 12h
        return { success: true, role: 'staff', redirect: `/pos/${slug}` }
    }

    return { error: 'Falscher PIN Code' }
}
