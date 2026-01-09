import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // First get the campaign
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
            client:clients(name, slug)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching campaign:', error)
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get only VERIFIED passes (actually installed or scanned)
    // We filter out 'pending' passes to avoid showing "ghost" customers
    const { data: passes } = await supabase
        .from('passes')
        .select(`
            id,
            serial_number,
            current_state,
            created_at,
            last_updated_at,
            wallet_type,
            is_installed_on_ios,
            is_installed_on_android,
            verification_status,
            customer_name,
            customer_birthday,
            customer_email,
            customer_phone
        `)
        .eq('campaign_id', id)
        .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')
        .order('created_at', { ascending: false })

    return NextResponse.json({
        campaign: {
            ...campaign,
            passes: passes || []
        }
    })
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
