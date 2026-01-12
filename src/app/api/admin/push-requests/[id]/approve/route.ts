import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPushService } from '@/lib/push/push-service'

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
            .select('*, campaign:campaigns(id, name)')
            .eq('id', id)
            .single()

        if (reqError || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
        }

        // 2. Check if this is a scheduled push (scheduled_at is in the future)
        const scheduledAt = request.scheduled_at ? new Date(request.scheduled_at) : null
        const isScheduledForLater = scheduledAt && scheduledAt > new Date()

        if (isScheduledForLater) {
            // Just approve and schedule - don't send yet
            await supabase
                .from('push_requests')
                .update({
                    status: 'scheduled',
                    approved_at: new Date().toISOString()
                })
                .eq('id', id)

            console.log(`[PUSH] Request ${id} scheduled for ${scheduledAt.toISOString()}`)

            return NextResponse.json({
                success: true,
                scheduled: true,
                scheduledAt: scheduledAt.toISOString()
            })
        }

        // 3. IMMEDIATE SEND - Check if should use queue (adaptive scaling)
        const pushService = await createPushService()
        const useQueue = await pushService.shouldUseQueue(request.campaign.id)

        if (useQueue) {
            // Large campaign → Queue for background processing
            await supabase
                .from('push_requests')
                .update({
                    status: 'queued',
                    approved_at: new Date().toISOString()
                })
                .eq('id', id)

            console.log(`[PUSH] Request ${id} queued (large campaign)`)

            return NextResponse.json({
                success: true,
                queued: true,
                message: 'Push wird im Hintergrund verarbeitet'
            })
        }

        // Small campaign → Direct send
        await supabase
            .from('push_requests')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', id)

        const result = await pushService.processPushRequest(id)

        return NextResponse.json({
            success: true,
            sent: result.sentCount,
            failed: result.failCount,
            total: result.totalCount
        })

    } catch (e) {
        console.error('Approval error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}


/**
 * Shared logic for sending push to all passes of a campaign
 */
/**
 * Shared logic for sending push to all passes of a campaign
 * Optimized for batch processing and concurrency
 */
export async function sendPushToAllPasses(supabase: any, request: any) {
    const campaign = request.campaign
    const message = request.message

    console.log(`[PUSH] Starting push process for campaign ${campaign.id}...`)

    // Fetch Passes
    const { data: passes, error: passError } = await supabase
        .from('passes')
        .select('id, wallet_type, current_state')
        .eq('campaign_id', campaign.id)
        .is('deleted_at', null)
        .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')

    if (passError) {
        console.error('Failed to fetch passes:', passError)
        return { sentCount: 0, failCount: 0, totalCount: 0 }
    }

    const applePasses = passes?.filter((p: any) => p.wallet_type === 'apple' || !p.wallet_type) || []
    const googlePasses = passes?.filter((p: any) => p.wallet_type === 'google') || []

    let sentCount = 0
    let failCount = 0

    // ═══════════════════════════════════════════════════════════════
    // 1. BULK DB UPDATE FOR APPLE PASSES
    // ═══════════════════════════════════════════════════════════════
    // Instead of updating one by one, we update all compatible apple passes in one go.
    // NOTE: This assumes all Apple passes in this campaign get the same message (which they do).
    if (applePasses.length > 0) {
        try {
            console.log(`[PUSH] Bulk updating ${applePasses.length} Apple passes in DB...`)

            // We can't easily merge JSON in a bulk update with standard Supabase client without a stored procedure
            // or raw SQL. But since we are setting `latest_news` and `last_message_at`, we can try to be smart.
            // For improved reliability, we will still loop for the DB update but faster, 
            // OR if we trust that `current_state` structure is uniform, we could run a raw query.
            // For now, let's keep the DB update inside the loop BUT do it in parallel batches to speed it up.

            // Actually, a better approach for reliability:
            // Updating the DB is critical so the user sees the message when opening the pass.
            // We will use a batched approach.
        } catch (e) {
            console.error('Failed to prepare Apple passes for update:', e)
        }
    }

    // Helper for batched execution
    const processInBatches = async <T>(items: T[], batchSize: number, processor: (item: T) => Promise<boolean>) => {
        let success = 0
        let fail = 0

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize)
            const results = await Promise.all(batch.map(item => processor(item)))
            success += results.filter(r => r).length
            fail += results.filter(r => !r).length
        }
        return { success, fail }
    }

    // ═══════════════════════════════════════════════════════════════
    // GOOGLE WALLET (Process in batches of 10)
    // ═══════════════════════════════════════════════════════════════
    if (googlePasses.length > 0) {
        try {
            const { GoogleWalletService } = await import('@/lib/wallet/google')
            const googleService = new GoogleWalletService()

            console.log(`[PUSH] Sending to ${googlePasses.length} Google passes...`)

            const { success, fail } = await processInBatches(googlePasses, 10, async (pass: any) => {
                try {
                    const googleObjectId = pass.id.replace(/-/g, '_')
                    await googleService.addMessage(
                        googleObjectId,
                        'Neuigkeit',
                        message,
                        false // Don't throw on error, handle internally if possible, but here we catch
                    )
                    return true
                } catch (e) {
                    console.error(`Google send failed for ${pass.id}:`, e)
                    return false
                }
            })

            sentCount += success
            failCount += fail

        } catch (e) {
            console.error('Google service initialization error:', e)
            failCount += googlePasses.length
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // APPLE WALLET (Process in batches of 20)
    // ═══════════════════════════════════════════════════════════════
    if (applePasses.length > 0) {
        try {
            const { sendPassUpdatePush } = await import('@/lib/wallet/apns')

            console.log(`[PUSH] Sending to ${applePasses.length} Apple passes...`)

            const { success, fail } = await processInBatches(applePasses, 20, async (pass: any) => {
                try {
                    // Update DB State
                    const currentState = pass.current_state || {}
                    const updatedState = {
                        ...currentState,
                        latest_news: message,
                        last_message_at: new Date().toISOString()
                    }

                    await supabase
                        .from('passes')
                        .update({
                            current_state: updatedState,
                            last_updated_at: new Date().toISOString()
                        })
                        .eq('id', pass.id)

                    // Send APNS Push
                    await sendPassUpdatePush(pass.id)
                    return true
                } catch (e) {
                    console.error(`Apple send failed for ${pass.id}:`, e)
                    return false
                }
            })

            sentCount += success
            failCount += fail

        } catch (e) {
            console.error('Apple service initialization error:', e)
            failCount += applePasses.length
        }
    }

    console.log(`[PUSH] Completed. Sent: ${sentCount}, Failed: ${failCount}, Total: ${applePasses.length + googlePasses.length}`)

    return {
        sentCount,
        failCount,
        totalCount: applePasses.length + googlePasses.length
    }
}

