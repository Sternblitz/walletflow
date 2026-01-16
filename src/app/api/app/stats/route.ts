import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/app/stats?slug=XXX
 * Get statistics for a campaign (Chef dashboard)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const slug = searchParams.get('slug')

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get campaign by slug
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, campaigns(id)')
            .eq('slug', slug)
            .single()

        if (clientError || !client || !client.campaigns?.length) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const campaignId = client.campaigns[0].id

        // 1. Strict Active Pass Count (Installed only)
        // We check for is_installed_on_ios OR is_installed_on_android OR verification_status = 'verified'
        const { count: totalPasses } = await supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .or('is_installed_on_ios.eq.true,is_installed_on_android.eq.true,verification_status.eq.verified')

        // 2. Apple Count
        const { count: appleCount } = await supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('is_installed_on_ios', true)

        // 3. Google Count
        const { count: googleCount } = await supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('is_installed_on_android', true)

        // 4. Today's Statistics
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 7)

        const { count: todayStamps } = await supabase
            .from('stamp_events')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('action', 'stamp')
            .gte('created_at', todayStart.toISOString())

        const { count: weekStamps } = await supabase
            .from('stamp_events')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('action', 'stamp')
            .gte('created_at', weekStart.toISOString())

        const { count: totalRedemptions } = await supabase
            .from('stamp_events')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('action', 'redeem')

        // 5. Recent Activity Feed
        const { data: recentActivity } = await supabase
            .from('stamp_events')
            .select(`
                id,
                action,
                created_at,
                stamps_after,
                passes (
                    id,
                    serial_number,
                    wallet_type
                )
            `)
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })
            .limit(10)

        // 6. 7-Day History Chart Data
        const chartStart = new Date()
        chartStart.setDate(chartStart.getDate() - 6) // Last 7 days including today
        chartStart.setHours(0, 0, 0, 0)

        const { data: historyEvents } = await supabase
            .from('stamp_events')
            .select('created_at, action')
            .eq('campaign_id', campaignId)
            .gte('created_at', chartStart.toISOString())

        // Aggregate by date
        const historyMap = new Map<string, { date: string, stamps: number, redemptions: number }>()

        // Initialize last 7 days with 0
        for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateKey = d.toISOString().split('T')[0] // YYYY-MM-DD
            historyMap.set(dateKey, { date: dateKey, stamps: 0, redemptions: 0 })
        }

        historyEvents?.forEach(ev => {
            const dateKey = new Date(ev.created_at).toISOString().split('T')[0]
            if (historyMap.has(dateKey)) {
                const entry = historyMap.get(dateKey)!
                if (ev.action === 'stamp') entry.stamps++
                if (ev.action === 'redeem') entry.redemptions++
            }
        })

        // formatted details for frontend graphs
        const historyChart = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        // 7. Retention / Churn Risk
        // Proxy: Count passes with > 1 stamp vs total installed
        // "loyal": > 1 stamp or > 0 redemptions (but strictly speaking just > 1 stamp means they came back or started well)
        // We'll trust current state for simplicity
        // Check "passes" where jsonb "current_state"->'stamps' > 1
        // Note: Supabase filter on jsonb: .gt('current_state->stamps', 1) might fail if text.
        // We can fetch all installed passes and count in JS (safer for small-med scale)
        // Or assume verified = loyal? No.

        // Let's do a quick fetch of ID + Stamps for installed passes
        const { data: installedPasses } = await supabase
            .from('passes')
            .select('current_state')
            .eq('campaign_id', campaignId)
            .or('is_installed_on_ios.eq.true,is_installed_on_android.eq.true,verification_status.eq.verified')

        let returningCount = 0
        let newCount = 0

        installedPasses?.forEach(p => {
            const stamps = (p.current_state as any)?.stamps || 0
            if (stamps > 1) returningCount++
            else newCount++
        })

        const retentionRate = (totalPasses || 0) > 0
            ? Math.round((returningCount / (totalPasses || 1)) * 100)
            : 0


        return NextResponse.json({
            summary: {
                totalPasses: totalPasses || 0,
                appleCount: appleCount || 0,
                googleCount: googleCount || 0,
                todayStamps: todayStamps || 0,
                weekStamps: weekStamps || 0,
                totalRedemptions: totalRedemptions || 0,
                retentionRate,
                newCustomers: newCount,
                returningCustomers: returningCount
            },
            recentActivity: recentActivity || [],
            history: historyChart
        })

    } catch (e) {
        console.error('Stats error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
