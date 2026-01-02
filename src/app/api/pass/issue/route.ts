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

    // Check if user already has a pass for this campaign (cookie-based deduplication)
    const existingPassId = req.cookies.get(`pass_${campaignId}`)?.value
    if (existingPassId) {
        // User already has a pass - reuse it
        console.log(`[PASS ISSUE] Reusing existing pass ${existingPassId} for campaign ${campaignId}`)

        const { data: existingPass } = await supabase
            .from('passes')
            .select('id, serial_number, wallet_type')
            .eq('id', existingPassId)
            .single()

        if (existingPass) {
            // For Apple, redirect to the pass download
            if (platform !== 'android' && existingPass.wallet_type !== 'google') {
                const passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.passify.wallet'
                return NextResponse.redirect(
                    new URL(`/api/v1/passes/${passTypeIdentifier}/${existingPass.serial_number}`, req.url)
                )
            }

            // For Google Wallet: Generate new save link but DON'T create new pass record
            // The existing pass will be used, just redirect to Google save URL
            if (platform === 'android' || existingPass.wallet_type === 'google') {
                console.log(`[PASS ISSUE] Generating new Google link for existing pass ${existingPassId}`)

                // Fetch complete pass data including current state
                const { data: fullPass } = await supabase
                    .from('passes')
                    .select('*, campaign:campaigns(*, client:clients(name))')
                    .eq('id', existingPassId)
                    .single()

                if (fullPass && fullPass.campaign) {
                    const campaign = fullPass.campaign
                    const googleService = new GoogleWalletService()
                    const objectId = fullPass.id.replace(/-/g, '_')
                    const classId = `campaign_${campaign.id.replace(/-/g, '_')}`

                    // Get stamp data from current state
                    const currentState = fullPass.current_state || {}
                    const stamps = currentState.stamps !== undefined ? {
                        current: currentState.stamps,
                        max: currentState.max_stamps || 10
                    } : undefined

                    // Get campaign config for styling
                    const campaignConfig = campaign.config || {}
                    const designAssets = campaign.design_assets || {}

                    // Build text fields from design assets (same as new pass creation)
                    const textFields: Array<{ header: string; body: string }> = []

                    // For COUPON: Add primary field first (the main voucher info)
                    if (campaign.concept === 'COUPON') {
                        designAssets.fields?.primaryFields?.forEach((field: any) => {
                            if (field.label && field.value) {
                                textFields.push({ header: String(field.label), body: String(field.value) })
                            }
                        })
                    }

                    // Add secondary fields from design
                    designAssets.fields?.secondaryFields?.forEach((field: any) => {
                        if (field.label && field.value) {
                            textFields.push({ header: String(field.label), body: String(field.value) })
                        }
                    })

                    // Add auxiliary fields too
                    designAssets.fields?.auxiliaryFields?.forEach((field: any) => {
                        if (field.label && field.value) {
                            textFields.push({ header: String(field.label), body: String(field.value) })
                        }
                    })

                    // Add reward info
                    if (campaignConfig.reward) {
                        textFields.push({ header: 'Prämie', body: campaignConfig.reward })
                    }

                    // For COUPON: Get the main voucher value to display prominently
                    let voucherValue: string | undefined
                    if (campaign.concept === 'COUPON' && designAssets.fields?.primaryFields?.length > 0) {
                        const primaryField = designAssets.fields.primaryFields[0]
                        voucherValue = primaryField.value ? String(primaryField.value) : undefined
                    }

                    // Generate save link with COMPLETE data
                    const saveLink = googleService.generateSaveLink({
                        classId,
                        objectId,
                        customerId: currentState.customer_number || fullPass.serial_number.slice(0, 8),
                        barcodeValue: fullPass.id,
                        stamps,
                        voucherValue,  // For COUPON: shows prominently on card
                        stampEmoji: campaignConfig.stampEmoji || designAssets.stampConfig?.icon || '☕',
                        textFields,
                        classConfig: {
                            programName: campaign.client?.name || campaign.name || 'Loyalty Card',
                            issuerName: campaign.client?.name || 'Passify',
                            logoUrl: designAssets.images?.logo?.url,
                            heroImageUrl: designAssets.images?.strip?.url,
                            backgroundColor: designAssets.colors?.backgroundColor,
                            callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/google-wallet`
                        }
                    })

                    return NextResponse.redirect(saveLink.url)
                }
            }
        }
    }

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
                headerFields: [{ key: 'customerNumber', label: 'Kunde', value: '' }], // Value will be filled by PassFactory
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
        const campaignConfig = campaign.config || {}
        let initialState: Record<string, any> = {}
        if (campaign.concept === 'STAMP_CARD' || campaign.concept === 'STAMP_CARD_V2') {
            initialState = {
                stamps: 1,
                max_stamps: campaignConfig.maxStamps || 10,
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

        // Insert into passes table (NOT installed yet - will be marked when device registers)
        const { data: passRecord, error: passError } = await supabase
            .from('passes')
            .insert({
                campaign_id: campaign.id,
                user_alias_id: userAliasId,
                serial_number: serialNumber,
                auth_token: authToken,
                current_state: initialState,
                wallet_type: walletType,
                is_installed_on_ios: false,  // Will be set when device registers
                is_installed_on_android: false,  // Will be set when first scan
                verification_status: 'pending',  // Will become 'verified' on first real interaction
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
            return await generateGooglePass(supabase, draft, campaign, passRecord, initialState, personalization)
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    // Generate the pass using the shared factory
    const pkPass = await PassFactory.createPass({
        draft,
        certs,
        serialNumber,
        authToken,
        state: initialState,
        baseUrl,
        locations
    })

    const passBuffer = pkPass.getAsBuffer()

    // Create response with cookie to prevent duplicate pass creation
    const response = new NextResponse(passBuffer as any, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="pass.pkpass"`,
        },
    })

    // Set cookie to remember this pass (expires in 1 year)
    response.cookies.set(`pass_${campaign.id}`, passRecord.id, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: 'lax'
    })

    return response
}

async function generateGooglePass(
    supabase: any,
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
                // Use strip image, or fall back to background image for eventTicket style
                heroImageUrl: draft.images?.strip?.url || draft.images?.background?.url,
                backgroundColor: draft.colors?.backgroundColor,
                callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/google-wallet`
            })
        } catch (classError) {
            console.warn("[GOOGLE] Class creation failed (may already exist):", classError)
            // Continue anyway - the class might already exist
        }

        // Object ID for Google Wallet (no dashes allowed)
        const objectId = (passRecord?.id || initialState.customer_number).replace(/-/g, '_')

        // Note: We DON'T call createObject here anymore!
        // The generateSaveLink JWT will create the object with complete data when user saves.
        // Premature createObject was causing incomplete passes (missing stamps, fields).

        // Determine stamps/points from initial state
        const stamps = initialState.stamps !== undefined
            ? { current: initialState.stamps, max: initialState.max_stamps || 10 }
            : undefined
        const points = initialState.points

        // Build text fields from draft
        const textFields: Array<{ header: string; body: string }> = []

        // For COUPON: Add primary field first (the main voucher info like "20% Rabatt")
        if (campaign.concept === 'COUPON') {
            draft.fields?.primaryFields?.forEach(field => {
                if (field.label && field.value) {
                    textFields.push({ header: String(field.label), body: String(field.value) })
                }
            })
        }

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
        // objectId already declared above when creating the object via API

        // For COUPON: Get the main voucher value to display prominently
        let voucherValue: string | undefined
        if (campaign.concept === 'COUPON' && draft.fields?.primaryFields?.length > 0) {
            const primaryField = draft.fields.primaryFields[0]
            voucherValue = primaryField.value ? String(primaryField.value) : undefined
        }

        const saveLink = googleService.generateSaveLink({
            classId,
            objectId,
            customerName: personalization.customerName || undefined,
            customerId: initialState.customer_number,
            stamps,
            points,
            voucherValue,  // For COUPON: shows prominently on card
            barcodeValue: passRecord?.id || initialState.customer_number, // Keep original for QR
            textFields,
            stampEmoji: campaignConfig.stampEmoji || '☕',  // Use campaign-configured emoji
            // Include class config so JWT creates both class + object
            classConfig: {
                programName: campaign.client?.name || campaign.name || 'Loyalty Card',
                issuerName: campaign.client?.name || 'Passify',
                logoUrl: draft.images?.logo?.url,
                heroImageUrl: draft.images?.strip?.url,
                backgroundColor: draft.colors?.backgroundColor,
                callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/google-wallet`
            }
        })

        console.log(`[GOOGLE] Generated save link for pass: ${passRecord?.id}`)

        // NOTE: We do NOT mark as installed automatically for Google 
        // because Google doesn't have a callback like Apple.
        // The pass stays is_installed_on_android=false until we find a better way.

        // Redirect to Google Wallet save URL with cookie to prevent duplicates
        const response = NextResponse.redirect(saveLink.url)

        // Set cookie to remember this pass (expires in 1 year)
        if (passRecord?.id) {
            response.cookies.set(`pass_${campaign.id}`, passRecord.id, {
                maxAge: 60 * 60 * 24 * 365, // 1 year
                httpOnly: true,
                sameSite: 'lax'
            })
        }

        return response

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
