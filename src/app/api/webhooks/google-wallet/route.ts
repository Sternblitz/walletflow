import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/webhooks/google-wallet
 * 
 * Google may verify the callback URL is accessible before sending events.
 */
export async function GET(req: NextRequest) {
    console.log('[GOOGLE WEBHOOK] GET request received - URL verification')
    return NextResponse.json({
        status: 'ok',
        message: 'Google Wallet webhook endpoint is active',
        timestamp: new Date().toISOString()
    })
}

/**
 * POST /api/webhooks/google-wallet
 * 
 * Receives notifications from Google Wallet API when a user saves a pass.
 * This allows us to verify Google Wallet installations without waiting for a scan.
 */
export async function POST(req: NextRequest) {
    console.log('[GOOGLE WEBHOOK] ========================================')
    console.log('[GOOGLE WEBHOOK] POST request received!')
    console.log('[GOOGLE WEBHOOK] Headers:', JSON.stringify(Object.fromEntries(req.headers)))

    try {
        const bodyText = await req.text()
        console.log('[GOOGLE WEBHOOK] Raw body:', bodyText)

        let body: any
        try {
            body = JSON.parse(bodyText)
        } catch {
            console.log('[GOOGLE WEBHOOK] Body is not JSON, might be form data')
            return NextResponse.json({ success: true, note: 'Non-JSON body received' })
        }

        console.log('[GOOGLE WEBHOOK] Parsed body:', JSON.stringify(body))

        // Google sends the actual data inside 'signedMessage' as a JSON string!
        // We need to parse it to get eventType and objectId
        let event: string | undefined
        let objectId: string | undefined

        if (body.signedMessage) {
            try {
                const signedData = JSON.parse(body.signedMessage)
                console.log('[GOOGLE WEBHOOK] Parsed signedMessage:', JSON.stringify(signedData))
                event = signedData.eventType
                objectId = signedData.objectId
            } catch (e) {
                console.error('[GOOGLE WEBHOOK] Failed to parse signedMessage:', e)
            }
        } else {
            // Fallback for other formats
            event = body.event || body.eventType || body.type
            objectId = body.objectId || body.object?.id || body.loyaltyObject?.id
        }

        console.log(`[GOOGLE WEBHOOK] Event: ${event}, ObjectId: ${objectId}`)

        // Event is 'save' when user adds the pass
        if ((event === 'save' || event === 'insert' || event === 'SAVE') && objectId) {
            // objectId format: issuerId.passId_with_underscores
            const parts = objectId.split('.')
            const rawPassId = parts.length > 1 ? parts[parts.length - 1] : objectId

            // Convert underscores back to dashes to match our UUID format
            let passId = rawPassId.replace(/_/g, '-')

            console.log(`[GOOGLE WEBHOOK] Looking for pass: ${passId}`)

            if (passId) {
                const supabase = await createClient()

                const { error, data } = await supabase
                    .from('passes')
                    .update({
                        wallet_type: 'google',  // Ensure wallet_type is correct
                        is_installed_on_android: true,
                        verification_status: 'verified',
                        last_updated_at: new Date().toISOString()
                    })
                    .eq('id', passId)
                    .select()
                    .single()

                if (error) {
                    console.error('[GOOGLE WEBHOOK] DB update failed:', error)
                } else if (data) {
                    console.log(`[GOOGLE WEBHOOK] ✅ VERIFIED: ${passId}`)
                } else {
                    console.warn(`[GOOGLE WEBHOOK] Pass not found: ${passId}`)
                }
            }
        } else {
            console.log('[GOOGLE WEBHOOK] Unhandled event type or missing objectId')
        }

        console.log('[GOOGLE WEBHOOK] ========================================')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[GOOGLE WEBHOOK] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
