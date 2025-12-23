import { PKPass } from "passkit-generator"
import { WalletPassDraft, PassField } from "@/lib/wallet/types"
import * as fs from "fs"

export class PassFactory {
    static async createPass({
        draft,
        certs,
        serialNumber,
        authToken,
        state,
        baseUrl
    }: {
        draft: WalletPassDraft
        certs: any
        serialNumber: string
        authToken: string
        state: any
        baseUrl?: string
    }): Promise<PKPass> {

        // 1. Initialize PKPass
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
                formatVersion: 1,
                // Colors
                backgroundColor: draft.colors.backgroundColor,
                foregroundColor: draft.colors.foregroundColor,
                labelColor: draft.colors.labelColor,
                // Logo Text Logic
                ...(!draft.content.hideLogoText && (draft.content.logoText || draft.content.organizationName)
                    ? { logoText: draft.content.logoText || draft.content.organizationName }
                    : {}
                ),
                // Web Service URL for Updates
                ...(baseUrl && baseUrl.startsWith('https') ? {
                    webServiceURL: baseUrl + '/api',
                    authenticationToken: authToken
                } : {})
            } as any
        )

        /* 
        // Removed: setAuthToken/setWebServiceURL methods do not exist on PKPass
        // Handled in constructor above
        */

        pkPass.type = draft.meta.style || 'storeCard'

        // 2. Process Fields
        const processFields = (fields: PassField[] | undefined) => {
            if (!fields) return []
            return fields.map(f => {
                const processed = { ...f, value: String(f.value || '') }

                // --- DYNAMIC FIELD LOGIC ---

                // Card Number: Calculated from Serial
                if (f.key === 'card') {
                    processed.value = serialNumber.slice(-4).toUpperCase()
                }

                // Points / Tier
                if (f.key === 'points' && state.points !== undefined) processed.value = String(state.points)
                if (f.key === 'tier' && state.tier !== undefined) processed.value = state.tier.toUpperCase()

                // Stamps (Text)
                if ((f.key === 'stamps' || f.key === 'balance') && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10
                    processed.value = `${current} von ${max}`
                }

                // Stamps (Visual/Emoji)
                if ((f.key === 'progress_visual' || f.key === 'progress' || f.key === 'visual') && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10

                    // ICON STRATEGY:
                    // 1. Persisted Icon in State (Highest Priority - set at creation)
                    // 2. Default Fallback
                    const icon = state.stamp_icon || '☕️'
                    const emptyIcon = '⚪'

                    processed.value = (icon + ' ').repeat(current) + (emptyIcon + ' ').repeat(Math.max(0, max - current)).trim()
                }

                return {
                    key: processed.key,
                    label: processed.label,
                    value: processed.value,
                    ...(processed.textAlignment && { textAlignment: processed.textAlignment })
                }
            })
        }

        // Apply fields to pass
        processFields(draft.fields.headerFields).forEach(f => pkPass.headerFields.push(f))
        processFields(draft.fields.primaryFields).forEach(f => pkPass.primaryFields.push(f))
        processFields(draft.fields.secondaryFields).forEach(f => pkPass.secondaryFields.push(f))
        processFields(draft.fields.auxiliaryFields).forEach(f => pkPass.auxiliaryFields.push(f))
        processFields(draft.fields.backFields).forEach(f => pkPass.backFields.push(f))

        // 3. Images
        await this.loadImages(pkPass, draft.images)

        // 4. Barcode
        const barcodeMessage = state.id || serialNumber // Use ID for scanning if available
        pkPass.setBarcodes({
            format: draft.barcode.format || 'PKBarcodeFormatQR',
            message: barcodeMessage,
            messageEncoding: 'iso-8859-1',
        })

        return pkPass
    }

    private static async loadImages(pkPass: PKPass, images: any) {
        if (!images) return

        // Always add fallback icon if missing
        if (!images.icon) {
            const fallback = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64')
            pkPass.addBuffer('icon.png', fallback)
            pkPass.addBuffer('icon@2x.png', fallback)
        }

        for (const [key, value] of Object.entries(images) as [string, any][]) {
            try {
                let buffer: Buffer | null = null

                // Case A: HTTP URL (Supabase)
                if (typeof value === 'object' && value.url?.startsWith('http')) {
                    const res = await fetch(value.url)
                    if (res.ok) buffer = Buffer.from(await res.arrayBuffer())
                }
                // Case B: Data URL (Base64) - Object
                else if (typeof value === 'object' && value.url?.startsWith('data:')) {
                    buffer = Buffer.from(value.url.split(',')[1], 'base64')
                }
                // Case C: Data URL (Base64) - String (Legacy)
                else if (typeof value === 'string' && value.startsWith('data:')) {
                    buffer = Buffer.from(value.split(',')[1], 'base64')
                }
                // Case D: HTTP URL - String (Legacy)
                else if (typeof value === 'string' && value.startsWith('http')) {
                    const res = await fetch(value)
                    if (res.ok) buffer = Buffer.from(await res.arrayBuffer())
                }

                if (buffer) {
                    pkPass.addBuffer(`${key}.png`, buffer)
                    pkPass.addBuffer(`${key}@2x.png`, buffer)
                }
            } catch (e) {
                console.error(`[PassFactory] Failed to load image ${key}:`, e)
            }
        }
    }
}
