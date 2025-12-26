import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleWalletService } from '@/lib/wallet/google'

/**
 * GET /api/debug/google-wallet?campaignId=XXX
 * 
 * Debug endpoint to test Google Wallet JWT generation
 * Shows the decoded JWT payload and save link
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
        return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    try {
        const supabase = await createClient()

        // Fetch campaign
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*, client:clients(name, slug)')
            .eq('id', campaignId)
            .single()

        if (error || !campaign) {
            return NextResponse.json({
                error: 'Campaign not found',
                details: error
            }, { status: 404 })
        }

        const designAssets = campaign.design_assets || {}

        // Check Google Wallet configuration
        const configCheck = {
            GOOGLE_ISSUER_ID: !!process.env.GOOGLE_ISSUER_ID,
            GOOGLE_SERVICE_ACCOUNT_KEY_PATH: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
            GOOGLE_SERVICE_ACCOUNT_BASE64: !!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64,
        }

        // Try to generate the save link
        const googleService = new GoogleWalletService()

        const classId = `campaign_${campaign.id.replace(/-/g, '_')}`
        const objectId = `test_${Date.now()}`
        const customerId = 'TEST123'

        const saveLink = googleService.generateSaveLink({
            classId,
            objectId,
            customerName: 'Test User',
            customerId,
            stamps: { current: 1, max: 10 },
            barcodeValue: objectId,
            textFields: [
                { header: 'Prämie', body: 'Gratis Kaffee' }
            ],
            classConfig: {
                programName: campaign.name || 'Test Loyalty Card',
                issuerName: campaign.client?.name || 'Passify',
                logoUrl: designAssets.images?.logo?.url,
                heroImageUrl: designAssets.images?.strip?.url,
                backgroundColor: designAssets.colors?.backgroundColor
            }
        })

        // Decode the JWT to show the payload
        const jwtParts = saveLink.jwt.split('.')
        const jwtPayload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString('utf-8'))

        return NextResponse.json({
            success: true,
            debug: {
                configCheck,
                issuerId: process.env.GOOGLE_ISSUER_ID,
                classId: `${process.env.GOOGLE_ISSUER_ID}.${classId}`,
                objectId: `${process.env.GOOGLE_ISSUER_ID}.${objectId}`,
            },
            jwtPayload: {
                iss: jwtPayload.iss,
                aud: jwtPayload.aud,
                origins: jwtPayload.origins,
                typ: jwtPayload.typ,
                loyaltyClasses: jwtPayload.payload?.loyaltyClasses,
                loyaltyObjects: jwtPayload.payload?.loyaltyObjects,
            },
            saveLink: saveLink.url,
            // Direct link to Google's JWT debugger
            jwtDebuggerUrl: `https://jwt.io/#debugger-io?token=${saveLink.jwt}`,
        })

    } catch (e: any) {
        console.error('Debug error:', e)
        return NextResponse.json({
            error: 'Debug failed',
            message: e.message,
            stack: e.stack
        }, { status: 500 })
    }
}
