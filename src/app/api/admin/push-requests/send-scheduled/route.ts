import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPushService } from '@/lib/push/push-service'

/**
 * POST /api/admin/push-requests/send-scheduled
 * 
 * Cron-like endpoint that checks for scheduled push requests
 * whose time has arrived and sends them.
 * 
 * Uses PushService for reliable processing with:
 * - Processing lock (prevents duplicate sends)
 * - Timeout detection (resets stuck jobs)
 * - Retry mechanism (handles transient failures)
 * 
 * Trigger via:
 * - Lazy execution (from dashboard loads)
 * - Vercel Cron (vercel.json)
 * - External cron services
 */
export async function POST(req: NextRequest) {
    try {
        const pushService = await createPushService()

        // Process all due scheduled pushes
        const result = await pushService.processScheduledPushes()

        return NextResponse.json({
            success: true,
            processed: result.processed,
            errors: result.errors.length > 0 ? result.errors : undefined
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

        // Get scheduled requests
        const { data: scheduled, error: schedError } = await supabase
            .from('push_requests')
            .select('id, message, edited_message, scheduled_at, status, processing_started_at, retry_count')
            .in('status', ['scheduled', 'processing'])
            .order('scheduled_at', { ascending: true })

        if (schedError) {
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // Check for stale processing jobs (stuck for > 10 minutes)
        const stale = scheduled?.filter(r => {
            if (r.status !== 'processing' || !r.processing_started_at) return false
            const startedAt = new Date(r.processing_started_at).getTime()
            const staleThreshold = Date.now() - 10 * 60 * 1000 // 10 minutes
            return startedAt < staleThreshold
        }) || []

        return NextResponse.json({
            count: scheduled?.length || 0,
            stale: stale.length,
            scheduled: scheduled?.map(r => ({
                id: r.id,
                message: r.edited_message || r.message,
                scheduled_at: r.scheduled_at,
                status: r.status,
                retry_count: r.retry_count
            }))
        })

    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

