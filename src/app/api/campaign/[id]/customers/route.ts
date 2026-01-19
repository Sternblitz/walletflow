import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/campaign/[id]/customers
 * 
 * Returns customers (passes) with last scan information from passes.last_scanned_at
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const supabase = await createClient()

    try {
        // Get all passes for this campaign with last_scanned_at included
        const { data: passes, error: passesError } = await supabase
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
                deleted_at
            `)
            .eq('campaign_id', campaignId)
            .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true,deleted_at.not.is.null')
            .order('deleted_at', { ascending: true, nullsFirst: true })
            .order('created_at', { ascending: false })

        if (passesError) {
            console.error('Error fetching passes:', passesError)
            return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
        }

        // Map passes to customers with last_scan_at for compatibility
        const customers = passes?.map(pass => ({
            ...pass,
            last_scan_at: pass.last_scanned_at || null
        })) || []

        // 4. Sort by last_scan_at (most recent first), then by created_at
        customers.sort((a, b) => {
            // Deleted passes at the end
            if (a.deleted_at && !b.deleted_at) return 1
            if (!a.deleted_at && b.deleted_at) return -1

            // Then by last scan (most recent first)
            if (a.last_scan_at && b.last_scan_at) {
                return new Date(b.last_scan_at).getTime() - new Date(a.last_scan_at).getTime()
            }
            if (a.last_scan_at && !b.last_scan_at) return -1
            if (!a.last_scan_at && b.last_scan_at) return 1

            // Finally by created_at
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        return NextResponse.json({
            customers,
            total: customers.length,
            active: customers.filter(c => !c.deleted_at).length
        })

    } catch (error) {
        console.error('Customers API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
