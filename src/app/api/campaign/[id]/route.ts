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
            google_place_id,
            client:clients(id, name, slug)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching campaign:', error)
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get all passes including deleted ones for complete overview
    // We still filter for verified status to avoid showing "ghost" customers
    const { data: passes } = await supabase
        .from('passes')
        .select(`
            id,
            serial_number,
            current_state,
            created_at,
            last_updated_at,
            last_scanned_at,
            wallet_type,
            is_installed_on_ios,
            is_installed_on_android,
            verification_status,
            customer_name,
            customer_birthday,
            customer_email,
            customer_phone,
            deleted_at,
            consent_marketing
        `)
        .eq('campaign_id', id)
        .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true,deleted_at.not.is.null')
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false })

    const now = new Date()

    const enrichedPasses = (passes || []).map(pass => {
        // Calculate inactivity days
        const lastScan = pass.last_scanned_at ? new Date(pass.last_scanned_at) : null
        const daysSinceLastScan = lastScan
            ? Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24))
            : 999

        // Calculate status based on inactivity & deletion
        let status: 'active' | 'absent' | 'risk' | 'inactive' | 'deleted' = 'active'

        if (pass.deleted_at) status = 'deleted'
        else if (daysSinceLastScan >= 60) status = 'inactive'
        else if (daysSinceLastScan >= 30) status = 'risk'
        else if (daysSinceLastScan >= 14) status = 'absent'

        // Check if birthday is upcoming (next 7 days)
        let birthdayUpcoming = false
        if (pass.customer_birthday && !pass.deleted_at) {
            try {
                const birthDate = new Date(pass.customer_birthday)
                const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate())
                const diff = (thisYearBirthday.getTime() - now.getTime()) / (1000 * 3600 * 24)
                birthdayUpcoming = diff >= 0 && diff <= 7
            } catch { }
        }

        // Check if new customer (< 24h)
        const isNew = pass.created_at &&
            (now.getTime() - new Date(pass.created_at).getTime()) < 1000 * 60 * 60 * 24

        // Customer number from state or serial
        const customerNumber = pass.current_state?.customer_number ||
            pass.serial_number?.slice(-6).toUpperCase() ||
            pass.id.slice(-6).toUpperCase()

        return {
            ...pass,
            customer_number: customerNumber,
            display_name: pass.customer_name || `Kunde #${customerNumber}`,
            status,
            days_inactive: daysSinceLastScan,
            is_new: isNew,
            birthday_upcoming: birthdayUpcoming,
            stamps: pass.current_state?.stamps || 0,
            redemptions: pass.current_state?.redemptions || 0,
            last_scan_at: pass.last_scanned_at,
            opt_in: pass.consent_marketing ?? null,
        }
    })

    return NextResponse.json({
        campaign: {
            ...campaign,
            passes: enrichedPasses
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
