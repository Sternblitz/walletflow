import { NextRequest, NextResponse } from 'next/server'
import { createPushService } from '@/lib/push/push-service'

/**
 * Cron endpoint for processing queued push requests
 * 
 * Called every minute by Vercel Cron (or external cron service)
 * Handles large campaigns that exceed the direct-send threshold
 * 
 * Security: Validates CRON_SECRET header
 */
export async function GET(req: NextRequest) {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Allow if no secret configured (for easy testing)
        if (cronSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    try {
        const pushService = await createPushService()
        const result = await pushService.processQueuedPushes()

        return NextResponse.json({
            success: true,
            processed: result.processed,
            passesHandled: result.passesHandled,
            errors: result.errors.length > 0 ? result.errors : undefined
        })

    } catch (e: any) {
        console.error('[CRON] Push processor error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// Also support POST for manual triggers
export const POST = GET
