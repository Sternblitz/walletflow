import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/pos/push-request
 * Create a push notification request (Managed Push)
 * 
 * The request goes into a queue for agency approval
 */
export async function POST(req: NextRequest) {
    try {
        const { slug, message, scheduledAt } = await req.json()

        if (!slug || !message) {
            return NextResponse.json({ error: 'Missing slug or message' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get campaign by slug
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, name, campaigns(id, name)')
            .eq('slug', slug)
            .single()

        if (clientError || !client || !client.campaigns?.length) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const campaignId = client.campaigns[0].id

        // Insert push request
        const { data: pushRequest, error: insertError } = await supabase
            .from('push_requests')
            .insert({
                campaign_id: campaignId,
                message: message.trim(),
                scheduled_at: scheduledAt || null,
                status: 'pending'
            })
            .select()
            .single()

        if (insertError) {
            console.error('Failed to create push request:', insertError)
            return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
        }

        console.log(`[PUSH REQUEST] New request from ${client.name}: "${message.substring(0, 50)}..."`)

        return NextResponse.json({
            success: true,
            requestId: pushRequest.id,
            message: 'Push-Anfrage wurde zur Genehmigung eingereicht'
        })

    } catch (e) {
        console.error('Push request error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

/**
 * GET /api/pos/push-request?campaignId=XXX
 * Get pending push requests for a campaign
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const slug = searchParams.get('slug')

    if (!campaignId && !slug) {
        return NextResponse.json({ error: 'Missing campaignId or slug' }, { status: 400 })
    }

    const supabase = await createClient()

    let finalCampaignId = campaignId

    if (slug) {
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('campaigns(id)')
            .eq('slug', slug)
            .single()

        if (clientError || !client || !client.campaigns?.length) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }
        finalCampaignId = client.campaigns[0].id
    }

    const { data: requests, error } = await supabase
        .from('push_requests')
        .select('*')
        .eq('campaign_id', finalCampaignId)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests })
}
