import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
        }

        // 2. Set status to approved (processing)
        await supabase
            .from('push_requests')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('id', id)

        const campaign = request.campaign
        const message = request.message

        // 3. Fetch Passes
        const { data: passes, error: passError } = await supabase
            .from('passes')
            .select('id, wallet_type, current_state')
            .eq('campaign_id', campaign.id)
            .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true') // Only active/installed passes

        if (passError) {
            console.error('Failed to fetch passes:', passError)
            return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 })
        }

        const applePasses = passes?.filter((p: any) => p.wallet_type === 'apple' || !p.wallet_type) || []
        const googlePasses = passes?.filter((p: any) => p.wallet_type === 'google') || []

        let sentCount = 0
        let failCount = 0

        // ═══════════════════════════════════════════════════════════════
        // GOOGLE WALLET
        // ═══════════════════════════════════════════════════════════════
        if (googlePasses.length > 0) {
            try {
                const { GoogleWalletService } = await import('@/lib/wallet/google')
                const googleService = new GoogleWalletService()

                for (const pass of googlePasses) {
                    try {
                        const googleObjectId = pass.id.replace(/-/g, '_')
                        // Send text message
                        await googleService.addMessage(
                            googleObjectId,
                            'Neuigkeit', // Header
                            message,     // Body
                            true         // Notify
                        )
                        sentCount++
                    } catch (e) {
                        console.error(`Google send failed for ${pass.id}:`, e)
                        failCount++
                    }
                }
            } catch (e) {
                console.error('Google service error:', e)
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // APPLE WALLET
        // ═══════════════════════════════════════════════════════════════
        if (applePasses.length > 0) {
            try {
                const { sendPassUpdatePush } = await import('@/lib/wallet/apns')

                // Update 'latest_news' field in current_state so that if the pass uses it, it updates
                // Even if not, the push triggers a refresh
                for (const pass of applePasses) {
                    try {
                        const currentState = pass.current_state || {}
                        const updatedState = {
                            ...currentState,
                            latest_news: message, // Standard field we use for this
                            last_message_at: new Date().toISOString()
                        }

                        // Update DB
                        await supabase
                            .from('passes')
                            .update({
                                current_state: updatedState,
                                last_updated_at: new Date().toISOString()
                            })
                            .eq('id', pass.id)

                        // Send APNs Push
                        await sendPassUpdatePush(pass.id)
                        sentCount++
                    } catch (e) {
                        console.error(`Apple send failed for ${pass.id}:`, e)
                        failCount++
                    }
                }
            } catch (e) {
                console.error('Apple service error:', e)
            }
        }

        // 4. Update Final Status
        await supabase
            .from('push_requests')
            .update({
                status: sentCount > 0 ? 'sent' : 'failed',
                sent_at: new Date().toISOString(),
                recipients_count: (applePasses.length + googlePasses.length),
                success_count: sentCount,
                failure_count: failCount
            })
            .eq('id', id)

        return NextResponse.json({
            success: true,
            sent: sentCount,
            failed: failCount
        })

    } catch (e) {
        console.error('Approval error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
