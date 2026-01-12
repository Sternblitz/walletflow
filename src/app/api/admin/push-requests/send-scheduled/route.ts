import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToAllPasses } from '../[id]/approve/route'

/**
 * POST /api/admin/push-requests/send-scheduled
 * 
 * Cron-like endpoint that checks for scheduled push requests
 * whose time has arrived and sends them.
 * 
 * This is called via lazy execution (from dashboard loads)
 * or can be called by external cron services.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const now = new Date().toISOString()

        // Find all scheduled requests whose time has arrived
        const { data: dueRequests, error } = await supabase
            .from('push_requests')
            .select('*, campaign:campaigns(id, design_assets, config, name, client:clients(name))')
            .eq('status', 'scheduled')
            .lte('scheduled_at', now)
            .order('scheduled_at', { ascending: true })
            .limit(10) // Process max 10 at a time

        if (error) {
            console.error('Failed to fetch due requests:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        if (!dueRequests || dueRequests.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No scheduled requests due',
                processed: 0
            })
        }

        console.log(`[PUSH SCHEDULER] Found ${dueRequests.length} due requests`)

        let totalSent = 0
        let totalFailed = 0

        for (const request of dueRequests) {
            try {
                const result = await sendPushToAllPasses(supabase, request)

                await supabase
                    .from('push_requests')
                    .update({
                        status: result.sentCount > 0 ? 'sent' : 'failed',
                        sent_at: new Date().toISOString(),
                        recipients_count: result.totalCount,
                        success_count: result.sentCount,
                        failure_count: result.failCount
                    })
                    .eq('id', request.id)

                totalSent += result.sentCount
                totalFailed += result.failCount

                console.log(`[PUSH SCHEDULER] Sent request ${request.id}: ${result.sentCount}/${result.totalCount}`)

            } catch (e) {
                console.error(`[PUSH SCHEDULER] Failed to process request ${request.id}:`, e)

                await supabase
                    .from('push_requests')
                    .update({ status: 'failed' })
                    .eq('id', request.id)
            }
        }

        return NextResponse.json({
            success: true,
            processed: dueRequests.length,
            totalSent,
            totalFailed
        })

    } catch (e) {
        console.error('Send-scheduled error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

/**
 * GET - Check status of scheduled pushes (for debugging)
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: scheduled, error } = await supabase
            .from('push_requests')
            .select('id, message, scheduled_at, status')
            .eq('status', 'scheduled')
            .order('scheduled_at', { ascending: true })

        if (error) {
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json({
            count: scheduled?.length || 0,
            scheduled
        })

    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
