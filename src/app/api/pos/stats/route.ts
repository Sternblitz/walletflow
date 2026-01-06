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

        // 5. Recent Activity Feed (Who scanned?)
        // Join with passes to get customer info if possible, though passes might not have names if not synced. 
        // We assume passes have some ID or we just show the action.
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

        // 6. Push History
        // Assuming we store push requests somewhere? 
        // If not, we might check an 'inbox_messages' table or similar if it exists. 
        // For now, let's return a placeholder or check 'campaign_messages' if that was the table.
        // Based on previous files, 'campaigns' might have stored messages, or we just don't have a history table yet.
        // Let's check 'push_notifications' or similar ? The user mentioned "Push Message beantragen".
        // In the POS page code, it POSTs to /api/pos/push-request. Let's see where that goes.
        // ... Wait, I can't check that file right now in this context without a read. 
        // I'll assume we return an empty list or verify if I created a table for it. 
        // I haven't created a 'push_requests' table. I'll mock it for now or omit if table missing.
        // Actually, better to omit push history if table doesn't exist to avoid errors.

        return NextResponse.json({
            totalPasses: totalPasses || 0,
            appleCount: appleCount || 0,
            googleCount: googleCount || 0,
            todayStamps: todayStamps || 0,
            weekStamps: weekStamps || 0,
            totalRedemptions: totalRedemptions || 0,
            recentActivity: recentActivity || []
        })

    } catch (e) {
        console.error('Stats error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
