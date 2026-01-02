import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/scan
 * 
 * Called by the POS/Scanner app when staff scans a customer's pass
 * 
 * Body: { passId: string, action: "ADD_STAMP" | "REDEEM" | "CHECK_IN" }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { passId, action } = body

        console.log(`[SCAN REQ] Pass: ${passId}, Action: ${action}`)


        if (!passId) {
            return NextResponse.json({ error: "Missing passId" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Fetch the pass with full campaign data including design_assets
        const { data: pass, error: fetchError } = await supabase
            .from('passes')
            .select('*, campaign:campaigns(concept, config, design_assets)')
            .eq('id', passId)
            .single()

        if (fetchError || !pass) {
            return NextResponse.json({ error: "Pass not found" }, { status: 404 })
        }

        const currentState = pass.current_state || {}
        let newState = { ...currentState }
        let deltaValue = 0
        let actionType = action || 'ADD_STAMP'

        // 2. Process action based on campaign type
        const concept = pass.campaign?.concept

        if (concept === 'STAMP_CARD' || concept === 'STAMP_CARD_V2') {
            const maxStamps = currentState.max_stamps || 10
            const currentStamps = currentState.stamps || 0

            // SMART REDEMPTION LOGIC:
            // If customer is at max stamps (10/10), auto-redeem and add 1 new stamp
            if (currentStamps >= maxStamps) {
                // Customer has full card - REDEEM + ADD 1
                newState.stamps = 1  // Reset to 1 (includes new stamp for this visit)
                newState.redemptions = (currentState.redemptions || 0) + 1
                newState.last_redemption = new Date().toISOString()
                actionType = 'AUTO_REDEEM'
                deltaValue = -(maxStamps - 1) // Net change: was 10, now 1

                console.log(`[SCAN] Auto-redeemed! New redemptions: ${newState.redemptions}`)
            } else if (action === 'REDEEM') {
                // Manual redeem (forced by POS)
                if (currentStamps >= maxStamps) {
                    newState.stamps = 0
                    newState.redemptions = (currentState.redemptions || 0) + 1
                    newState.last_redemption = new Date().toISOString()
                    actionType = 'REDEEM_REWARD'
                    deltaValue = -maxStamps
                } else {
                    return NextResponse.json({
                        error: "Not enough stamps",
                        current: currentStamps,
                        required: maxStamps
                    }, { status: 400 })
                }
            } else {
                // Normal: Add stamp
                const newStampCount = Math.min(currentStamps + 1, maxStamps)
                newState.stamps = newStampCount
                actionType = 'ADD_STAMP'
                deltaValue = 1

                // Check if this stamp completes the card
                if (newStampCount >= maxStamps) {
                    actionType = 'STAMP_COMPLETE' // Special action for celebration
                }
            }
        } else if (concept === 'POINTS_CARD') {
            const pointsToAdd = body.points || 1
            newState.points = (currentState.points || 0) + pointsToAdd
            actionType = 'ADD_POINTS'
            deltaValue = pointsToAdd

            // Update tier based on points
            if (newState.points >= 1000) {
                newState.tier = 'gold'
            } else if (newState.points >= 500) {
                newState.tier = 'silver'
            } else {
                newState.tier = 'bronze'
            }
        } else if (concept === 'COUPON') {
            // Gutschein / Voucher handling
            const campaignConfig = pass.campaign?.config || {}

            if (campaignConfig.singleUse) {
                // Single-use voucher - check if already redeemed
                if (currentState.redeemed) {
                    return NextResponse.json({
                        error: "Gutschein bereits eingelöst",
                        redeemed_at: currentState.redeemed_at
                    }, { status: 400 })
                }

                // Mark as redeemed
                newState.redeemed = true
                newState.redeemed_at = new Date().toISOString()
                actionType = 'REDEEM_VOUCHER'
                deltaValue = 1

                console.log(`[SCAN] Voucher ${passId} redeemed (single-use)`)
            } else {
                // Multi-use voucher - just track uses
                newState.uses = (currentState.uses || 0) + 1
                newState.last_used_at = new Date().toISOString()
                actionType = 'USE_VOUCHER'
                deltaValue = 1
            }
        } else {
            // Generic check-in
            newState.last_check_in = new Date().toISOString()
            newState.check_ins = (currentState.check_ins || 0) + 1
            actionType = 'CHECK_IN'
            deltaValue = 1
        }

        // 3. Update pass state
        // Also mark passes as "verified" on first scan (real customer interaction)
        const updateData: any = {
            current_state: newState,
            last_updated_at: new Date().toISOString()
        }

        // For Google passes: mark as installed on first interaction
        if (pass.wallet_type === 'google' && !pass.is_installed_on_android) {
            updateData.is_installed_on_android = true
            console.log(`[SCAN] Marking Google pass ${passId} as installed`)
        }

        // Mark as verified on first scan (pending → verified)
        if (pass.verification_status !== 'verified') {
            updateData.verification_status = 'verified'
            console.log(`[SCAN] Verifying customer ${passId}`)
        }

        const { error: updateError } = await supabase
            .from('passes')
            .update(updateData)
            .eq('id', passId)

        if (updateError) {
            console.error("Failed to update pass:", updateError)
            return NextResponse.json({ error: "Update failed" }, { status: 500 })
        }

        // 4. Log the scan
        const { error: scanError } = await supabase
            .from('scans')
            .insert({
                pass_id: passId,
                campaign_id: pass.campaign_id,
                action_type: actionType,
                delta_value: deltaValue,
                device_agent: req.headers.get('user-agent') || 'unknown'
            })

        if (scanError) {
            console.error("Failed to log scan:", scanError)
            // Don't fail the request, just log
        }

        // 5. Update the customer's wallet pass (platform-specific)
        let pushStatus = { sent: 0, errors: [] as string[] }
        const walletType = pass.wallet_type || 'apple'

        try {
            if (walletType === 'google') {
                // Google Wallet: Direct API mutation
                const { GoogleWalletService } = await import('@/lib/wallet/google')
                const googleService = new GoogleWalletService()

                // Google Wallet object IDs use underscores, not dashes
                const googleObjectId = passId.replace(/-/g, '_')

                // Get stamp emoji from campaign config (default to coffee)
                const campaignConfig = pass.campaign?.config || {}
                const stampEmoji = campaignConfig.stampEmoji || '☕'

                if (newState.stamps !== undefined) {
                    // Build preserved fields from campaign design
                    const designAssets = pass.campaign?.design_assets || {}
                    const preserveFields: Array<{ id: string; header: string; body: string }> = []

                    // Add secondary fields (e.g., "Powered By")
                    designAssets.fields?.secondaryFields?.forEach((field: any, i: number) => {
                        if (field.label && field.value) {
                            preserveFields.push({
                                id: `text_${i}`,
                                header: String(field.label),
                                body: String(field.value)
                            })
                        }
                    })

                    // Add auxiliary fields
                    designAssets.fields?.auxiliaryFields?.forEach((field: any, i: number) => {
                        if (field.label && field.value) {
                            preserveFields.push({
                                id: `aux_${i}`,
                                header: String(field.label),
                                body: String(field.value)
                            })
                        }
                    })

                    // Add reward info
                    if (campaignConfig.reward) {
                        preserveFields.push({
                            id: 'reward',
                            header: 'Prämie',
                            body: campaignConfig.reward
                        })
                    }

                    await googleService.updateStamps(googleObjectId, {
                        current: newState.stamps,
                        max: newState.max_stamps || 10
                    }, stampEmoji, preserveFields)
                    pushStatus.sent = 1
                    console.log(`[GOOGLE ✅] Updated stamps for pass ${googleObjectId}`)
                } else if (newState.points !== undefined) {
                    await googleService.updatePoints(googleObjectId, newState.points)
                    pushStatus.sent = 1
                    console.log(`[GOOGLE ✅] Updated points for pass ${googleObjectId}`)
                } else if (newState.redeemed === true) {
                    // Single-use voucher was redeemed - void it
                    await googleService.voidVoucher(googleObjectId, newState.redeemed_at)
                    pushStatus.sent = 1
                    console.log(`[GOOGLE ✅] Voided voucher ${googleObjectId}`)
                }
            } else {
                // Apple Wallet: Send APNs push notification
                const { sendPassUpdatePush } = await import('@/lib/wallet/apns')
                const pushResult = await sendPassUpdatePush(passId)
                pushStatus = { sent: pushResult.sent, errors: pushResult.errors }

                if (pushResult.sent > 0) {
                    console.log(`[APNS ✅] Sent ${pushResult.sent} notification(s) for pass ${passId}`)
                } else if (pushResult.errors.length > 0) {
                    console.log(`[APNS ❌] Failed for pass ${passId}: ${pushResult.errors.join(', ')}`)
                } else {
                    console.log(`[APNS ⚠️] No devices registered for pass ${passId}`)
                }
            }
        } catch (pushError: any) {
            console.error('[WALLET UPDATE ERROR]', pushError?.message || pushError)
            pushStatus.errors.push(pushError?.message || 'Unknown error')
            // Don't fail the scan if push fails
        }

        console.log(`[SCAN] Pass ${passId}: ${actionType} (${deltaValue})`)

        // Determine special flags for POS UI
        const maxStamps = newState.max_stamps || 10
        const celebration = actionType === 'STAMP_COMPLETE' || actionType === 'AUTO_REDEEM'
        const redeemed = actionType === 'AUTO_REDEEM' || actionType === 'REDEEM_REWARD'
        const rewardReady = newState.stamps >= maxStamps

        return NextResponse.json({
            success: true,
            action: actionType,
            delta: deltaValue,
            newState: newState,
            message: getSuccessMessage(actionType, newState, concept),
            // Special flags for POS UI
            celebration,      // Show confetti/celebration animation
            redeemed,         // Reward was just redeemed
            rewardReady,      // Customer can redeem now
            // Push notification status (for debugging)
            push: {
                sent: pushStatus.sent,
                errors: pushStatus.errors
            }
        })

    } catch (e) {
        console.error("Scan error:", e)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

function getSuccessMessage(action: string, state: any, concept: string): string {
    if (action === 'ADD_STAMP') {
        return `✅ Stempel hinzugefügt! (${state.stamps}/${state.max_stamps || 10})`
    }
    if (action === 'STAMP_COMPLETE') {
        return `🎉 KARTE VOLL! (${state.stamps}/${state.max_stamps || 10}) - Prämie bereit!`
    }
    if (action === 'AUTO_REDEEM') {
        return `🎊 PRÄMIE EINGELÖST! Neuer Start: 1/${state.max_stamps || 10}`
    }
    if (action === 'REDEEM_REWARD') {
        return `🎉 Prämie eingelöst! Stempel zurückgesetzt.`
    }
    if (action === 'ADD_POINTS') {
        return `✅ ${state.points} Punkte (Level: ${state.tier})`
    }
    return `✅ Check-In erfolgreich!`
}

/**
 * GET /api/scan?passId=XXX
 * 
 * Get current pass state (for debugging/display)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const passId = searchParams.get('passId')

    if (!passId) {
        return NextResponse.json({ error: "Missing passId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: pass, error } = await supabase
        .from('passes')
        .select('*, campaign:campaigns(name, concept, client:clients(name))')
        .eq('id', passId)
        .single()

    if (error || !pass) {
        return NextResponse.json({ error: "Pass not found" }, { status: 404 })
    }

    return NextResponse.json({
        id: pass.id,
        serialNumber: pass.serial_number,
        campaign: pass.campaign?.name,
        client: pass.campaign?.client?.name,
        concept: pass.campaign?.concept,
        state: pass.current_state,
        createdAt: pass.created_at,
        lastUpdated: pass.last_updated_at
    })
}
