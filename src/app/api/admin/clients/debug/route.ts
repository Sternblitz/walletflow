import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * DEBUG ENDPOINT
 * GET /api/admin/clients/debug
 * Returns detailed debug info about why clients might not load
 */
export async function GET() {
    const supabase = await createClient()
    const debug: any = {}

    // 1. Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    debug.auth = {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        error: authError?.message
    }

    if (!user) {
        return NextResponse.json({
            error: 'Nicht eingeloggt',
            debug
        }, { status: 401 })
    }

    // 2. Check Agency
    const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

    debug.agency = {
        found: !!agency,
        agencyId: agency?.id,
        agencyName: agency?.name,
        error: agencyError?.message
    }

    if (!agency) {
        return NextResponse.json({
            error: 'Keine Agency gefunden für diesen User',
            debug,
            hint: 'User muss in agencies table eingetragen sein'
        })
    }

    // 3. Check Clients
    const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, slug, agency_id')
        .eq('agency_id', agency.id)

    debug.clients = {
        count: clients?.length || 0,
        clients: clients?.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
        error: clientsError?.message
    }

    // 4. Check if there are ANY clients at all
    const { data: allClients, error: allError } = await supabase
        .from('clients')
        .select('id, name, agency_id')
        .limit(10)

    debug.allClients = {
        total: allClients?.length || 0,
        sample: allClients?.map(c => ({
            id: c.id,
            name: c.name,
            agencyId: c.agency_id,
            matchesCurrentAgency: c.agency_id === agency?.id
        })),
        error: allError?.message
    }

    return NextResponse.json({
        message: 'Debug Info',
        debug,
        summary: {
            isLoggedIn: !!user,
            hasAgency: !!agency,
            clientsCount: clients?.length || 0,
            totalClientsInDb: allClients?.length || 0
        }
    })
}
