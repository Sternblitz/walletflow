import { SupabaseClient } from '@supabase/supabase-js'

export type ReviewStats = {
    total: number
    counts: { 1: number; 2: number; 3: number; 4: number; 5: number }
    average: number
    breakdown: { rating: number; count: number; percentage: number }[]
    recentActivity: ReviewActivity[]
}

export type ReviewActivity = {
    id: string
    type: 'feedback' | 'rating_only'
    rating: number
    comment?: string
    createdAt: string
}

export async function getReviewStats(supabase: SupabaseClient, campaignId: string): Promise<ReviewStats> {
    // 1. Get ALL 'rating_clicked' events (for counts and basic history)
    const { data: events } = await supabase
        .from('review_funnel_events')
        .select('id, rating, created_at, event_type')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'rating_clicked')
        .order('created_at', { ascending: false })

    // 2. Get detailed feedback (for 1-3 stars text)
    const { data: feedback } = await supabase
        .from('review_feedback')
        .select('id, rating, feedback_text, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

    // --- Process Stats ---
    const allEvents = events || []
    const total = allEvents.length
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let sum = 0

    allEvents.forEach(e => {
        if (e.rating >= 1 && e.rating <= 5) {
            counts[e.rating as 1 | 2 | 3 | 4 | 5]++
            sum += e.rating
        }
    })

    const average = total > 0 ? Number((sum / total).toFixed(1)) : 0

    const breakdown = [5, 4, 3, 2, 1].map(star => ({
        rating: star,
        count: counts[star as 1 | 2 | 3 | 4 | 5],
        percentage: total > 0 ? Math.round((counts[star as 1 | 2 | 3 | 4 | 5] / total) * 100) : 0
    }))

    // --- Process Activity Feed ---
    // We want to combine these.
    // For 1-3 stars: Use 'feedback' entries if available (they have text).
    // Note: 'review_feedback' is only created if they submit the text form.
    // 'events' records the initial click.
    // If they click 1 star but don't submit text -> we rely on 'event'.
    // If they submit text -> we have 'feedback'.

    // Strategy: Use all Feedback entries.
    // AND use Events that represent 4-5 stars.
    // AND use Events < 4 stars ONLY if they didn't submit feedback? Hard to correlate without session ID.
    //
    // Simplification for MVP:
    // List all "Feedback" entries (1-3 stars with text).
    // List "Positive Ratings" (4-5 stars) from events.
    // Missing: 1-3 stars who didn't submit text. (We can omit them from "Activity Feed" text list, but they are in stats).
    // User wants "Liste von den 1-3 sterne inkl was bewertet wurde".

    const activity: ReviewActivity[] = []

    // Add all text feedbacks (1-3 stars)
    feedback?.forEach(f => {
        activity.push({
            id: f.id,
            type: 'feedback',
            rating: f.rating,
            comment: f.feedback_text,
            createdAt: f.created_at
        })
    })

    // Add 4-5 star ratings (from events)
    // We filter events where rating >= 4.
    allEvents.forEach(e => {
        if (e.rating >= 4) {
            activity.push({
                id: e.id,
                type: 'rating_only',
                rating: e.rating,
                comment: undefined,
                createdAt: e.created_at
            })
        }
        // Also add 1-3 star events IF we want to show "clicked but no text"?
        // Let's stick to positive + text feedbacks to keep list clean, per user request "inkl was bewertet wurde".
    })

    // Sort by date desc
    activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
        total,
        counts,
        average,
        breakdown,
        recentActivity: activity // Return all
    }
}
