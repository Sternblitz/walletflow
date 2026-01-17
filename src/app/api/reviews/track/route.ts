import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { passId, campaignId, eventType, rating, metadata } = body

        // Validate required fields
        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
        }

        if (!eventType) {
            return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
        }

        // Valid event types
        const validEventTypes = ['popup_shown', 'rating_clicked', 'feedback_submitted', 'google_redirect', 'dismissed']
        if (!validEventTypes.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
        }

        const supabase = await createClient()

        // Insert event
        const { data, error } = await supabase
            .from('review_funnel_events')
            .insert({
                pass_id: passId || null,
                campaign_id: campaignId,
                event_type: eventType,
                rating: rating || null,
                metadata: metadata || {}
            })
            .select()
            .single()

        if (error) {
            console.error('[REVIEW TRACK] Insert error:', error)
            return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
        }

        console.log(`[REVIEW TRACK] Event: ${eventType}, Campaign: ${campaignId}, Rating: ${rating || 'N/A'}`)

        return NextResponse.json({ success: true, id: data.id })

    } catch (e) {
        console.error('[REVIEW TRACK] Error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
