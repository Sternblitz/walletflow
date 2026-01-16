import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/campaign/by-slug/[slug]
 * Fetches campaign data by client slug (for POS/App page)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const supabase = await createClient()

    // First find the client by slug
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()

    if (clientError || !client) {
        console.error('Client not found for slug:', slug)
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Then get the active campaign for this client
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
            id,
            name,
            concept,
            is_active,
            created_at,
            config,
            design_assets
        `)
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()

    if (campaignError || !campaign) {
        console.error('No active campaign for client:', client.id)
        return NextResponse.json({ error: 'No active campaign found' }, { status: 404 })
    }

    return NextResponse.json({
        campaign: {
            ...campaign,
            client: {
                id: client.id,
                name: client.name,
                slug: client.slug
            }
        }
    })
}
