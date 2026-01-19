import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/app/customers/[id]?slug=xxx
 * Returns detailed customer info with full activity timeline
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: passId } = await params
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verify access by checking slug matches pass's campaign
    const { data: client } = await supabase
        .from('clients')
        .select('id, campaigns(id)')
        .eq('slug', slug)
        .single()

    if (!client) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const campaignIds = client.campaigns?.map((c: any) => c.id) || []

    // 2. Fetch the pass with full details
    const { data: pass, error: passError } = await supabase
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
            deleted_at,
            campaign_id
        `)
        .eq('id', passId)
        .single()

    if (passError || !pass) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Verify campaign access
    if (!campaignIds.includes(pass.campaign_id)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // 3. Fetch all scans for this pass
    const { data: scans } = await supabase
        .from('scans')
        .select('id, action_type, delta_value, created_at')
        .eq('pass_id', passId)
        .order('created_at', { ascending: false })
        .limit(100)

    // 4. Fetch push notifications sent to this customer (if table exists)
    let pushLogs: any[] = []
    try {
        const { data } = await supabase
            .from('push_logs')
            .select('id, message, created_at, status')
            .eq('pass_id', passId)
            .order('created_at', { ascending: false })
            .limit(50)
        pushLogs = data || []
    } catch {
        // push_logs table might not exist yet
    }

    // 5. Build activity timeline
    const timeline: any[] = []

    // Add scans
    scans?.forEach(scan => {
        timeline.push({
            id: scan.id,
            type: mapActionToType(scan.action_type),
            action: scan.action_type,
            title: getActionTitle(scan.action_type),
            subtitle: getActionSubtitle(scan.action_type, scan.delta_value),
            date: scan.created_at,
            delta: scan.delta_value
        })
    })

    // Add push notifications
    pushLogs?.forEach(log => {
        timeline.push({
            id: log.id,
            type: 'push',
            action: 'PUSH_SENT',
            title: 'Push Nachricht',
            subtitle: log.message?.slice(0, 50) + (log.message?.length > 50 ? '...' : ''),
            date: log.created_at,
            status: log.status
        })
    })

    // Add creation event
    timeline.push({
        id: 'created',
        type: 'created',
        action: 'PASS_CREATED',
        title: 'Registriert',
        subtitle: pass.wallet_type === 'google' ? 'Google Wallet' : 'Apple Wallet',
        date: pass.created_at
    })

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 6. Calculate stats
    const now = new Date()
    const lastScan = pass.last_scanned_at ? new Date(pass.last_scanned_at) : null
    const daysSinceLastScan = lastScan
        ? Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24))
        : -1

    // Status
    let status: 'active' | 'absent' | 'risk' | 'inactive' = 'active'
    if (daysSinceLastScan >= 60) status = 'inactive'
    else if (daysSinceLastScan >= 30) status = 'risk'
    else if (daysSinceLastScan >= 14) status = 'absent'

    // Birthday upcoming
    let birthdayUpcoming = false
    if (pass.customer_birthday) {
        try {
            const birthDate = new Date(pass.customer_birthday)
            const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate())
            const diff = (thisYearBirthday.getTime() - now.getTime()) / (1000 * 3600 * 24)
            birthdayUpcoming = diff >= 0 && diff <= 7
        } catch { }
    }

    // Is new (< 24h)
    const isNew = pass.created_at &&
        (now.getTime() - new Date(pass.created_at).getTime()) < 1000 * 60 * 60 * 24

    // Customer number
    const customerNumber = pass.current_state?.customer_number ||
        pass.serial_number?.slice(-6).toUpperCase() ||
        pass.id.slice(-6).toUpperCase()

    // Calculate average visit frequency (avg time between visits)
    const scanEvents = scans?.filter(s => s.action_type === 'ADD_STAMP' || s.action_type === 'STAMP_COMPLETE' || s.action_type === 'ADD_POINTS').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []

    let avgFrequency = null
    if (scanEvents.length >= 2) {
        // Calculate average distinct days between visits using first and last scan
        const firstScan = new Date(scanEvents[0].created_at)
        const lastScan = new Date(scanEvents[scanEvents.length - 1].created_at)
        const totalDaysDiff = (lastScan.getTime() - firstScan.getTime()) / (1000 * 60 * 60 * 24)

        // Use (count - 1) because N visits produce N-1 intervals
        avgFrequency = Math.round(totalDaysDiff / (scanEvents.length - 1))
    }

    const scanCount = scanEvents.length
    const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - new Date(pass.created_at).getTime()) / (1000 * 60 * 60 * 24)))

    return NextResponse.json({
        customer: {
            id: pass.id,
            serial_number: pass.serial_number,
            customer_number: customerNumber,
            // Personal data (only what was collected)
            customer_name: pass.customer_name || null,
            customer_birthday: pass.customer_birthday || null,
            customer_email: pass.customer_email || null,
            customer_phone: pass.customer_phone || null,
            // Display name
            display_name: pass.customer_name || `Kunde #${customerNumber}`,
            // State
            current_state: pass.current_state,
            stamps: pass.current_state?.stamps || 0,
            max_stamps: pass.current_state?.max_stamps || 10,
            redemptions: pass.current_state?.redemptions || 0,
            // Platform
            wallet_type: pass.wallet_type || 'apple',
            is_installed: pass.is_installed_on_ios || pass.is_installed_on_android,
            // Dates
            created_at: pass.created_at,
            last_scan_at: pass.last_scanned_at,
            deleted_at: pass.deleted_at,
            // Status
            status,
            days_inactive: daysSinceLastScan >= 0 ? daysSinceLastScan : null,
            is_new: isNew,
            birthday_upcoming: birthdayUpcoming,
        },
        stats: {
            total_scans: scanCount,
            total_redemptions: pass.current_state?.redemptions || 0,
            avg_visit_frequency: avgFrequency, // days between visits
            push_received: pushLogs?.length || 0,
            days_as_customer: daysSinceCreation
        },
        timeline
    })
}

function mapActionToType(actionType: string): string {
    switch (actionType) {
        case 'ADD_STAMP':
        case 'STAMP_COMPLETE':
            return 'scan'
        case 'AUTO_REDEEM':
        case 'REDEEM_REWARD':
        case 'REDEEM_VOUCHER':
            return 'redemption'
        default:
            return 'scan'
    }
}

function getActionTitle(actionType: string): string {
    switch (actionType) {
        case 'ADD_STAMP': return 'Besuch'
        case 'STAMP_COMPLETE': return 'Karte voll!'
        case 'AUTO_REDEEM': return 'Prämie eingelöst'
        case 'REDEEM_REWARD': return 'Prämie eingelöst'
        case 'REDEEM_VOUCHER': return 'Gutschein eingelöst'
        case 'ADD_POINTS': return 'Punkte gesammelt'
        case 'CHECK_IN': return 'Check-In'
        default: return 'Aktivität'
    }
}

function getActionSubtitle(actionType: string, delta: number): string {
    switch (actionType) {
        case 'ADD_STAMP': return 'Stempel erhalten'
        case 'STAMP_COMPLETE': return 'Prämie bereit!'
        case 'AUTO_REDEEM': return 'Automatisch eingelöst'
        case 'REDEEM_REWARD': return 'Manuell eingelöst'
        case 'REDEEM_VOUCHER': return 'Gutschein verwendet'
        case 'ADD_POINTS': return `+${delta} Punkte`
        default: return ''
    }
}
