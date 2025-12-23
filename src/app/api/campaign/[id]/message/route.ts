import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendPassUpdatePush } from "@/lib/wallet/apns"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const { message } = await req.json()

    if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all passes for this campaign
    const { data: passes, error: passesError } = await supabase
        .from('passes')
        .select('id, current_state')
        .eq('campaign_id', campaignId)

    if (passesError) {
        console.error('Error fetching passes:', passesError)
        return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 })
    }

    if (!passes || passes.length === 0) {
        return NextResponse.json({
            success: true,
            sent: 0,
            total: 0,
            message: 'No passes found for this campaign'
        })
    }

    console.log(`[MESSAGE] Sending to ${passes.length} passes for campaign ${campaignId}`)

    // Update all passes with the new notification message
    const updatePromises = passes.map(async (pass) => {
        const newState = {
            ...pass.current_state,
            notification_message: message,
            notification_updated_at: new Date().toISOString()
        }

        await supabase
            .from('passes')
            .update({
                current_state: newState,
                last_updated_at: new Date().toISOString()
            })
            .eq('id', pass.id)

        return pass.id
    })

    await Promise.all(updatePromises)

    // Send push notifications to all registered devices
    let totalSent = 0
    const allErrors: string[] = []

    for (const pass of passes) {
        try {
            const result = await sendPassUpdatePush(pass.id)
            totalSent += result.sent
            if (result.errors.length > 0) {
                allErrors.push(...result.errors)
            }
        } catch (error) {
            console.error(`Push failed for pass ${pass.id}:`, error)
        }
    }

    console.log(`[MESSAGE ✅] Sent ${totalSent} push notifications to ${passes.length} passes`)

    return NextResponse.json({
        success: true,
        sent: totalSent,
        total: passes.length,
        errors: allErrors.length > 0 ? allErrors : undefined
    })
}
