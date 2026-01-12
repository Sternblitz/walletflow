import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToAllPasses } from '../approve/route'

/**
 * POST /api/admin/push-requests/[id]/send-now
 * 
 * Immediately send a scheduled push request (bypass the scheduled time)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // 1. Get Request Details
        const { data: request, error: reqError } = await supabase
            .from('push_requests')
            .select('*, campaign:campaigns(id, design_assets, config, name, client:clients(name))')
            .eq('id', id)
            .single()

        if (reqError || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // Only allow for scheduled or approved requests
        if (!['scheduled', 'approved'].includes(request.status)) {
            return NextResponse.json({
                error: 'Request must be scheduled or approved to send now'
            }, { status: 400 })
        }

        // 2. Send to all passes
        const result = await sendPushToAllPasses(supabase, request)

        // 3. Update status to sent
        await supabase
            .from('push_requests')
            .update({
                status: result.sentCount > 0 ? 'sent' : 'failed',
                sent_at: new Date().toISOString(),
                recipients_count: result.totalCount,
                success_count: result.sentCount,
                failure_count: result.failCount
            })
            .eq('id', id)

        console.log(`[PUSH] Sent scheduled request ${id} immediately: ${result.sentCount}/${result.totalCount}`)

        return NextResponse.json({
            success: true,
            sent: result.sentCount,
            failed: result.failCount
        })

    } catch (e) {
        console.error('Send-now error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
