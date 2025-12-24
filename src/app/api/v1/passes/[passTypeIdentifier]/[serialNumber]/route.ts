import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { WalletPassDraft } from "@/lib/wallet/types"
import { PassFactory } from "@/lib/wallet/pass-factory"
import { loadAppleCerts } from "@/lib/wallet/apple"

/**
 * Apple Pass Web Service - Get Latest Pass
 * 
 * GET: Returns the latest version of a pass
 * 
 * Route: /api/v1/passes/{passTypeIdentifier}/{serialNumber}
 */

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> }
) {
    const { serialNumber } = await params

    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
        return new NextResponse(null, { status: 401 })
    }
    const authToken = authHeader.replace('ApplePass ', '')

    const supabase = await createClient()

    // Get pass with current state
    const { data: pass, error } = await supabase
        .from('passes')
        .select('*, campaign:campaigns(*, client:clients(name))')
        .eq('serial_number', serialNumber)
        .single()

    if (error || !pass) {
        console.log(`[GET PASS] Pass not found: ${serialNumber}`)
        return new NextResponse(null, { status: 404 })
    }

    if (pass.auth_token !== authToken) {
        console.log(`[GET PASS] Auth mismatch for ${serialNumber}`)
        return new NextResponse(null, { status: 401 })
    }

    // Generate updated pass with current state
    try {
        const certs = loadAppleCerts()
        const draft = pass.campaign?.design_assets as WalletPassDraft
        const currentState = pass.current_state || {}

        // Add ID to state to ensure barcodes work correctly
        currentState.id = pass.id

        // Debug: Log what's in the draft
        console.log('[PASS UPDATE] Draft loaded:', {
            hasDraft: !!draft,
            style: draft?.meta?.style,
            logoText: draft?.content?.logoText,
            headerFieldsCount: draft?.fields?.headerFields?.length || 0,
            imagesKeys: Object.keys(draft?.images || {}),
        })
        console.log('[PASS UPDATE] Current state:', currentState)

        if (!draft || !draft.meta) {
            return new NextResponse(null, { status: 500 })
        }

        // Generate the pass using the shared factory
        // Extract locations from campaign config for GPS notifications
        const campaignConfig = pass.campaign?.config || {}
        const defaultMessage = campaignConfig.locationMessage || "Du bist in der Nähe! 🎉"
        const locations = campaignConfig.locations?.map((loc: any) => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            relevantText: loc.relevantText || defaultMessage
        })) || []

        const pkPass = await PassFactory.createPass({
            draft,
            certs,
            serialNumber,
            authToken: pass.auth_token,
            state: currentState,
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
            locations
        })

        const passBuffer = pkPass.getAsBuffer()

        console.log(`[GET PASS] Generated updated pass for ${serialNumber}`)

        return new NextResponse(passBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Last-Modified': new Date(pass.last_updated_at || new Date()).toUTCString(),
            },
        })

    } catch (e) {
        console.error('[GET PASS] Generation failed:', e)
        return new NextResponse(null, { status: 500 })
    }
}
