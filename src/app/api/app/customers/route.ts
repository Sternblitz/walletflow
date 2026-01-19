import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/app/customers?slug=xxx
 * Returns customer list for a restaurant's POS dashboard with activity logs
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const includeActivity = searchParams.get('activity') === 'true'

    if (!slug) {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Find client and active campaign by slug
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, campaigns(id, is_active, config)')
        .eq('slug', slug)
        .single()

    const activeCampaign = client?.campaigns?.find((c: any) => c.is_active) || client?.campaigns?.[0]

    if (clientError || !client || !activeCampaign) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    const campaignId = activeCampaign.id
    const campaignConfig = activeCampaign.config || {}

    // 2. Fetch all passes with customer data
    const { data: passes, error: passesError } = await supabase
        .from('passes')
        .select(`
            id,
            serial_number,
            customer_name,
            customer_birthday,
            customer_email,
            customer_phone,
            current_state,
            wallet_type,
            created_at,
            last_updated_at,
            last_scanned_at,
            is_installed_on_ios,
            is_installed_on_android,
            deleted_at
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

    if (passesError) {
        console.error("Error fetching customers:", passesError)
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    // 3. Fetch activity logs (scans) for all passes if requested
    let activityMap: Record<string, any[]> = {}
    if (includeActivity && passes && passes.length > 0) {
        const passIds = passes.map(p => p.id)
        const { data: scans } = await supabase
            .from('scans')
            .select('id, pass_id, action_type, delta_value, created_at')
            .in('pass_id', passIds)
            .order('created_at', { ascending: false })
            .limit(500) // Limit total scans for performance

        if (scans) {
            scans.forEach(scan => {
                if (!activityMap[scan.pass_id]) {
                    activityMap[scan.pass_id] = []
                }
                activityMap[scan.pass_id].push({
                    type: mapActionToType(scan.action_type),
                    action: scan.action_type,
                    delta: scan.delta_value,
                    date: scan.created_at
                })
            })
        }

        // Also fetch push notifications sent to these customers (if table exists)
        try {
            const { data: pushLogs } = await supabase
                .from('push_logs')
                .select('id, pass_id, message, created_at, status')
                .in('pass_id', passIds)
                .order('created_at', { ascending: false })
                .limit(200)

            if (pushLogs) {
                pushLogs.forEach(log => {
                    if (!activityMap[log.pass_id]) {
                        activityMap[log.pass_id] = []
                    }
                    activityMap[log.pass_id].push({
                        type: 'push',
                        message: log.message,
                        status: log.status,
                        date: log.created_at
                    })
                })
            }
        } catch {
            // push_logs table might not exist yet, skip silently
        }
    }

    // 4. Transform data for frontend with smart display names
    const now = new Date()
    const customers = (passes || []).map(pass => {
        // Calculate inactivity days
        const lastScan = pass.last_scanned_at ? new Date(pass.last_scanned_at) : null
        const daysSinceLastScan = lastScan
            ? Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24))
            : 999

        // Calculate status based on inactivity
        let status: 'active' | 'absent' | 'risk' | 'inactive' = 'active'
        if (daysSinceLastScan >= 60) status = 'inactive'
        else if (daysSinceLastScan >= 30) status = 'risk'
        else if (daysSinceLastScan >= 14) status = 'absent'

        // Check if birthday is upcoming (next 7 days)
        let birthdayUpcoming = false
        if (pass.customer_birthday) {
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

        // Determine display name (use customer_name if available, else customer number)
        const displayName = pass.customer_name || `Kunde #${customerNumber}`

        // Get activity for this pass (limit to last 10)
        const activity = activityMap[pass.id]?.slice(0, 10) || []

        // Sort activity by date
        activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Add creation event to activity
        activity.push({
            type: 'created',
            date: pass.created_at
        })

        return {
            id: pass.id,
            serial_number: pass.serial_number,
            customer_number: customerNumber,
            // Customer data (only include if collected)
            customer_name: pass.customer_name || null,
            customer_birthday: pass.customer_birthday || null,
            customer_email: pass.customer_email || null,
            customer_phone: pass.customer_phone || null,
            // Display helpers
            display_name: displayName,
            // State
            current_state: pass.current_state,
            stamps: pass.current_state?.stamps || 0,
            max_stamps: pass.current_state?.max_stamps || 10,
            redemptions: pass.current_state?.redemptions || 0,
            // Platform & Status
            wallet_type: pass.wallet_type || 'apple',
            is_installed: pass.is_installed_on_ios || pass.is_installed_on_android,
            deleted_at: pass.deleted_at || null,
            // Dates
            created_at: pass.created_at,
            last_scan_at: pass.last_scanned_at || null,
            last_updated_at: pass.last_updated_at,
            // Calculated badges
            status,
            days_inactive: daysSinceLastScan,
            is_new: isNew,
            birthday_upcoming: birthdayUpcoming,
            // Activity log
            activity: includeActivity ? activity : undefined
        }
    })

    // 5. Summary stats with proper counts
    const active = customers.filter(c => !c.deleted_at)
    const summary = {
        total: customers.length,
        active: active.length,
        deleted: customers.length - active.length,
        // By status
        statusCounts: {
            active: active.filter(c => c.status === 'active').length,
            absent: active.filter(c => c.status === 'absent').length,
            risk: active.filter(c => c.status === 'risk').length,
            inactive: active.filter(c => c.status === 'inactive').length,
        },
        // Special badges
        newToday: active.filter(c => c.is_new).length,
        birthdayUpcoming: active.filter(c => c.birthday_upcoming).length,
        // Data collection stats
        withName: active.filter(c => c.customer_name).length,
        withBirthday: active.filter(c => c.customer_birthday).length,
        withEmail: active.filter(c => c.customer_email).length,
        withPhone: active.filter(c => c.customer_phone).length,
    }

    // 6. Which fields are being collected (for dynamic display)
    const collectedFields = {
        name: campaignConfig.personalization?.fields?.includes('name') ?? true,
        email: campaignConfig.personalization?.fields?.includes('email') ?? false,
        phone: campaignConfig.personalization?.fields?.includes('phone') ?? false,
        birthday: campaignConfig.personalization?.fields?.includes('birthday') ?? false,
    }

    return NextResponse.json({
        customers,
        summary,
        collectedFields
    })
}

/**
 * GET /api/app/customers/[id]/activity?slug=xxx
 * Returns detailed activity for a single customer
 */

function mapActionToType(actionType: string): string {
    switch (actionType) {
        case 'ADD_STAMP':
        case 'STAMP_COMPLETE':
            return 'scan'
        case 'AUTO_REDEEM':
        case 'REDEEM_REWARD':
        case 'REDEEM_VOUCHER':
            return 'redemption'
        case 'ADD_POINTS':
        case 'CHECK_IN':
            return 'scan'
        default:
            return 'scan'
    }
}
