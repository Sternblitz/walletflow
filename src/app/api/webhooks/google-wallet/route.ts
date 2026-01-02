import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/webhooks/google-wallet
 * 
 * Receives notifications from Google Wallet API when a user saves a pass.
 * This allows us to verify Google Wallet installations without waiting for a scan.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('[GOOGLE WEBHOOK] Received event:', JSON.stringify(body))

        const { event, objectId } = body

        // Event is 'save' when user adds the pass
        // Or 'insert' in some contexts
        if ((event === 'save' || event === 'insert') && objectId) {
            // objectId format: issuerId.passId_with_underscores
            // Example: 3388000000022230835.PASS_1735848...

            // Extract the pass ID part (suffix after last dot)
            const parts = objectId.split('.')
            const rawPassId = parts.length > 1 ? parts[parts.length - 1] : objectId

            // Convert underscores back to dashes to match our UUID format
            // (Note: we replaced '-' with '_' in generation because Google IDs can't have dashes)
            // But we can also look up by serial_number or something else if needed. 
            // However, we used passRecord.id in generation.

            let passId = rawPassId.replace(/_/g, '-')

            if (passId) {
                const supabase = await createClient()

                // Try to update pass directly
                // We use is_installed_on_android = true AND verification_status = 'verified'
                const { error, data } = await supabase
                    .from('passes')
                    .update({
                        is_installed_on_android: true,
                        verification_status: 'verified',
                        last_updated_at: new Date().toISOString()
                    })
                    .eq('id', passId)
                    .select()
                    .single()

                if (error) {
                    console.error('[GOOGLE WEBHOOK] Failed to update pass:', error)

                    // Fallback: Maybe the ID logic was different? 
                    // Try exact match on 'id' with the raw value? unlikely given UUID format
                } else if (data) {
                    console.log(`[GOOGLE WEBHOOK] ✅ Verified Google pass: ${passId}`)
                } else {
                    console.warn(`[GOOGLE WEBHOOK] Pass not found for ID: ${passId} (raw: ${rawPassId})`)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[GOOGLE WEBHOOK] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
