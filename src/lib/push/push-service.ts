/**
 * Centralized Push Service
 * 
 * Handles all push notification operations for both Apple and Google Wallet.
 * Provides batching, error handling, and queue management.
 */

import { createClient } from '@/lib/supabase/server'
import { sendPassUpdatePush } from '@/lib/wallet/apns'
import { GoogleWalletService } from '@/lib/wallet/google'

export interface PushResult {
    sentCount: number
    failCount: number
    totalCount: number
    errors: string[]
}

export interface PushOptions {
    batchSize?: number
    notifyGoogle?: boolean
    inactiveDays?: number // Only send to customers inactive for X days (based on last_scanned_at)
    // Redeem Flow
    redeemFlowEnabled?: boolean
    redeemExpiresHours?: number | null
}

/**
 * Centralized Push Service for managing all push operations
 */
export class PushService {
    private supabase: any
    private googleService: GoogleWalletService | null = null

    constructor(supabase: any) {
        this.supabase = supabase
    }

    /**
     * Get Google Wallet service (lazy initialization)
     */
    private getGoogleService(): GoogleWalletService {
        if (!this.googleService) {
            this.googleService = new GoogleWalletService()
        }
        return this.googleService
    }

    /**
     * Send push notifications to all passes of a campaign
     */
    async sendToAllPasses(
        campaignId: string,
        message: string,
        options: PushOptions = {}
    ): Promise<PushResult> {
        const { batchSize = 20, notifyGoogle = true, inactiveDays, redeemFlowEnabled, redeemExpiresHours } = options
        const errors: string[] = []

        console.log(`[PushService] Starting push for campaign ${campaignId}${inactiveDays ? ` (inactive ${inactiveDays} days)` : ''}${redeemFlowEnabled ? ' [REDEEM FLOW]' : ''}`)

        // Build query for active passes WITH MARKETING CONSENT (verified OR installed)
        const { data: allPasses, error: passError } = await this.supabase
            .from('passes')
            .select('id, wallet_type, current_state, last_scanned_at, consent_marketing')
            .eq('campaign_id', campaignId)
            .is('deleted_at', null)
            .eq('consent_marketing', true)  // Only send to opted-in customers!
            .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')

        if (passError) {
            console.error('[PushService] Failed to fetch passes:', passError)
            return { sentCount: 0, failCount: 0, totalCount: 0, errors: [passError.message] }
        }

        if (!allPasses || allPasses.length === 0) {
            console.log('[PushService] No passes found for campaign')
            return { sentCount: 0, failCount: 0, totalCount: 0, errors: ['No passes found'] }
        }

        // Apply inactivity filter in JavaScript for correct logic
        let passes = allPasses
        if (inactiveDays && inactiveDays > 0) {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)
            const cutoffTime = cutoffDate.getTime()

            passes = allPasses.filter((p: any) => {
                // Include if never scanned OR last scan before cutoff
                if (!p.last_scanned_at) return true
                return new Date(p.last_scanned_at).getTime() < cutoffTime
            })
            console.log(`[PushService] Filtered ${allPasses.length} → ${passes.length} inactive customers (${inactiveDays} days)`)
        }

        if (passes.length === 0) {
            console.log('[PushService] No inactive customers found matching criteria')
            return { sentCount: 0, failCount: 0, totalCount: 0, errors: ['No inactive customers found'] }
        }

        // ═══════════════════════════════════════════════════════════════
        // REDEEM FLOW: Create GIFTS
        // ═══════════════════════════════════════════════════════════════
        if (redeemFlowEnabled) {
            try {
                console.log(`[PushService] Creating gifts for ${passes.length} passes`)
                const expiresAt = redeemExpiresHours
                    ? new Date(Date.now() + redeemExpiresHours * 60 * 60 * 1000).toISOString()
                    : null

                const giftInserts = passes.map((p: any) => ({
                    pass_id: p.id,
                    campaign_id: campaignId,
                    gift_type: 'push',
                    gift_title: '🎁 Push-Angebot',
                    gift_message: message,
                    expires_at: expiresAt
                }))

                // Insert in chunks of 1000 to avoid request size limits
                const chunkSize = 1000
                for (let i = 0; i < giftInserts.length; i += chunkSize) {
                    const chunk = giftInserts.slice(i, i + chunkSize)
                    const { error: giftError } = await this.supabase
                        .from('pass_gifts')
                        .insert(chunk)

                    if (giftError) {
                        console.error('[PushService] Error creating gifts:', giftError)
                        errors.push(`Gift creation error: ${giftError.message}`)
                    }
                }
            } catch (e: any) {
                console.error('[PushService] Gift creation failed:', e)
                errors.push(`Gift logic error: ${e.message}`)
            }
        }

        // Separate by platform
        const applePasses = passes.filter((p: any) => p.wallet_type === 'apple' || !p.wallet_type)
        const googlePasses = passes.filter((p: any) => p.wallet_type === 'google')

        let sentCount = 0
        let failCount = 0

        // Helper for batched execution
        const processInBatches = async <T>(items: T[], size: number, processor: (item: T) => Promise<boolean>) => {
            let success = 0
            let fail = 0
            for (let i = 0; i < items.length; i += size) {
                const batch = items.slice(i, i + size)
                const results = await Promise.all(batch.map(item => processor(item)))
                success += results.filter(r => r).length
                fail += results.filter(r => !r).length
            }
            return { success, fail }
        }

        // ═══════════════════════════════════════════════════════════════
        // APPLE WALLET (Process in batches of 20)
        // ═══════════════════════════════════════════════════════════════
        if (applePasses.length > 0) {
            console.log(`[PushService] Processing ${applePasses.length} Apple passes`)

            const { success, fail } = await processInBatches(applePasses, batchSize, async (pass: any) => {
                try {
                    // Update DB State with the message
                    const currentState = pass.current_state || {}
                    const now = new Date().toISOString()

                    await this.supabase
                        .from('passes')
                        .update({
                            current_state: {
                                ...currentState,
                                latest_news: message,
                                last_message_at: now
                            },
                            last_updated_at: now
                        })
                        .eq('id', pass.id)

                    // Send APNS Push using the working function
                    const pushResult = await sendPassUpdatePush(pass.id)
                    const status = pushResult.sent > 0 ? 'sent' : 'failed'

                    // Log to push_logs (Activity Timeline)
                    try {
                        await this.supabase.from('push_logs').insert({
                            pass_id: pass.id,
                            message: message,
                            status: status,
                            error_message: status === 'failed' ? pushResult.errors.join(', ') : null
                        })
                    } catch (e) {
                        // Ignore logging errors
                    }

                    if (status === 'failed') throw new Error(pushResult.errors.join(', '))
                    return true
                } catch (e: any) {
                    console.error(`[PushService] Apple send failed for ${pass.id}:`, e.message)
                    errors.push(`Apple ${pass.id}: ${e.message}`)
                    return false
                }
            })

            sentCount += success
            failCount += fail
        }

        // ═══════════════════════════════════════════════════════════════
        // GOOGLE WALLET (Process in batches of 10)
        // ═══════════════════════════════════════════════════════════════
        if (googlePasses.length > 0 && notifyGoogle) {
            console.log(`[PushService] Processing ${googlePasses.length} Google passes`)

            try {
                const googleService = this.getGoogleService()

                const { success, fail } = await processInBatches(googlePasses, 10, async (pass: any) => {
                    try {
                        const googleObjectId = pass.id.replace(/-/g, '_')
                        await googleService.addMessage(
                            googleObjectId,
                            'Neuigkeit',
                            message,
                            true // notify
                        )

                        // Log to push_logs (Activity Timeline)
                        try {
                            await this.supabase.from('push_logs').insert({
                                pass_id: pass.id,
                                message: message,
                                status: 'sent',
                                error_message: null
                            })
                        } catch (e) {
                            // Ignore logging errors
                        }

                        return true
                    } catch (e: any) {
                        console.error(`[PushService] Google push failed for ${pass.id}:`, e.message)

                        // Log failure to push_logs
                        try {
                            await this.supabase.from('push_logs').insert({
                                pass_id: pass.id,
                                message: message,
                                status: 'failed',
                                error_message: e.message
                            })
                        } catch {
                            // Ignore
                        }

                        return false
                    }
                })

                sentCount += success
                failCount += fail
            } catch (e: any) {
                console.error('[PushService] Google service error:', e)
                errors.push(`Google service error: ${e.message}`)
                failCount += googlePasses.length
            }
        }

        console.log(`[PushService] Completed. Sent: ${sentCount}, Failed: ${failCount}, Total: ${passes.length}`)

        return {
            sentCount,
            failCount,
            totalCount: passes.length,
            errors
        }
    }

    /**
     * Process a push request (called from approval or cron)
     */
    async processPushRequest(requestId: string): Promise<PushResult> {
        // Get request with campaign info including targeting
        const { data: request, error: reqError } = await this.supabase
            .from('push_requests')
            .select('*, campaign:campaigns(id, name)')
            .eq('id', requestId)
            .single()

        if (reqError || !request) {
            console.error('[PushService] Request not found:', reqError)
            return { sentCount: 0, failCount: 0, totalCount: 0, errors: ['Request not found'] }
        }

        // Use edited message if available, otherwise original
        const message = request.edited_message || request.message

        // Build options based on targeting
        const options: PushOptions = {}
        if (request.target_type === 'inactive' && request.inactive_days) {
            options.inactiveDays = request.inactive_days
            console.log(`[PushService] Request ${requestId} targets inactive customers (${request.inactive_days} days)`)
        }

        // REDEEM FLOW PARAMS
        if (request.redeem_flow_enabled) {
            options.redeemFlowEnabled = true
            options.redeemExpiresHours = request.redeem_expires_hours
            console.log(`[PushService] Request ${requestId} includes Redeem Flow (valid: ${request.redeem_expires_hours || '∞'}h)`)
        }

        console.log(`[PushService] Processing request ${requestId} for campaign ${request.campaign?.id}`)

        try {
            // Send to passes (filtered if targeting inactive)
            const result = await this.sendToAllPasses(request.campaign.id, message, options)

            // Update final status (using only existing columns)
            await this.supabase
                .from('push_requests')
                .update({
                    status: result.sentCount > 0 ? 'sent' : 'failed',
                    sent_at: new Date().toISOString(),
                    recipients_count: result.totalCount,
                    success_count: result.sentCount,
                    failure_count: result.failCount
                })
                .eq('id', requestId)

            console.log(`[PushService] Request ${requestId} completed: sent=${result.sentCount}, failed=${result.failCount}`)

            return result

        } catch (e: any) {
            console.error(`[PushService] Request ${requestId} failed:`, e)

            // Update with error status
            await this.supabase
                .from('push_requests')
                .update({ status: 'failed' })
                .eq('id', requestId)

            return { sentCount: 0, failCount: 0, totalCount: 0, errors: [e.message] }
        }
    }

    /**
     * Process all due scheduled pushes (called by cron)
     */
    async processScheduledPushes(): Promise<{ processed: number; errors: string[] }> {
        const now = new Date().toISOString()
        const errors: string[] = []

        // Get all scheduled requests that are due
        const { data: dueRequests, error } = await this.supabase
            .from('push_requests')
            .select('id')
            .eq('status', 'scheduled')
            .lte('scheduled_at', now)
            .limit(10) // Process max 10 at a time

        if (error) {
            return { processed: 0, errors: [error.message] }
        }

        if (!dueRequests || dueRequests.length === 0) {
            return { processed: 0, errors: [] }
        }

        console.log(`[PushService] Processing ${dueRequests.length} scheduled pushes`)

        let processed = 0
        for (const request of dueRequests) {
            try {
                await this.processPushRequest(request.id)
                processed++
            } catch (e: any) {
                errors.push(`Request ${request.id}: ${e.message}`)
            }
        }

        return { processed, errors }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADAPTIVE SCALING - Queue for large campaigns
    // ════════════════════════════════════════════════════════════════════════

    /** Threshold: campaigns with more passes use background queue */
    static QUEUE_THRESHOLD = 100

    /**
     * Get pass count for a campaign
     */
    async getPassCount(campaignId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('passes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .is('deleted_at', null)

        if (error) return 0
        return count || 0
    }

    /**
     * Check if a campaign should use background queue
     */
    async shouldUseQueue(campaignId: string): Promise<boolean> {
        const count = await this.getPassCount(campaignId)
        return count > PushService.QUEUE_THRESHOLD
    }

    /**
     * Queue a push request for background processing
     */
    async queuePushRequest(requestId: string): Promise<void> {
        await this.supabase
            .from('push_requests')
            .update({ status: 'queued' })
            .eq('id', requestId)

        console.log(`[PushService] Request ${requestId} queued for background processing`)
    }

    /**
     * Process queued push requests (called by cron)
     * Processes in chunks to avoid timeout
     */
    async processQueuedPushes(): Promise<{ processed: number; passesHandled: number; errors: string[] }> {
        const errors: string[] = []
        let totalProcessed = 0
        let totalPasses = 0

        // Get queued requests
        const { data: queuedRequests, error } = await this.supabase
            .from('push_requests')
            .select('id, campaign:campaigns(id)')
            .eq('status', 'queued')
            .limit(5) // Max 5 requests per cron run

        if (error) {
            return { processed: 0, passesHandled: 0, errors: [error.message] }
        }

        if (!queuedRequests || queuedRequests.length === 0) {
            return { processed: 0, passesHandled: 0, errors: [] }
        }

        console.log(`[PushService] Processing ${queuedRequests.length} queued requests`)

        for (const request of queuedRequests) {
            try {
                const result = await this.processPushRequest(request.id)
                totalProcessed++
                totalPasses += result.totalCount
            } catch (e: any) {
                errors.push(`Request ${request.id}: ${e.message}`)
            }
        }

        console.log(`[PushService] Queued processing complete: ${totalProcessed} requests, ${totalPasses} passes`)

        return { processed: totalProcessed, passesHandled: totalPasses, errors }
    }
}

/**
 * Create a PushService instance with server-side Supabase client
 */
export async function createPushService(): Promise<PushService> {
    const supabase = await createClient()
    return new PushService(supabase)
}
