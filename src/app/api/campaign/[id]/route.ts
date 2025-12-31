import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(`
            id,
            name,
            concept,
            is_active,
            created_at,
            config,
            design_assets,
            client:clients(name, slug),
            passes(
                id,
                serial_number,
                current_state,
                created_at,
                last_updated_at,
                wallet_type
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching campaign:', error)
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign })
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // First delete all passes associated with this campaign
    const { error: passesError } = await supabase
        .from('passes')
        .delete()
        .eq('campaign_id', id)

    if (passesError) {
        console.error('Error deleting passes:', passesError)
        // Continue anyway - might not have passes
    }

    // Delete device registrations for those passes
    // (Usually handled by cascade, but just in case)

    // Now delete the campaign
    const { error: campaignError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

    if (campaignError) {
        console.error('Error deleting campaign:', campaignError)
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
    }

    console.log(`[DELETE] Campaign ${id} deleted`)
    return NextResponse.json({ success: true })
}
