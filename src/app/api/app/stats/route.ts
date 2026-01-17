import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const slug = searchParams.get('slug')
        const range = searchParams.get('range') || '7d' // '24h', '7d', '30d'

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get client and ACTIVE campaign
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, campaigns(id, is_active)')
            .eq('slug', slug)
            .single()

        const activeCampaign = client?.campaigns?.find((c: any) => c.is_active) || client?.campaigns?.[0]

        if (clientError || !client || !activeCampaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const campaignId = activeCampaign.id

        // 2. Determine Date Range
        const startDate = new Date()
        const now = new Date()
        let dateFormat: 'hour' | 'day' = 'day'

        switch (range) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24)
                dateFormat = 'hour'
                break
            case '30d':
                startDate.setDate(startDate.getDate() - 30)
                break
            case '7d':
            default:
                startDate.setDate(startDate.getDate() - 7)
                break
        }

        // 3. Fetch Data

        // A. Stamp Events (Stamps & Redemptions)
        const { data: events } = await supabase
            .from('stamp_events')
            .select('action, created_at')
            .eq('campaign_id', campaignId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true })

        // B. New Passes (New Customers)
        const { data: newPasses } = await supabase
            .from('passes')
            .select('created_at')
            .eq('campaign_id', campaignId)
            .gte('created_at', startDate.toISOString())

        // C. Total Installed (Global context)
        const { count: totalInstalled } = await supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .or('is_installed_on_ios.eq.true,is_installed_on_android.eq.true,verification_status.eq.verified')

        const { count: appleCount } = await supabase
            .from('passes').select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId).eq('is_installed_on_ios', true)

        const { count: googleCount } = await supabase
            .from('passes').select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId).eq('is_installed_on_android', true)


        // 4. Aggregate Data
        const stampsCount = events?.filter(e => e.action === 'stamp').length || 0
        const redemptionsCount = events?.filter(e => e.action === 'redeem').length || 0
        const newPassesCount = newPasses?.length || 0

        // 5. Build Chart Data
        const historyMap = new Map<string, { date: string, stamps: number, redemptions: number, newPasses: number }>()

        // Helper to fill empty slots? 
        // For robustness, we let the frontend chart handle gaps or we return sparse data. 
        // Returning sparse data is fine for Recharts usually.

        // Aggregate Events
        events?.forEach(ev => {
            const d = new Date(ev.created_at)
            // Use ISO string for bucket key
            const key = dateFormat === 'hour'
                ? d.toISOString().substring(0, 13) + ":00:00.000Z" // Hourly bucket
                : d.toISOString().substring(0, 10) + "T00:00:00.000Z" // Daily bucket

            if (!historyMap.has(key)) {
                historyMap.set(key, { date: key, stamps: 0, redemptions: 0, newPasses: 0 })
            }
            const entry = historyMap.get(key)!
            if (ev.action === 'stamp') entry.stamps++
            if (ev.action === 'redeem') entry.redemptions++
        })

        // Aggregate New Passes
        newPasses?.forEach(p => {
            const d = new Date(p.created_at)
            const key = dateFormat === 'hour'
                ? d.toISOString().substring(0, 13) + ":00:00.000Z"
                : d.toISOString().substring(0, 10) + "T00:00:00.000Z"

            if (!historyMap.has(key)) {
                historyMap.set(key, { date: key, stamps: 0, redemptions: 0, newPasses: 0 })
            }
            const entry = historyMap.get(key)!
            entry.newPasses++
        })

        const history = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        // 6. Gamification / Insights
        let insight = "Alles ruhig..."
        if (stampsCount > 0 || newPassesCount > 0) insight = "Guter Start!"

        if (range === '24h') {
            if (stampsCount > 20) insight = "🔥 Der Laden brummt heute!"
            else if (stampsCount > 5) insight = "Weiter so! Die Kunden kommen."
            if (redemptionsCount > 3) insight += " Belohnungen werden eingelöst! 🎁"
        } else {
            if (newPassesCount > 10) insight = "🚀 Starkes Wachstum diese Woche!"
            else if (stampsCount > 50) insight = "Boah! Mega Aktivität! 🔥"
        }

        return NextResponse.json({
            range,
            summary: {
                stamps: stampsCount,
                redemptions: redemptionsCount,
                newPasses: newPassesCount,
                totalInstalled: totalInstalled || 0,
                apple: appleCount || 0,
                google: googleCount || 0
            },
            history,
            insight
        })

    } catch (e) {
        console.error('Stats error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
