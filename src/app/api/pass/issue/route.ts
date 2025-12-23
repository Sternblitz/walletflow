import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { WalletPassDraft, PassField } from "@/lib/wallet/types"
import { v4 as uuidv4 } from 'uuid'

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
        const { PKPass } = await import("passkit-generator")
        const { loadAppleCerts } = await import("@/lib/wallet/apple")
        const fs = await import("fs")

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
            initialState = { stamps: 0, max_stamps: 10 }
        } else if (campaign.concept === 'POINTS_CARD') {
            initialState = { points: 0, tier: 'bronze' }
        } else if (campaign.concept === 'MEMBER_CARD' || campaign.concept === 'VIP_CLUB') {
            initialState = { status: 'active', tier: 'member' }
        } else {
            initialState = { created: new Date().toISOString() }
        }

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
            // Continue anyway - pass generation should still work
        } else {
            console.log(`[PASS CREATED] Serial: ${serialNumber}, ID: ${passRecord.id}`)
        }

        // The QR code should contain the pass ID for scanning
        const barcodeMessage = passRecord?.id || serialNumber

        // Helper to convert PassField[] to Apple's expected format
        const formatFields = (fields: PassField[] | undefined): any[] => {
            if (!fields || fields.length === 0) return []
            return fields.map(f => ({
                key: f.key,
                label: f.label,
                value: String(f.value),
                ...(f.textAlignment && { textAlignment: f.textAlignment })
            }))
        }

        // Update fields with actual user data if this is a new pass
        const updateFieldsWithUserData = (fields: PassField[], state: Record<string, any>) => {
            return fields.map(f => {
                // Update stamp card display
                if (f.key === 'stamps' && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10
                    return { ...f, value: `${current} von ${max}` }
                }
                // Update points display
                if (f.key === 'points' && state.points !== undefined) {
                    return { ...f, value: String(state.points) }
                }
                // Update card number with actual serial
                if (f.key === 'card') {
                    // Extract last 4 chars of serial for card number
                    const cardNum = serialNumber.slice(-4).toUpperCase()
                    return { ...f, value: cardNum }
                }
                return f
            })
        }

        // Apply user data to fields
        const updatedPrimaryFields = updateFieldsWithUserData(draft.fields.primaryFields, initialState)
        const updatedHeaderFields = updateFieldsWithUserData(draft.fields.headerFields, initialState)

        // The pass style key (storeCard, coupon, generic, eventTicket)
        const passStyle = draft.meta.style || 'storeCard'

        // Create pass - use buffers if available (production), otherwise read files (local)
        const pkPass = new PKPass(
            {},
            {
                wwdr: certs.wwdrBuffer || fs.readFileSync(certs.wwdr),
                signerCert: certs.signerCertBuffer || fs.readFileSync(certs.signerCert),
                signerKey: certs.signerKeyBuffer || fs.readFileSync(certs.signerKey),
                signerKeyPassphrase: certs.signerKeyPassphrase,
            },
            {
                passTypeIdentifier: certs.passTypeIdentifier,
                teamIdentifier: certs.teamIdentifier || '',
                organizationName: draft.content.organizationName || 'Passify',
                description: draft.content.description || 'Loyalty Card',
                serialNumber: serialNumber,
                // Enable push updates on production (HTTPS required)
                ...(process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https') ? {
                    authenticationToken: authToken,
                    webServiceURL: process.env.NEXT_PUBLIC_BASE_URL + '/api',
                } : {}),
                formatVersion: 1,

                // Colors
                backgroundColor: draft.colors.backgroundColor,
                foregroundColor: draft.colors.foregroundColor,
                labelColor: draft.colors.labelColor,

                // Logo text
                ...(!draft.content.hideLogoText && (draft.content.logoText || draft.content.organizationName)
                    ? { logoText: draft.content.logoText || draft.content.organizationName }
                    : {}
                ),
            } as any
        )

        // Set pass type
        pkPass.type = passStyle

        // Add fields
        formatFields(updatedHeaderFields).forEach(field => {
            pkPass.headerFields.push(field)
        })
        formatFields(updatedPrimaryFields).forEach(field => {
            pkPass.primaryFields.push(field)
        })
        formatFields(draft.fields.secondaryFields).forEach(field => {
            pkPass.secondaryFields.push(field)
        })
        formatFields(draft.fields.auxiliaryFields).forEach(field => {
            pkPass.auxiliaryFields.push(field)
        })
        formatFields(draft.fields.backFields).forEach(field => {
            pkPass.backFields.push(field)
        })

        // Set barcode - contains Pass ID for scanning!
        pkPass.setBarcodes({
            format: draft.barcode.format || 'PKBarcodeFormatQR',
            message: barcodeMessage,
            messageEncoding: draft.barcode.messageEncoding || 'iso-8859-1',
        })

        // ====================================
        // GEOLOCATION: Add locations for lockscreen alerts
        // ====================================
        const config = campaign.config || {}

        // Support for multiple locations from map picker
        if (config.locations && Array.isArray(config.locations) && config.locations.length > 0) {
            const passLocations = config.locations.slice(0, 10).map((loc: any) => ({
                latitude: loc.lat,
                longitude: loc.lng,
                relevantText: loc.message || 'Du bist in der Nähe! 🎉'
            }))

            // @ts-ignore - passkit-generator supports this
            pkPass.setLocations(...passLocations)
            console.log(`[GEOLOCATION] Added ${passLocations.length} locations`)
        }
        // Fallback: Legacy single address support
        else if (config.address && typeof config.address === 'string' && config.address.trim()) {
            try {
                const encodedAddress = encodeURIComponent(config.address)
                const geoResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
                    { headers: { 'User-Agent': 'Passify/1.0' } }
                )

                if (geoResponse.ok) {
                    const geoResults = await geoResponse.json()
                    if (geoResults && geoResults.length > 0) {
                        const lat = parseFloat(geoResults[0].lat)
                        const lng = parseFloat(geoResults[0].lon)

                        // @ts-ignore
                        pkPass.setLocations({
                            latitude: lat,
                            longitude: lng,
                            relevantText: config.locationMessage || 'Du bist in der Nähe! 🎉'
                        })
                        console.log(`[GEOLOCATION] Added location: ${lat}, ${lng}`)
                    }
                }
            } catch (geoError) {
                console.error('Geocoding failed:', geoError)
            }
        }

        // Handle Images
        const getFallbackIcon = () => Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
            'base64'
        )

        const buffers: Record<string, Buffer> = {}

        for (const [key, image] of Object.entries(draft.images || {})) {
            if (!image?.url) continue

            if (image.url.startsWith('data:')) {
                const base64Data = image.url.split(',')[1]
                buffers[key] = Buffer.from(base64Data, 'base64')
            } else if (image.url.startsWith('http')) {
                try {
                    const response = await fetch(image.url)
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer()
                        buffers[key] = Buffer.from(arrayBuffer)
                    }
                } catch (err) {
                    console.error(`Error fetching image ${key}:`, err)
                }
            }
        }

        // Always add icon
        if (!buffers['icon']) {
            const fallback = getFallbackIcon()
            pkPass.addBuffer('icon.png', fallback)
            pkPass.addBuffer('icon@2x.png', fallback)
        }

        // Always add logo
        if (!buffers['logo']) {
            const fallback = buffers['icon'] || getFallbackIcon()
            pkPass.addBuffer('logo.png', fallback)
            pkPass.addBuffer('logo@2x.png', fallback)
        }

        // Add all uploaded images
        for (const [name, buffer] of Object.entries(buffers)) {
            pkPass.addBuffer(`${name}.png`, buffer)
            pkPass.addBuffer(`${name}@2x.png`, buffer)
        }

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
