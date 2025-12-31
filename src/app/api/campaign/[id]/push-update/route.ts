import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/campaign/[id]/push-update
 * Push design update notifications to all pass holders
 * - Apple: Triggers APNs push to all registered devices
 * - Google: Updates all loyalty objects via API
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params

        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaign ID' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get campaign with all passes
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('id, design_assets, config, name, client:clients(name), passes(id, wallet_type, current_state)')
            .eq('id', campaignId)
            .single()

        if (fetchError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const passes = campaign.passes || []
        let sent = 0
        let errors: string[] = []

        // Separate by wallet type
        const applePasses = passes.filter((p: any) => p.wallet_type === 'apple' || !p.wallet_type)
        const googlePasses = passes.filter((p: any) => p.wallet_type === 'google')

        console.log(`[PUSH-UPDATE] Campaign ${campaignId}: ${applePasses.length} Apple, ${googlePasses.length} Google`)

        // APPLE: Send APNs push to trigger pass refresh
        if (applePasses.length > 0) {
            try {
                // Bulk update timestamps so device sees new Last-Modified
                const passIds = applePasses.map((p: any) => p.id)
                const { error: updateError } = await supabase
                    .from('passes')
                    .update({ last_updated_at: new Date().toISOString() })
                    .in('id', passIds)

                if (updateError) {
                    console.error('[PUSH-UPDATE] Failed to update timestamps:', updateError)
                    errors.push(`DB Timestamp update failed: ${updateError.message}`)
                }

                const { sendPassUpdatePush } = await import('@/lib/wallet/apns')

                for (const pass of applePasses) {
                    try {
                        const result = await sendPassUpdatePush(pass.id)
                        sent += result.sent
                        if (result.errors.length > 0) {
                            errors.push(...result.errors)
                        }
                    } catch (e: any) {
                        console.error(`[PUSH-UPDATE] Apple push failed for ${pass.id}:`, e.message)
                        errors.push(`Apple ${pass.id}: ${e.message}`)
                    }
                }

                console.log(`[PUSH-UPDATE] Apple: Sent ${sent} notifications`)
            } catch (e: any) {
                console.error('[PUSH-UPDATE] Apple push module error:', e.message)
                errors.push(`Apple module: ${e.message}`)
            }
        }

        // GOOGLE: 1. Update Class (Design)
        //         2. Update Objects (Stamps/Emoji)
        if (googlePasses.length > 0) {
            try {
                const { GoogleWalletService } = await import('@/lib/wallet/google')
                const googleService = new GoogleWalletService()

                // 1. Update Class (Design)
                const classId = `campaign_${campaign.id.replace(/-/g, '_')}`
                try {
                    // Update class with new design
                    await googleService.createOrUpdateClass({
                        classId,
                        programName: campaign.client?.name || campaign.name || 'Loyalty Card',
                        issuerName: campaign.client?.name || 'Passify',
                        logoUrl: campaign.design_assets?.images?.logo?.url,
                        heroImageUrl: campaign.design_assets?.images?.strip?.url,
                        backgroundColor: campaign.design_assets?.colors?.backgroundColor
                    })
                    console.log(`[PUSH-UPDATE] Google Class ${classId} updated`)
                } catch (e: any) {
                    console.error('[PUSH-UPDATE] Google Class update failed:', e)
                    errors.push(`Google Class: ${e.message}`)
                }

                // 2. Update Objects (Stamps)
                const stampEmoji = campaign.config?.stampEmoji || '☕'

                for (const pass of googlePasses) {
                    try {
                        const googleObjectId = pass.id.replace(/-/g, '_')
                        // We fetch current_state in query now
                        const currentState = (pass as any).current_state || { stamps: 0, max_stamps: 10 }

                        // Re-render stamps with new emoji
                        await googleService.updateStamps(googleObjectId, {
                            current: currentState.stamps || 0,
                            max: currentState.max_stamps || 10
                        }, stampEmoji)

                        console.log(`[PUSH-UPDATE] Google pass ${googleObjectId} updated`)
                        sent += 1
                    } catch (e: any) {
                        console.error(`[PUSH-UPDATE] Google update failed for ${pass.id}:`, e.message)
                        errors.push(`Google ${pass.id}: ${e.message}`)
                    }
                }

                console.log(`[PUSH-UPDATE] Google: Updated ${googlePasses.length} passes`)
            } catch (e: any) {
                console.error('[PUSH-UPDATE] Google module error:', e.message)
                errors.push(`Google module: ${e.message}`)
            }
        }

        return NextResponse.json({
            success: true,
            sent,
            total: passes.length,
            apple: applePasses.length,
            google: googlePasses.length,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (e) {
        console.error('Push update error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
