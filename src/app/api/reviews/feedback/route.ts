import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { passId, campaignId, rating, feedbackText } = body

        // Validate required fields
        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
        }

        if (!rating || rating < 1 || rating > 3) {
            return NextResponse.json({ error: 'rating must be between 1 and 3' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Insert feedback
        const { data, error } = await supabase
            .from('review_feedback')
            .insert({
                pass_id: passId || null,
                campaign_id: campaignId,
                rating,
                feedback_text: feedbackText || null
            })
            .select()
            .single()

        if (error) {
            console.error('[REVIEW FEEDBACK] Insert error:', error)
            return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
        }

        console.log(`[REVIEW FEEDBACK] Saved: Campaign ${campaignId}, Rating ${rating}, HasText: ${!!feedbackText}`)

        return NextResponse.json({ success: true, id: data.id })

    } catch (e) {
        console.error('[REVIEW FEEDBACK] Error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
