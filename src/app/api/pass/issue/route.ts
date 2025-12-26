import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { WalletPassDraft } from "@/lib/wallet/types"
import { v4 as uuidv4 } from 'uuid'
import { PassFactory } from "@/lib/wallet/pass-factory"
import { loadAppleCerts } from "@/lib/wallet/apple"
import { GoogleWalletService } from "@/lib/wallet/google"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const platform = searchParams.get('platform') || 'ios' // 'ios' | 'android'

    // Personalization params (optional)
    const customerName = searchParams.get('name')
    const customerBirthday = searchParams.get('birthday')

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

    // 2. Check if personalization is required but not provided
    const campaignConfig = campaign.config || {}
    const personalization = campaignConfig.personalization || {}

    if (personalization.ask_name && !customerName) {
        // Redirect to onboarding page
        const onboardingUrl = `/start/${campaign.client?.slug}/onboarding?campaignId=${campaignId}&platform=${platform}`
        return NextResponse.redirect(new URL(onboardingUrl, req.url))
    }

    // 3. Extract Draft from Design Assets
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
        return await generatePass(fallbackDraft, campaign, supabase, platform, { customerName, customerBirthday })
    }

    return await generatePass(draft, campaign, supabase, platform, { customerName, customerBirthday })
}

interface PersonalizationData {
    customerName?: string | null
    customerBirthday?: string | null
}

async function generatePass(
    draft: WalletPassDraft,
    campaign: any,
    supabase: any,
    platform: string,
    personalization: PersonalizationData
) {
    try {
        // ====================================
        // PHASE 1: Create Unique Pass Entry
        // ====================================

        // Generate unique identifiers
        const serialNumber = `PASS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        const authToken = uuidv4()
        const userAliasId = uuidv4() // Anonymous user ID

        // Generate unique customer number (6-char alphanumeric, guaranteed unique)
        const customerNumber = Math.random().toString(36).substring(2, 8).toUpperCase()

        // Determine wallet type
        const walletType = platform === 'android' ? 'google' : 'apple'

        // Determine initial state based on concept
        let initialState: Record<string, any> = {}
        if (campaign.concept === 'STAMP_CARD' || campaign.concept === 'STAMP_CARD_V2') {
            initialState = {
                stamps: 1,
                max_stamps: 10,
                customer_number: customerNumber,
                redemptions: 0
            }
        } else if (campaign.concept === 'POINTS_CARD') {
            initialState = { points: 0, tier: 'bronze', customer_number: customerNumber }
        } else if (campaign.concept === 'MEMBER_CARD' || campaign.concept === 'VIP_CLUB') {
            initialState = { status: 'active', tier: 'member', customer_number: customerNumber }
        } else {
            initialState = { created: new Date().toISOString(), customer_number: customerNumber }
        }

        // Add personalization data to state
        if (personalization.customerName) {
            initialState.customer_name = personalization.customerName
        }
        if (personalization.customerBirthday) {
            initialState.customer_birthday = personalization.customerBirthday
        }

        // PERSISTENCE: Save stamp icon to state
        const designAssets = campaign.design_assets || {}
        // @ts-ignore
        let savedStampIcon = designAssets.stampConfig?.icon
        // @ts-ignore
        if (!savedStampIcon) savedStampIcon = designAssets.stampIcon
        // @ts-ignore
        if (!savedStampIcon) savedStampIcon = designAssets.designConfig?.stampIcon
        // @ts-ignore
        if (!savedStampIcon) savedStampIcon = campaign.config?.stampIcon

        if (!savedStampIcon) {
            console.log("[PASS CREATION] Warning: No stamp icon found in assets, using default.")
            savedStampIcon = "☕️"
        }

        initialState.stamp_icon = savedStampIcon

        console.log(`[PASS CREATED] Platform: ${walletType}, Persisting stamp icon: ${savedStampIcon}`)

        // Insert into passes table
        const { data: passRecord, error: passError } = await supabase
            .from('passes')
            .insert({
                campaign_id: campaign.id,
                user_alias_id: userAliasId,
                serial_number: serialNumber,
                auth_token: authToken,
                current_state: initialState,
                wallet_type: walletType,
                is_installed_on_ios: walletType === 'apple',
                is_installed_on_android: walletType === 'google',
                customer_name: personalization.customerName || null,
                customer_birthday: personalization.customerBirthday || null
            })
            .select()
            .single()

        if (passError) {
            console.error("Failed to create pass record:", passError)
        } else {
            console.log(`[PASS CREATED] Serial: ${serialNumber}, ID: ${passRecord.id}, Wallet: ${walletType}`)
        }

        // ====================================
        // PHASE 2: Generate Pass by Platform
        // ====================================

        if (walletType === 'google') {
            // === GOOGLE WALLET ===
            return await generateGooglePass(draft, campaign, passRecord, initialState, personalization)
        } else {
            // === APPLE WALLET ===
            return await generateApplePass(draft, campaign, passRecord, serialNumber, authToken, initialState)
        }

    } catch (e) {
        console.error("Pass generation failed:", e)
        return NextResponse.json({
            error: "Generation failed",
            details: String(e)
        }, { status: 500 })
    }
}

async function generateApplePass(
    draft: WalletPassDraft,
    campaign: any,
    passRecord: any,
    serialNumber: string,
    authToken: string,
    initialState: Record<string, any>
) {
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

    // Pass ID for barcode
    if (passRecord?.id) {
        initialState.id = passRecord.id
    }

    // Extract locations from campaign config for GPS notifications
    const campaignConfig = campaign.config || {}
    const defaultMessage = campaignConfig.locationMessage || "Du bist in der Nähe! 🎉"
    const locations = campaignConfig.locations?.map((loc: any) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        relevantText: loc.relevantText || defaultMessage
    })) || []

    if (locations.length > 0) {
        console.log(`[PASS] Adding ${locations.length} GPS locations to pass`)
    }

    // Generate the pass using the shared factory
    const pkPass = await PassFactory.createPass({
        draft,
        certs,
        serialNumber,
        authToken,
        state: initialState,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        locations
    })

    const passBuffer = pkPass.getAsBuffer()

    return new NextResponse(passBuffer as any, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="pass.pkpass"`,
        },
    })
}

async function generateGooglePass(
    draft: WalletPassDraft,
    campaign: any,
    passRecord: any,
    initialState: Record<string, any>,
    personalization: PersonalizationData
) {
    try {
        const googleService = new GoogleWalletService()

        // Create/update the loyalty class for this campaign (if not exists)
        const classId = `campaign_${campaign.id.replace(/-/g, '_')}`

        try {
            await googleService.createOrUpdateClass({
                classId,
                programName: campaign.name || 'Loyalty Card',
                issuerName: campaign.client?.name || 'Passify',
                logoUrl: draft.images?.logo?.url,
                heroImageUrl: draft.images?.strip?.url,
                backgroundColor: draft.colors?.backgroundColor
            })
        } catch (classError) {
            console.warn("[GOOGLE] Class creation failed (may already exist):", classError)
            // Continue anyway - the class might already exist
        }

        // Determine stamps/points from initial state
        const stamps = initialState.stamps !== undefined
            ? { current: initialState.stamps, max: initialState.max_stamps || 10 }
            : undefined
        const points = initialState.points

        // Build text fields from draft
        const textFields: Array<{ header: string; body: string }> = []

        // Add secondary fields
        draft.fields?.secondaryFields?.forEach(field => {
            if (field.label && field.value) {
                textFields.push({ header: String(field.label), body: String(field.value) })
            }
        })

        // Add reward info
        const campaignConfig = campaign.config || {}
        if (campaignConfig.reward) {
            textFields.push({ header: 'Prämie', body: campaignConfig.reward })
        }

        // Generate save link with class configuration
        // Note: Google Wallet IDs can only contain alphanumeric + underscores, no dashes!
        const objectId = (passRecord?.id || initialState.customer_number).replace(/-/g, '_')

        const saveLink = googleService.generateSaveLink({
            classId,
            objectId,
            customerName: personalization.customerName || undefined,
            customerId: initialState.customer_number,
            stamps,
            points,
            barcodeValue: passRecord?.id || initialState.customer_number, // Keep original for QR
            textFields,
            stampEmoji: campaignConfig.stampEmoji || '☕',  // Use campaign-configured emoji
            // Include class config so JWT creates both class + object
            classConfig: {
                programName: campaign.name || 'Loyalty Card',
                issuerName: campaign.client?.name || 'Passify',
                logoUrl: draft.images?.logo?.url,
                heroImageUrl: draft.images?.strip?.url,
                backgroundColor: draft.colors?.backgroundColor
            }
        })

        console.log(`[GOOGLE] Generated save link for pass: ${passRecord?.id}`)

        // Redirect to Google Wallet save URL
        return NextResponse.redirect(saveLink.url)

    } catch (e) {
        console.error("Google Wallet generation failed:", e)

        // Fall back to a nice error page
        return NextResponse.json({
            error: "Google Wallet not configured",
            message: "Bitte nutze ein iPhone oder kontaktiere den Support.",
            details: String(e)
        }, { status: 500 })
    }
}
