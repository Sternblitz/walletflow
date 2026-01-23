import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendPassUpdatePush } from "@/lib/wallet/apns"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params
    const {
        message,
        header,
        scheduleTime,
        targetType,
        inactiveDays,
        // Redeem Flow params
        redeemFlowEnabled,
        redeemExpiresHours
    } = await req.json()

    if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // If scheduling, create push_request and return
    if (scheduleTime) {
        const { error: insertError } = await supabase
            .from('push_requests')
            .insert({
                campaign_id: campaignId,
                message: message.trim(),
                status: 'scheduled', // Admin = directly scheduled, no approval needed
                scheduled_at: scheduleTime,
                target_type: targetType || 'all',
                inactive_days: targetType === 'inactive' ? inactiveDays : null,
                // Redeem flow columns
                redeem_flow_enabled: redeemFlowEnabled || false,
                redeem_expires_hours: redeemFlowEnabled ? redeemExpiresHours : null
            })

        if (insertError) {
            console.error('Failed to schedule push:', insertError)
            return NextResponse.json({ error: 'Failed to schedule push' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            scheduled: true,
            scheduled_at: scheduleTime,
            redeemFlowEnabled: redeemFlowEnabled || false
        })
    }

    // Immediate send - get all verified passes WITH MARKETING CONSENT
    const { data: passes, error: passesError } = await supabase
        .from('passes')
        .select('id, current_state, wallet_type, is_installed_on_android, is_installed_on_ios, verification_status, last_scanned_at, consent_marketing')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .eq('consent_marketing', true)  // Only send to opted-in customers!

    if (passesError) {
        console.error('Error fetching passes:', passesError)
        return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 })
    }

    // Filter to only verified/registered passes
    let verifiedPasses = (passes || []).filter(p => {
        const isVerified = p.verification_status === 'verified'
        const isInstalledIos = p.is_installed_on_ios === true
        const isInstalledAndroid = p.is_installed_on_android === true
        return isVerified || isInstalledIos || isInstalledAndroid
    })

    // Apply inactivity filter if specified
    if (targetType === 'inactive' && inactiveDays && inactiveDays > 0) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)
        const cutoffTime = cutoffDate.getTime()

        const beforeCount = verifiedPasses.length
        verifiedPasses = verifiedPasses.filter(p => {
            if (!p.last_scanned_at) return true // Never scanned = inactive
            return new Date(p.last_scanned_at).getTime() < cutoffTime
        })
        console.log(`[MESSAGE] Filtered ${beforeCount} → ${verifiedPasses.length} inactive customers (${inactiveDays} days)`)
    }

    if (verifiedPasses.length === 0) {
        return NextResponse.json({
            success: true,
            sent: 0,
            total: 0,
            message: targetType === 'inactive'
                ? 'Keine inaktiven Kunden gefunden'
                : 'Keine verifizierten Kunden gefunden'
        })
    }

    // Separate by wallet type
    const applePasses = verifiedPasses.filter(p => p.wallet_type === 'apple' || !p.wallet_type)
    const googlePasses = verifiedPasses.filter(p => p.wallet_type === 'google')

    console.log(`[MESSAGE] Sending to ${verifiedPasses.length} passes (${applePasses.length} Apple, ${googlePasses.length} Google)${targetType === 'inactive' ? ` [inactive ${inactiveDays}d]` : ''}${redeemFlowEnabled ? ' [REDEEM FLOW]' : ''}`)

    // Update all passes with the new notification
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

    // APPLE: Send APNs push notifications
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

    // GOOGLE: Send custom message via addMessage API
    if (googlePasses.length > 0) {
        try {
            const { GoogleWalletService } = await import('@/lib/wallet/google')
            const googleService = new GoogleWalletService()

            for (const pass of googlePasses) {
                try {
                    const googleObjectId = pass.id.replace(/-/g, '_')

                    await googleService.addMessage(
                        googleObjectId,
                        header || '📢 Nachricht',
                        message,
                        true
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

    // ════════════════════════════════════════════════════════════════════════
    // REDEEM FLOW: Create pass_gifts entries for all recipients
    // ════════════════════════════════════════════════════════════════════════
    let giftsCreated = 0
    if (redeemFlowEnabled) {
        console.log(`[REDEEM FLOW] Creating gift entries for ${verifiedPasses.length} recipients`)

        // Calculate expiration time
        const expiresAt = redeemExpiresHours
            ? new Date(Date.now() + redeemExpiresHours * 60 * 60 * 1000).toISOString()
            : null // Unlimited

        // Batch insert all gifts
        const giftInserts = verifiedPasses.map(pass => ({
            pass_id: pass.id,
            campaign_id: campaignId,
            gift_type: 'push',
            gift_title: '🎁 Push-Angebot',
            gift_message: message.trim(),
            expires_at: expiresAt
        }))

        const { error: giftError, data: giftData } = await supabase
            .from('pass_gifts')
            .insert(giftInserts)
            .select('id')

        if (giftError) {
            console.error('[REDEEM FLOW] Failed to create gifts:', giftError)
            allErrors.push(`Redeem flow: ${giftError.message}`)
        } else {
            giftsCreated = giftData?.length || 0
            console.log(`[REDEEM FLOW ✅] Created ${giftsCreated} gift entries (expires: ${expiresAt || 'never'})`)
        }
    }

    // Log push for history
    await supabase.from('push_requests').insert({
        campaign_id: campaignId,
        message: message.trim(),
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: verifiedPasses.length,
        success_count: totalSent,
        failure_count: allErrors.length,
        target_type: targetType || 'all',
        inactive_days: targetType === 'inactive' ? inactiveDays : null,
        // Redeem flow columns
        redeem_flow_enabled: redeemFlowEnabled || false,
        redeem_expires_hours: redeemFlowEnabled ? redeemExpiresHours : null
    })

    console.log(`[MESSAGE ✅] Sent ${totalSent} push notifications to ${verifiedPasses.length} passes`)

    return NextResponse.json({
        success: true,
        sent: totalSent,
        total: verifiedPasses.length,
        apple: applePasses.length,
        google: googlePasses.length,
        targetType: targetType || 'all',
        redeemFlowEnabled: redeemFlowEnabled || false,
        giftsCreated,
        errors: allErrors.length > 0 ? allErrors : undefined
    })
}

