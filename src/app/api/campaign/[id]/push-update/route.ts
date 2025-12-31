import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/campaign/[id]/push-update
 * Push design update notifications to all pass holders
 * - Apple: Triggers APNs push to all registered devices
 * - Google: Updates Class (design) + all Objects (content)
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

        // Get campaign with all passes AND client info
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

        // ═══════════════════════════════════════════════════════════════
        // APPLE: Update timestamps + Sync max_stamps + Send APNs push
        // ═══════════════════════════════════════════════════════════════
        if (applePasses.length > 0) {
            try {
                // Get new maxStamps from campaign config
                const configData = campaign.config || {}
                const newMaxStamps = configData.maxStamps || 10

                // Bulk update timestamps AND sync max_stamps in current_state
                for (const pass of applePasses) {
                    const currentState = (pass as any).current_state || {}
                    const updatedState = {
                        ...currentState,
                        max_stamps: newMaxStamps  // Sync from campaign config
                    }

                    const { error: updateError } = await supabase
                        .from('passes')
                        .update({
                            last_updated_at: new Date().toISOString(),
                            current_state: updatedState
                        })
                        .eq('id', pass.id)

                    if (updateError) {
                        console.error(`[PUSH-UPDATE] Failed to update pass ${pass.id}:`, updateError)
                        errors.push(`DB update failed for ${pass.id}: ${updateError.message}`)
                    }
                }

                console.log(`[PUSH-UPDATE] Updated timestamps and max_stamps (${newMaxStamps}) for ${applePasses.length} Apple passes`)

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

        // ═══════════════════════════════════════════════════════════════
        // GOOGLE: Maximum Update Coverage
        // ═══════════════════════════════════════════════════════════════
        if (googlePasses.length > 0) {
            try {
                const { GoogleWalletService } = await import('@/lib/wallet/google')
                const googleService = new GoogleWalletService()

                const designAssets = campaign.design_assets || {}
                const configData = campaign.config || {}
                const stampEmoji = configData.stampEmoji || '☕'
                const maxStamps = configData.maxStamps || 10

                // ─────────────────────────────────────────────────────────
                // 1. UPDATE CLASS (Design elements - may take time to sync)
                // ─────────────────────────────────────────────────────────
                const classId = `campaign_${campaign.id.replace(/-/g, '_')}`
                try {
                    // Get client name (handle both array and object from Supabase)
                    const clientData = Array.isArray(campaign.client) ? campaign.client[0] : campaign.client
                    const clientName = clientData?.name || campaign.name || 'Passify'

                    await googleService.createOrUpdateClass({
                        classId,
                        // Program name from logoText or client name
                        programName: designAssets.content?.logoText || clientName || 'Loyalty Card',
                        issuerName: clientName,
                        logoUrl: designAssets.images?.logo?.url,
                        heroImageUrl: designAssets.images?.strip?.url,
                        backgroundColor: designAssets.colors?.backgroundColor
                    })
                    console.log(`[PUSH-UPDATE] Google Class ${classId} updated`)
                } catch (e: any) {
                    console.error('[PUSH-UPDATE] Google Class update failed:', e)
                    errors.push(`Google Class: ${e.message}`)
                }

                // ─────────────────────────────────────────────────────────
                // 2. BUILD TEXT MODULES from Editor Fields (excluding stamps/progress)
                // ─────────────────────────────────────────────────────────
                const editorTextModules: any[] = []
                const skipKeys = ['progress', 'progress_visual', 'visual', 'stamps', 'balance']

                // Helper to add fields if they're not stamp-related
                const addFieldsIfNotStamps = (fields: any[], prefix: string) => {
                    if (!fields) return
                    fields.forEach((f: any, i: number) => {
                        // Skip stamp/progress fields
                        if (skipKeys.includes(f.key)) return
                        if (f.value) editorTextModules.push({
                            id: `${prefix}_${i}`,
                            header: f.label || '',
                            body: String(f.value)
                        })
                    })
                }

                addFieldsIfNotStamps(designAssets.fields?.headerFields, 'header')
                addFieldsIfNotStamps(designAssets.fields?.secondaryFields, 'secondary')
                addFieldsIfNotStamps(designAssets.fields?.auxiliaryFields, 'aux')
                addFieldsIfNotStamps(designAssets.fields?.backFields, 'back')

                // ─────────────────────────────────────────────────────────
                // 3. UPDATE EACH OBJECT (Individual passes)
                // ─────────────────────────────────────────────────────────
                for (const pass of googlePasses) {
                    try {
                        const googleObjectId = pass.id.replace(/-/g, '_')
                        const currentState = (pass as any).current_state || {}
                        const currentStamps = currentState.stamps || 0
                        // Use NEW maxStamps from campaign config, not old value from state
                        const newMaxStamps = maxStamps
                        const customerName = currentState.customer_name || 'Stammkunde'
                        const customerNumber = currentState.customer_number || ''

                        // Generate visual stamp string for text module
                        const stampVisual = stampEmoji.repeat(currentStamps) + ' ' + '⚪'.repeat(Math.max(0, newMaxStamps - currentStamps))

                        // Build comprehensive object update
                        const objectPatch: any = {
                            // Account info (shows on card front!)
                            accountName: customerName,
                            accountId: customerNumber,

                            // Loyalty points (shows on card front!)
                            loyaltyPoints: {
                                label: 'Stempel',
                                balance: { string: `${currentStamps}/${newMaxStamps}` }
                            },

                            // Text modules - stamps first, then editor fields
                            textModulesData: [
                                // Overwrite text_0 (old progress) with updated stamps
                                {
                                    id: 'text_0',
                                    header: 'Deine Stempel',
                                    body: stampVisual
                                },
                                // Add all other editor fields
                                ...editorTextModules
                            ],

                            // Optional: Add a message about the update
                            messages: [{
                                header: 'Karte aktualisiert',
                                body: 'Deine Karte wurde aktualisiert.',
                                id: `update_${Date.now()}`
                            }]
                        }

                        // Update the object
                        await googleService.updateObject(googleObjectId, objectPatch)

                        console.log(`[PUSH-UPDATE] Google pass ${googleObjectId} fully updated`)
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
