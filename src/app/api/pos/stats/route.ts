import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/pos/stats?slug=XXX
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

        // Get total passes (only count those that have been downloaded/accessed)
        // A pass is "active" when last_updated_at is set (was fetched at least once)
        const { count: totalPasses } = await supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .not('last_updated_at', 'is', null)

        // Get Apple vs Google count (only downloaded ones)
        const { count: appleCount } = await supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('wallet_type', 'apple')
            .not('last_updated_at', 'is', null)

        const { count: googleCount } = await supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('wallet_type', 'google')
            .not('last_updated_at', 'is', null)

        // Get today's stamps
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { count: todayStamps } = await supabase
            .from('stamp_events')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('action', 'stamp')
            .gte('created_at', todayStart.toISOString())

        // Get total redemptions
        const { count: totalRedemptions } = await supabase
            .from('stamp_events')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('action', 'redeem')

        // Get this week's stamps (for trend)
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 7)

        const { count: weekStamps } = await supabase
            .from('stamp_events')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('action', 'stamp')
            .gte('created_at', weekStart.toISOString())

        return NextResponse.json({
            totalPasses: totalPasses || 0,
            appleCount: appleCount || 0,
            googleCount: googleCount || 0,
            todayStamps: todayStamps || 0,
            weekStamps: weekStamps || 0,
            totalRedemptions: totalRedemptions || 0
        })

    } catch (e) {
        console.error('Stats error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
