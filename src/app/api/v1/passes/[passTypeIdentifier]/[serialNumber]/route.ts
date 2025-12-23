import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { WalletPassDraft, PassField } from "@/lib/wallet/types"

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
        const { PKPass } = await import("passkit-generator")
        const { loadAppleCerts } = await import("@/lib/wallet/apple")
        const fs = await import("fs")

        const certs = loadAppleCerts()
        const draft = pass.campaign?.design_assets as WalletPassDraft
        const currentState = pass.current_state || {}

        // Debug: Log what's in the draft
        console.log('[PASS UPDATE] Draft loaded:', {
            hasDraft: !!draft,
            style: draft?.meta?.style,
            logoText: draft?.content?.logoText,
            headerFieldsCount: draft?.fields?.headerFields?.length || 0,
            headerFields: draft?.fields?.headerFields?.map(f => ({ key: f.key, value: f.value })),
            imagesKeys: Object.keys(draft?.images || {}),
        })
        console.log('[PASS UPDATE] Current state:', currentState)

        if (!draft || !draft.meta) {
            return new NextResponse(null, { status: 500 })
        }

        // Helper to format fields
        const formatFields = (fields: PassField[] | undefined): any[] => {
            if (!fields || fields.length === 0) return []
            return fields.map(f => ({
                key: f.key,
                label: f.label,
                value: String(f.value),
                ...(f.textAlignment && { textAlignment: f.textAlignment })
            }))
        }

        // Update fields with current state (recursive for all sections)
        const updateFieldsWithState = (fields: PassField[] | undefined, state: Record<string, any>, isPrimary = false) => {
            if (!fields) return []

            // Log fields for debugging
            fields.forEach(f => console.log(`[PASS FIELD] Key: ${f.key}, Value: ${f.value}`))

            return fields.map((f, index) => {
                // STAMPS Logic - also update first primary field as fallback
                const isStampField = (f.key === 'stamps' || f.key === 'balance' || f.key === 'primary') || (isPrimary && index === 0 && state.stamps !== undefined)

                // PROGRESS VISUAL Logic - this field contains the emoji representation
                const isProgressVisual = f.key === 'progress_visual' || f.key === 'progress' || f.key === 'visual'

                if ((isStampField || isProgressVisual) && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10

                    // improved logic: Check if we should use emojis
                    // If the original value had emojis, preserve that style
                    const originalVal = String(f.value || '')

                    // Extract the stamp emoji from the original value
                    // Passes start with 1 stamp, so the emoji is already there from the editor
                    // Match any emoji that's NOT the empty circle (⚪)
                    const emojiMatch = originalVal.match(/(?!⚪)[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu)
                    const stampIcon = emojiMatch ? emojiMatch[0] : null

                    console.log(`[STAMP DEBUG] originalVal: ${originalVal}`)
                    console.log(`[STAMP DEBUG] Extracted stampIcon: ${stampIcon || 'none (using default ☕️)'}`)

                    // For progress_visual, always use emojis
                    // For stamps field, check if original had emojis
                    const useEmojis = isProgressVisual || originalVal.includes('⚪') || !!stampIcon

                    let val: string;
                    if (useEmojis) {
                        const icon = stampIcon || '☕️'  // Fallback only if no emoji found
                        const emptyIcon = '⚪'
                        // Use repeat to generate string with spaces
                        val = (icon + ' ').repeat(current) + (emptyIcon + ' ').repeat(Math.max(0, max - current))
                        val = val.trim()
                    } else {
                        val = `${current} von ${max}`
                    }

                    console.log(`[PASS UPDATE] Updating ${f.key} (isProgressVisual: ${isProgressVisual}): ${originalVal} -> ${val}`)
                    return { ...f, value: val }
                }
                // POINTS Logic
                if (f.key === 'points' && state.points !== undefined) {
                    return { ...f, value: String(state.points) }
                }
                // TIER Logic
                if (f.key === 'tier' && state.tier !== undefined) {
                    return { ...f, value: state.tier.toUpperCase() }
                }

                // Dynamic CARD NUMBER Logic (preserve from issue)
                if (f.key === 'card') {
                    // Extract last 4 chars of serial for card number
                    // serialNumber is available in scope
                    const cardNum = serialNumber.slice(-4).toUpperCase()
                    return { ...f, value: cardNum }
                }

                return f
            })
        }

        // Create pass
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
                authenticationToken: pass.auth_token,
                webServiceURL: process.env.NEXT_PUBLIC_BASE_URL + '/api',
                formatVersion: 1,
                backgroundColor: draft.colors.backgroundColor,
                foregroundColor: draft.colors.foregroundColor,
                labelColor: draft.colors.labelColor,
                logoText: draft.content.logoText || draft.content.organizationName
            } as any
        )

        pkPass.type = draft.meta.style || 'storeCard'

        // Debug: log what we're working with
        console.log('[PASS UPDATE] Draft fields:', {
            headerFields: draft.fields.headerFields?.length || 0,
            primaryFields: draft.fields.primaryFields?.length || 0,
            secondaryFields: draft.fields.secondaryFields?.length || 0,
            auxiliaryFields: draft.fields.auxiliaryFields?.length || 0,
        })

        // Add fields
        formatFields(updateFieldsWithState(draft.fields.headerFields, currentState)).forEach(f => pkPass.headerFields.push(f))
        formatFields(updateFieldsWithState(draft.fields.primaryFields, currentState, true)).forEach(f => pkPass.primaryFields.push(f))
        formatFields(updateFieldsWithState(draft.fields.secondaryFields, currentState)).forEach(f => pkPass.secondaryFields.push(f))
        formatFields(updateFieldsWithState(draft.fields.auxiliaryFields, currentState)).forEach(f => pkPass.auxiliaryFields.push(f))
        formatFields(updateFieldsWithState(draft.fields.backFields, currentState)).forEach(f => pkPass.backFields.push(f))

        // Barcode
        pkPass.setBarcodes({
            format: draft.barcode.format || 'PKBarcodeFormatQR',
            message: pass.id,
            messageEncoding: 'iso-8859-1',
        })

        // RESTORE IMAGES
        // The images can be stored as Data URLs (base64) or HTTP URLs (Supabase Storage)
        if (draft.images) {
            console.log('[PASS UPDATE] Images to restore:', Object.keys(draft.images))

            for (const [key, value] of Object.entries(draft.images) as [string, any][]) {
                try {
                    let buffer: Buffer | null = null

                    // If it's a string (old format or direct data URL)
                    if (typeof value === 'string' && value.startsWith('data:image')) {
                        const base64Data = value.split(',')[1]
                        if (base64Data) {
                            buffer = Buffer.from(base64Data, 'base64')
                        }
                    }
                    // If it's a string HTTP URL
                    else if (typeof value === 'string' && value.startsWith('http')) {
                        const response = await fetch(value)
                        if (response.ok) {
                            buffer = Buffer.from(await response.arrayBuffer())
                        }
                    }
                    // If it's an object with url property
                    else if (typeof value === 'object' && value?.url) {
                        if (value.url.startsWith('data:image')) {
                            const base64Data = value.url.split(',')[1]
                            if (base64Data) {
                                buffer = Buffer.from(base64Data, 'base64')
                            }
                        } else if (value.url.startsWith('http')) {
                            console.log(`[PASS UPDATE] Fetching ${key} from: ${value.url}`)
                            const response = await fetch(value.url)
                            if (response.ok) {
                                buffer = Buffer.from(await response.arrayBuffer())
                                console.log(`[PASS UPDATE] ${key} loaded, size: ${buffer.length}`)
                            } else {
                                console.error(`[PASS UPDATE] Failed to fetch ${key}: ${response.status}`)
                            }
                        }
                    }

                    if (buffer) {
                        pkPass.addBuffer(`${key}.png`, buffer)
                        pkPass.addBuffer(`${key}@2x.png`, buffer)
                        console.log(`[PASS UPDATE] Added ${key} to pass`)
                    }
                } catch (err) {
                    console.error(`[PASS UPDATE] Error loading image ${key}:`, err)
                }
            }
        }

        // Fallback for Icon if missing
        if (!draft.images?.icon) {
            const fallbackIcon = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
                'base64'
            )
            pkPass.addBuffer('icon.png', fallbackIcon)
            pkPass.addBuffer('icon@2x.png', fallbackIcon)
        }

        // RESTORE GEOLOCATION
        const config = pass.campaign.config || {}
        if (config.locations && Array.isArray(config.locations) && config.locations.length > 0) {
            // @ts-ignore
            pkPass.setLocations(...config.locations.map((l: any) => ({
                latitude: l.lat,
                longitude: l.lng,
                relevantText: l.message || 'Du bist in der Nähe! 🎉'
            })))
        } else if (config.address) {
            // We can't geocode here again easily (async), 
            // ideally lat/lng should be stored in config.
            // For now we skip re-geocoding to keep it fast.
        }

        const passBuffer = pkPass.getAsBuffer()

        console.log(`[GET PASS] Generated updated pass for ${serialNumber}`)

        return new NextResponse(passBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Last-Modified': new Date(pass.last_updated_at).toUTCString(),
            },
        })

    } catch (e) {
        console.error('[GET PASS] Generation failed:', e)
        return new NextResponse(null, { status: 500 })
    }
}
