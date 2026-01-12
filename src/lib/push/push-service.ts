/**
 * Centralized Push Service
 * 
 * Handles all push notification operations for both Apple and Google Wallet.
 * Provides batching, error handling, and queue management.
 */

import { createClient } from '@/lib/supabase/server'
import { sendPassUpdatePush, sendBatchPush } from '@/lib/wallet/apns'
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
        const { batchSize = 20, notifyGoogle = true } = options
        const errors: string[] = []

        console.log(`[PushService] Starting push for campaign ${campaignId}`)

        // Fetch all active passes
        const { data: passes, error: passError } = await this.supabase
            .from('passes')
            .select('id, wallet_type, current_state')
            .eq('campaign_id', campaignId)
            .is('deleted_at', null)
            .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')

        if (passError) {
            console.error('[PushService] Failed to fetch passes:', passError)
            return { sentCount: 0, failCount: 0, totalCount: 0, errors: [passError.message] }
        }

        if (!passes || passes.length === 0) {
            console.log('[PushService] No passes found for campaign')
            return { sentCount: 0, failCount: 0, totalCount: 0, errors: ['No passes found'] }
        }

        // Separate by platform
        const applePasses = passes.filter((p: any) => p.wallet_type === 'apple' || !p.wallet_type)
        const googlePasses = passes.filter((p: any) => p.wallet_type === 'google')

        let sentCount = 0
        let failCount = 0

        // ═══════════════════════════════════════════════════════════════
        // APPLE WALLET
        // ═══════════════════════════════════════════════════════════════
        if (applePasses.length > 0) {
            console.log(`[PushService] Processing ${applePasses.length} Apple passes`)

            // Update all Apple passes with the message first (batch DB update)
            const passIds = applePasses.map((p: any) => p.id)
            const now = new Date().toISOString()

            // Process in batches for DB updates
            for (let i = 0; i < passIds.length; i += batchSize) {
                const batch = passIds.slice(i, i + batchSize)

                // Update each pass's current_state with the message
                for (const passId of batch) {
                    const pass = applePasses.find((p: any) => p.id === passId)
                    const currentState = pass?.current_state || {}

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
                        .eq('id', passId)
                }

                // Send APNs push notifications for this batch
                const result = await sendBatchPush(batch)
                sentCount += result.sent
                failCount += result.failed
                errors.push(...result.errors.slice(0, 5)) // Limit errors to prevent spam
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // GOOGLE WALLET
        // ═══════════════════════════════════════════════════════════════
        if (googlePasses.length > 0 && notifyGoogle) {
            console.log(`[PushService] Processing ${googlePasses.length} Google passes`)

            try {
                const googleService = this.getGoogleService()

                // Process in batches
                for (let i = 0; i < googlePasses.length; i += batchSize) {
                    const batch = googlePasses.slice(i, i + batchSize)

                    const results = await Promise.all(
                        batch.map(async (pass: any) => {
                            try {
                                const googleObjectId = pass.id.replace(/-/g, '_')
                                await googleService.addMessage(
                                    googleObjectId,
                                    'Neuigkeit',
                                    message,
                                    true // notify
                                )
                                return true
                            } catch (e: any) {
                                console.error(`[PushService] Google push failed for ${pass.id}:`, e.message)
                                return false
                            }
                        })
                    )

                    sentCount += results.filter(r => r).length
                    failCount += results.filter(r => !r).length
                }
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
        // Get request with campaign info
        const { data: request, error: reqError } = await this.supabase
            .from('push_requests')
            .select('*, campaign:campaigns(id, name)')
            .eq('id', requestId)
            .single()

        if (reqError || !request) {
            return { sentCount: 0, failCount: 0, totalCount: 0, errors: ['Request not found'] }
        }

        // Use edited message if available, otherwise original
        const message = request.edited_message || request.message

        // Mark as processing
        await this.supabase
            .from('push_requests')
            .update({
                status: 'processing',
                processing_started_at: new Date().toISOString()
            })
            .eq('id', requestId)

        try {
            // Send to all passes
            const result = await this.sendToAllPasses(request.campaign.id, message)

            // Update final status
            await this.supabase
                .from('push_requests')
                .update({
                    status: result.sentCount > 0 ? 'sent' : 'failed',
                    sent_at: new Date().toISOString(),
                    recipients_count: result.totalCount,
                    success_count: result.sentCount,
                    failure_count: result.failCount,
                    last_error: result.errors.length > 0 ? result.errors.join('; ').substring(0, 500) : null,
                    processing_started_at: null
                })
                .eq('id', requestId)

            return result

        } catch (e: any) {
            // Update with error
            await this.supabase
                .from('push_requests')
                .update({
                    status: 'failed',
                    last_error: e.message,
                    retry_count: (request.retry_count || 0) + 1,
                    processing_started_at: null
                })
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
            .is('processing_started_at', null) // Not already being processed
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

        // Cleanup: Reset stale processing requests (stuck for > 10 minutes)
        const staleTime = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        await this.supabase
            .from('push_requests')
            .update({
                status: 'scheduled', // Reset to scheduled
                processing_started_at: null,
                last_error: 'Processing timeout - reset for retry'
            })
            .eq('status', 'processing')
            .lt('processing_started_at', staleTime)

        return { processed, errors }
    }
}

/**
 * Create a PushService instance with server-side Supabase client
 */
export async function createPushService(): Promise<PushService> {
    const supabase = await createClient()
    return new PushService(supabase)
}
