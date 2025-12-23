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
                if (isStampField && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10

                    // improved logic: Check if we should use emojis
                    // If the original value had emojis, preserve that style
                    const originalVal = String(f.value || '')

                    // Get config for stamp icon from campaign
                    const campaignConfig = pass.campaign?.config || {}
                    // @ts-ignore - designConfig may exist in design_assets
                    const designConfig = pass.campaign?.design_assets?.designConfig || {}

                    const stampIcon = designConfig.stampIcon || campaignConfig.stampIcon || (originalVal.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0])
                    const hasEmojis = originalVal.includes('⚪') || !!stampIcon || originalVal.includes('✅') || originalVal.includes('❌') || originalVal.includes('⭐')

                    let val: string;
                    if (hasEmojis) {
                        const icon = stampIcon || '✅'
                        const emptyIcon = '⚪️'
                        // Use repeat to generate string with spaces
                        val = (icon + ' ').repeat(current) + (emptyIcon + ' ').repeat(Math.max(0, max - current))
                        val = val.trim()
                    } else {
                        val = `${current} von ${max}`
                    }

                    console.log(`[PASS UPDATE] Updating ${f.key} (Primary: ${isPrimary}): ${originalVal} -> ${val}`)
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
        // The images are stored as Data URLs in the JSON (base64)
        if (draft.images) {
            Object.entries(draft.images).forEach(([key, value]: [string, any]) => {
                // If it's a string (old format or direct data URL)
                if (typeof value === 'string' && value.startsWith('data:image')) {
                    const base64Data = value.split(',')[1]
                    if (base64Data) {
                        const buffer = Buffer.from(base64Data, 'base64')
                        pkPass.addBuffer(`${key}.png`, buffer)
                        pkPass.addBuffer(`${key}@2x.png`, buffer)
                    }
                }
                // If it's an object with url property (new format)
                else if (typeof value === 'object' && value?.url && value.url.startsWith('data:image')) {
                    const base64Data = value.url.split(',')[1]
                    if (base64Data) {
                        const buffer = Buffer.from(base64Data, 'base64')
                        pkPass.addBuffer(`${key}.png`, buffer)
                        pkPass.addBuffer(`${key}@2x.png`, buffer)
                    }
                }
            })
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
