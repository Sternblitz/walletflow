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

        // Update fields with current state
        const updateFieldsWithState = (fields: PassField[], state: Record<string, any>) => {
            return fields.map(f => {
                if (f.key === 'stamps' && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10
                    return { ...f, value: `${current} von ${max}` }
                }
                if (f.key === 'points' && state.points !== undefined) {
                    return { ...f, value: String(state.points) }
                }
                return f
            })
        }

        const updatedPrimaryFields = updateFieldsWithState(draft.fields.primaryFields || [], currentState)

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
            } as any
        )

        pkPass.type = draft.meta.style || 'storeCard'

        // Add fields
        formatFields(draft.fields.headerFields).forEach(field => pkPass.headerFields.push(field))
        formatFields(updatedPrimaryFields).forEach(field => pkPass.primaryFields.push(field))
        formatFields(draft.fields.secondaryFields).forEach(field => pkPass.secondaryFields.push(field))
        formatFields(draft.fields.auxiliaryFields).forEach(field => pkPass.auxiliaryFields.push(field))
        formatFields(draft.fields.backFields).forEach(field => pkPass.backFields.push(field))

        // Barcode with pass ID
        pkPass.setBarcodes({
            format: draft.barcode.format || 'PKBarcodeFormatQR',
            message: pass.id,
            messageEncoding: 'iso-8859-1',
        })

        // Add fallback icon
        const fallbackIcon = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
            'base64'
        )
        pkPass.addBuffer('icon.png', fallbackIcon)
        pkPass.addBuffer('icon@2x.png', fallbackIcon)
        pkPass.addBuffer('logo.png', fallbackIcon)
        pkPass.addBuffer('logo@2x.png', fallbackIcon)

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
