import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendPassUpdatePush } from "@/lib/wallet/apns"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const { message, header } = await req.json()

    if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all VERIFIED passes for this campaign (only those with real users)
    // For Apple: has device registrations
    // For Google: is_installed_on_android = true OR verification_status = 'verified'
    const { data: passes, error: passesError } = await supabase
        .from('passes')
        .select('id, current_state, wallet_type, is_installed_on_android, is_installed_on_ios, verification_status')
        .eq('campaign_id', campaignId)

    if (passesError) {
        console.error('Error fetching passes:', passesError)
        return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 })
    }

    // Filter to only verified/registered passes - EXACTLY MATCHING customer list logic
    // verification_status = 'verified' OR is_installed_on_ios = true OR is_installed_on_android = true
    const verifiedPasses = (passes || []).filter(p => {
        const isVerified = p.verification_status === 'verified'
        const isInstalledIos = p.is_installed_on_ios === true
        const isInstalledAndroid = p.is_installed_on_android === true

        return isVerified || isInstalledIos || isInstalledAndroid
    })

    if (verifiedPasses.length === 0) {
        return NextResponse.json({
            success: true,
            sent: 0,
            total: 0,
            message: 'No verified passes found for this campaign'
        })
    }

    // Separate by wallet type
    const applePasses = verifiedPasses.filter(p => p.wallet_type === 'apple' || !p.wallet_type)
    const googlePasses = verifiedPasses.filter(p => p.wallet_type === 'google')

    console.log(`[MESSAGE] Sending to ${verifiedPasses.length} verified passes (${applePasses.length} Apple, ${googlePasses.length} Google)`)

    // Update all verified passes with the new notification message
    const updatePromises = verifiedPasses.map(async (pass) => {
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

    let totalSent = 0
    const allErrors: string[] = []

    // ═══════════════════════════════════════════════════════════════
    // APPLE: Send APNs push notifications
    // ═══════════════════════════════════════════════════════════════
    for (const pass of applePasses) {
        try {
            const result = await sendPassUpdatePush(pass.id)
            totalSent += result.sent
            if (result.errors.length > 0) {
                allErrors.push(...result.errors)
            }
        } catch (error: any) {
            console.error(`[MESSAGE] Apple push failed for pass ${pass.id}:`, error)
            allErrors.push(`Apple ${pass.id}: ${error.message}`)
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GOOGLE: Send custom message via addMessage API
    // ═══════════════════════════════════════════════════════════════
    if (googlePasses.length > 0) {
        try {
            const { GoogleWalletService } = await import('@/lib/wallet/google')
            const googleService = new GoogleWalletService()

            for (const pass of googlePasses) {
                try {
                    const googleObjectId = pass.id.replace(/-/g, '_')

                    await googleService.addMessage(
                        googleObjectId,
                        header || '📢 Nachricht',  // Custom header or default
                        message,
                        true  // notify=true triggers push notification
                    )

                    totalSent += 1
                    console.log(`[MESSAGE ✅] Google message sent to ${googleObjectId}`)
                } catch (error: any) {
                    console.error(`[MESSAGE] Google addMessage failed for ${pass.id}:`, error.message)
                    allErrors.push(`Google ${pass.id}: ${error.message}`)
                }
            }
        } catch (error: any) {
            console.error('[MESSAGE] Google module error:', error.message)
            allErrors.push(`Google module: ${error.message}`)
        }
    }

    console.log(`[MESSAGE ✅] Sent ${totalSent} push notifications to ${verifiedPasses.length} verified passes`)

    return NextResponse.json({
        success: true,
        sent: totalSent,
        total: verifiedPasses.length,
        apple: applePasses.length,
        google: googlePasses.length,
        errors: allErrors.length > 0 ? allErrors : undefined
    })
}
