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

        if (!passId) {
            return NextResponse.json({ error: "Missing passId" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Fetch the pass
        const { data: pass, error: fetchError } = await supabase
            .from('passes')
            .select('*, campaign:campaigns(concept, config)')
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

            if (action === 'REDEEM') {
                // Redeem reward (reset stamps to 0)
                if (currentState.stamps >= maxStamps) {
                    newState.stamps = 0
                    newState.redemptions = (currentState.redemptions || 0) + 1
                    actionType = 'REDEEM_REWARD'
                    deltaValue = -maxStamps
                } else {
                    return NextResponse.json({
                        error: "Not enough stamps",
                        current: currentState.stamps,
                        required: maxStamps
                    }, { status: 400 })
                }
            } else {
                // Add stamp
                newState.stamps = Math.min((currentState.stamps || 0) + 1, maxStamps)
                actionType = 'ADD_STAMP'
                deltaValue = 1
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
        } else {
            // Generic check-in
            newState.last_check_in = new Date().toISOString()
            newState.check_ins = (currentState.check_ins || 0) + 1
            actionType = 'CHECK_IN'
            deltaValue = 1
        }

        // 3. Update pass state
        const { error: updateError } = await supabase
            .from('passes')
            .update({
                current_state: newState,
                last_updated_at: new Date().toISOString()
            })
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

        // 5. Send APNs push to update the customer's wallet pass
        try {
            const { sendPassUpdatePush } = await import('@/lib/wallet/apns')
            const pushResult = await sendPassUpdatePush(passId)
            console.log(`[PUSH RESULT] Sent: ${pushResult.sent}, Errors: ${pushResult.errors.join(', ') || 'none'}`)
        } catch (pushError) {
            console.error('[PUSH ERROR]', pushError)
            // Don't fail the scan if push fails
        }

        console.log(`[SCAN] Pass ${passId}: ${actionType} (${deltaValue})`)

        return NextResponse.json({
            success: true,
            action: actionType,
            delta: deltaValue,
            newState: newState,
            message: getSuccessMessage(actionType, newState, concept)
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
