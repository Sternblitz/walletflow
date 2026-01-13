import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/admin/clients
 * Returns all clients with their campaigns for the current agency
 */
export async function GET() {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Get agency for user
    const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!agency) {
        return NextResponse.json({ clients: [] })
    }

    // Fetch clients with campaigns
    const { data: clients, error } = await supabase
        .from('clients')
        .select(`
            id,
            name,
            slug,
            created_at,
            campaigns(id, name, is_active)
        `)
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
    }

    return NextResponse.json({ clients: clients || [] })
}
