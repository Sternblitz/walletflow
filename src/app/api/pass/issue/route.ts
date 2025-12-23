import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { WalletPassDraft } from "@/lib/wallet/types"
import { v4 as uuidv4 } from 'uuid'
import { PassFactory } from "@/lib/wallet/pass-factory"
import { loadAppleCerts } from "@/lib/wallet/apple"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
        return NextResponse.json({ error: "Missing campaignId" }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch Campaign Data
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('*, client:clients(name, slug)')
        .eq('id', campaignId)
        .single()

    if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // 2. Extract Draft from Design Assets
    const draft = campaign.design_assets as WalletPassDraft

    // Handle legacy or missing draft
    if (!draft || !draft.meta) {
        console.log("Draft missing or invalid, using fallback")
        const fallbackDraft: WalletPassDraft = {
            meta: { style: 'storeCard' },
            colors: { backgroundColor: '#1A1A1A', foregroundColor: '#FFFFFF', labelColor: '#888888' },
            images: {},
            fields: {
                headerFields: [],
                primaryFields: [{ key: 'welcome', label: 'WILLKOMMEN', value: 'Passify Test' }],
                secondaryFields: [],
                auxiliaryFields: [],
                backFields: []
            },
            barcode: { format: 'PKBarcodeFormatQR', message: campaignId, messageEncoding: 'iso-8859-1' },
            content: { description: 'Loyalty Card', organizationName: campaign.client?.name || 'Passify' }
        }
        return await generatePass(fallbackDraft, campaign, supabase)
    }

    return await generatePass(draft, campaign, supabase)
}

async function generatePass(draft: WalletPassDraft, campaign: any, supabase: any) {
    try {
        // ====================================
        // PHASE 1: Create Unique Pass Entry
        // ====================================

        // Generate unique identifiers
        const serialNumber = `PASS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        const authToken = uuidv4()
        const userAliasId = uuidv4() // Anonymous user ID

        // Determine initial state based on concept
        let initialState: Record<string, any> = {}
        if (campaign.concept === 'STAMP_CARD' || campaign.concept === 'STAMP_CARD_V2') {
            initialState = { stamps: 1, max_stamps: 10 }  // Start with 1 stamp
        } else if (campaign.concept === 'POINTS_CARD') {
            initialState = { points: 0, tier: 'bronze' }
        } else if (campaign.concept === 'MEMBER_CARD' || campaign.concept === 'VIP_CLUB') {
            initialState = { status: 'active', tier: 'member' }
        } else {
            initialState = { created: new Date().toISOString() }
        }

        // PERSISTENCE: Save specific design elements to state to prevent them changing on updates
        // PERSISTENCE: Save specific design elements to state to prevent them changing on updates
        // 1. Stamp Icon - ROBUST EXTRACTION
        const designAssets = campaign.design_assets || {}

        // Check multiple possible locations for the icon
        // Priority: 
        // 1. Direct property on designAssets (from create action fix)
        // 2. Inside designConfig object (nested)
        // 3. Campaign config (root level)
        // 4. Default "☕️"

        // @ts-ignore
        let savedStampIcon = designAssets.stampIcon
        // @ts-ignore
        if (!savedStampIcon) savedStampIcon = designAssets.designConfig?.stampIcon
        // @ts-ignore
        if (!savedStampIcon) savedStampIcon = campaign.config?.stampIcon

        if (!savedStampIcon) {
            console.log("[PASS CREATION] Warning: No stamp icon found in assets, using default.")
            savedStampIcon = "☕️"
        }

        initialState.stamp_icon = savedStampIcon

        console.log(`[PASS CREATED] Persisting stamp icon: ${savedStampIcon}`)

        // Insert into passes table
        const { data: passRecord, error: passError } = await supabase
            .from('passes')
            .insert({
                campaign_id: campaign.id,
                user_alias_id: userAliasId,
                serial_number: serialNumber,
                auth_token: authToken,
                current_state: initialState,
                is_installed_on_ios: true
            })
            .select()
            .single()

        if (passError) {
            console.error("Failed to create pass record:", passError)
            // Continue anyway - pass generation should still work, but updates might fail later
        } else {
            console.log(`[PASS CREATED] Serial: ${serialNumber}, ID: ${passRecord.id}`)
        }

        // ====================================
        // PHASE 2: Generate Pass utilizing Factory
        // ====================================

        // Load certificates
        let certs
        try {
            certs = loadAppleCerts()
        } catch (err) {
            console.error("Certificate loading failed:", err)
            return NextResponse.json({
                error: "Server misconfiguration: Certs missing",
                details: String(err)
            }, { status: 500 })
        }

        // Pass ID is needed for barcodes if we use it
        if (passRecord?.id) {
            initialState.id = passRecord.id
        }

        // Generate the pass using the shared factory
        const pkPass = await PassFactory.createPass({
            draft,
            certs,
            serialNumber,
            authToken,
            state: initialState,
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL
        })

        const passBuffer = pkPass.getAsBuffer()

        return new NextResponse(passBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="pass.pkpass"`,
            },
        })

    } catch (e) {
        console.error("Pass generation failed:", e)
        return NextResponse.json({
            error: "Generation failed",
            details: String(e)
        }, { status: 500 })
    }
}
