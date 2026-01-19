import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/campaign/[id]/stats
 * 
 * Returns time-based statistics for a campaign
 * Query params:
 *   - period: '24h' | '7d' | '30d' (default: '7d')
 * 
 * Response:
 *   - stamps: number of stamps added
 *   - redemptions: number of redemptions
 *   - newPasses: new passes created
 *   - activeCustomers: customers who scanned in period
 *   - chartData: daily breakdown for charts
 *   - loyalty: loyalty score and message (always positive!)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d'

    const supabase = await createClient()

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
        case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            break
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
        case 'all':
            startDate = new Date(0) // Epoch 0 for all-time
            break
        case '7d':
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    try {
        // 1. Get scan statistics for the period
        const { data: scans, error: scansError } = await supabase
            .from('scans')
            .select('id, action_type, scanned_at, delta_value, pass_id')
            .eq('campaign_id', campaignId)
            .gte('scanned_at', startDate.toISOString())
            .order('scanned_at', { ascending: true })

        if (scansError) {
            console.error('Error fetching scans:', scansError)
            return NextResponse.json({ error: 'Failed to fetch scan data' }, { status: 500 })
        }

        // 2. Get new passes for the period (excluding deleted)
        const { count: newPassesCount, error: passesError } = await supabase
            .from('passes')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .gte('created_at', startDate.toISOString())
            .is('deleted_at', null)
            .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')

        if (passesError) {
            console.error('Error fetching passes:', passesError)
        }

        // 3. Get total passes for loyalty calculation (excluding deleted)
        const { count: totalPasses } = await supabase
            .from('passes')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .is('deleted_at', null)
            .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')

        // 4. Calculate stats from scans
        // Redemption types include all forms of reward redemption
        const redemptionTypes = ['REDEEM', 'AUTO_REDEEM', 'REDEEM_REWARD', 'REDEEM_VOUCHER']

        const stamps = scans?.filter(s => s.action_type === 'ADD_STAMP').length || 0
        const redemptions = scans?.filter(s => redemptionTypes.includes(s.action_type)).length || 0

        // 5. Get unique active customers (passes that were scanned)
        const uniquePassIds = new Set(scans?.map(s => s.pass_id) || [])
        const activeCustomers = uniquePassIds.size

        // 6. Build chart data (daily breakdown)
        const dayMs = 24 * 60 * 60 * 1000
        // If 'all', show last 30 days in chart, otherwise match period
        const days = period === '24h' ? 1 : period === '7d' ? 7 : 30
        const chartData: { date: string; stamps: number; redemptions: number; newPasses: number }[] = []

        // Fetch all passes created in the chart period for accurate daily counts
        const chartStartDate = new Date(now.getTime() - days * dayMs)
        const { data: newPassesInPeriod } = await supabase
            .from('passes')
            .select('id, created_at')
            .eq('campaign_id', campaignId)
            .gte('created_at', chartStartDate.toISOString())
            .is('deleted_at', null)

        for (let i = days - 1; i >= 0; i--) {
            const dayStart = new Date(now.getTime() - (i + 1) * dayMs)
            const dayEnd = new Date(now.getTime() - i * dayMs)
            // Use local date formatting to avoid UTC timezone shift
            const dateStr = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`

            // Filter scans for this day
            const dayScans = scans?.filter(s => {
                const scanDate = new Date(s.scanned_at)
                return scanDate >= dayStart && scanDate < dayEnd
            }) || []

            // Count new passes created on this specific day
            const dayNewPasses = newPassesInPeriod?.filter(p => {
                const passDate = new Date(p.created_at)
                return passDate >= dayStart && passDate < dayEnd
            }).length || 0

            chartData.push({
                date: dateStr,
                stamps: dayScans.filter(s => s.action_type === 'ADD_STAMP').length,
                redemptions: dayScans.filter(s => redemptionTypes.includes(s.action_type)).length,
                newPasses: dayNewPasses
            })
        }

        // 7. Calculate Loyalty Score (ALWAYS positive!)
        const loyalty = calculateLoyaltyScore({
            stamps,
            redemptions,
            newPasses: newPassesCount || 0,
            activeCustomers,
            totalPasses: totalPasses || 0,
            activeDays: chartData.filter(d => d.stamps > 0 || d.redemptions > 0).length
        })

        return NextResponse.json({
            period,
            stats: {
                stamps,
                redemptions,
                newPasses: newPassesCount || 0,
                activeCustomers,
                totalPasses: totalPasses || 0
            },
            chartData,
            loyalty
        })

    } catch (error) {
        console.error('Stats API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

interface LoyaltyInput {
    stamps: number
    redemptions: number
    newPasses: number
    activeCustomers: number
    totalPasses: number
    activeDays: number
}

interface LoyaltyResult {
    score: number
    message: string
    trend: 'up' // Always up!
    milestones: string[]
}

function calculateLoyaltyScore(input: LoyaltyInput): LoyaltyResult {
    // Base score: ALWAYS at least 60% (Positive reinforcement!)
    let score = 60

    // Bonuses (only positive additions, never subtract)
    score += Math.min(15, input.activeDays * 3)      // Up to 15% for active days
    score += Math.min(10, input.stamps * 0.5)        // Up to 10% for stamps
    score += Math.min(5, input.redemptions * 2)      // Up to 5% for redemptions
    score += Math.min(5, input.newPasses)            // Up to 5% for new passes

    // Retention Bonus: If we have > 10 active customers and retention > 10%, give huge bonus
    const retentionRate = input.totalPasses > 0 ? (input.activeCustomers / input.totalPasses) : 0
    if (input.activeCustomers > 5 && retentionRate > 0.1) {
        score += 5
    }

    // Cap at 100
    score = Math.min(100, Math.round(score))

    // Collect milestones (achievements)
    const milestones: string[] = []

    if (score >= 90) milestones.push("🏆 Top 1% in deiner Region")
    else if (score >= 80) milestones.push("🔥 Besser als letzte Woche")

    if (input.stamps >= 100) milestones.push("🎉 100 Stempel geknackt!")
    else if (input.stamps >= 50) milestones.push("🔥 50 Stempel diese Woche!")
    else if (input.stamps >= 20) milestones.push("⭐ 20+ Stempel gesammerslt!")

    if (input.activeDays >= 7) milestones.push("💪 7 Tage in Folge aktiv!")
    else if (input.activeDays >= 5) milestones.push("🌟 5 aktive Tage!")

    if (input.newPasses >= 10) milestones.push("🚀 +10 neue Kunden!")
    else if (input.newPasses >= 5) milestones.push("📈 +5 neue Kunden!")

    if (input.redemptions >= 5) milestones.push("🎁 5 Prämien eingelöst!")

    // Select motivating message (always positive!)
    let message: string

    if (score >= 90) {
        message = "Weltklasse! Deine Kunden sind echte Fans! 🏆"
    } else if (milestones.length >= 3) {
        message = "Unglaublich! Du bist on fire! 🔥"
    } else if (milestones.length >= 2) {
        message = "Super Woche! Das Loyalty-Programm läuft! 💫"
    } else if (input.stamps > 0 || input.redemptions > 0) {
        const positiveMessages = [
            "Deine Kunden lieben es! Weiter so! 🔥",
            "Perfekter Kurs! Das Wachstum ist sichtbar! 📈",
            "Super Fortschritt diese Woche! 💪",
            "Die Treue deiner Kunden zahlt sich aus! ⭐"
        ]
        message = positiveMessages[Math.floor(Math.random() * positiveMessages.length)]
    } else {
        const encouragingMessages = [
            "Alles bereit für den nächsten Ansturm! 🚀",
            "Dein System ist startklar für neue Kunden! 💫",
            "Perfekte Zeit für einen kleinen Push! 📣"
        ]
        message = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]
    }

    return {
        score,
        message,
        trend: 'up', // Always up!
        milestones
    }
}
