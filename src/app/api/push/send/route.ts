
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPushService } from '@/lib/push/push-service'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { message, slug, scheduleTime } = body

        if (!message || !slug) {
            return NextResponse.json({ error: 'Message and slug are required' }, { status: 400 })
        }

        // 1. Get Campaign ID
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('campaigns(id, is_active)')
            .eq('slug', slug)
            .single()

        if (clientError || !clientData?.campaigns) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Find active campaign
        const activeCampaign = (Array.isArray(clientData.campaigns)
            ? clientData.campaigns.find((c: any) => c.is_active)
            : clientData.campaigns) || clientData.campaigns[0]

        if (!activeCampaign) {
            return NextResponse.json({ error: 'No active campaign found' }, { status: 404 })
        }

        const campaignId = activeCampaign.id

        // 2. Create Push Request
        const status = scheduleTime ? 'scheduled' : 'pending'
        const { data: pushRequest, error: insertError } = await supabase
            .from('push_requests')
            .insert({
                campaign_id: campaignId,
                message: message,
                status: status,
                scheduled_at: scheduleTime || null,
                created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single()

        if (insertError) {
            console.error('Failed to create push request:', insertError)
            return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
        }

        // 3. Process if Immediate
        if (!scheduleTime) {
            const pushService = await createPushService()

            // Fire and forget processing to avoid timeout
            pushService.processPushRequest(pushRequest.id).catch(err => {
                console.error('Background push processing failed:', err)
            })

            return NextResponse.json({
                success: true,
                message: 'Push sending started',
                id: pushRequest.id
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Push scheduled',
            id: pushRequest.id,
            scheduledAt: scheduleTime
        })

    } catch (e: any) {
        console.error('Push API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
