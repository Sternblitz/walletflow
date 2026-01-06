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
        baseUrl,
        locations
    }: {
        draft: WalletPassDraft
        certs: any
        serialNumber: string
        authToken: string
        state: any
        baseUrl?: string
        locations?: Array<{ latitude: number; longitude: number; relevantText?: string }>
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
                organizationName: draft.content.organizationName || 'QARD',
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

        // Debug: Log colors being applied to pass
        console.log('[PassFactory] Colors applied:', {
            backgroundColor: draft.colors.backgroundColor,
            foregroundColor: draft.colors.foregroundColor,
            labelColor: draft.colors.labelColor,
            pkPassBg: (pkPass as any).backgroundColor,
            pkPassFg: (pkPass as any).foregroundColor
        })

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

                // Card/Customer Number: Use unique customer_number from state, or fallback to serial
                if (f.key === 'card' || f.key === 'id') {
                    processed.value = state.customer_number || serialNumber.slice(-4).toUpperCase()
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

                // Reward Field - Dynamic based on stamp status
                if (f.key === 'reward' && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10
                    if (current >= max) {
                        processed.value = '🎉 PRÄMIE EINLÖSBAR!'
                    }
                    // Otherwise keep original value (e.g., "Gratis Kaffee")
                }

                // Stamps (Visual/Emoji)
                if ((f.key === 'progress_visual' || f.key === 'progress' || f.key === 'visual') && state.stamps !== undefined) {
                    const current = state.stamps || 0
                    const max = state.max_stamps || 10

                    // ICON STRATEGY (Priority Order):
                    // 1. draft.stampConfig.icon (NEW - from updated FieldsEditor)
                    // 2. Persisted Icon in State (set at creation)
                    // 3. Extract from existing value (Legacy)
                    // 4. Default Fallback

                    let icon = draft.stampConfig?.icon

                    if (!icon) icon = state.stamp_icon

                    if (!icon) {
                        // Attempt extraction from current field string (e.g. "🟢 🟢 ⚪")
                        const val = String(f.value || '')
                        const match = val.match(/(?!⚪)[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu)
                        if (match && match.length > 0) {
                            icon = match[0]
                        }
                    }

                    // Fallback - use inactiveIcon from config or default
                    const activeIcon = icon || '☕️'
                    const emptyIcon = draft.stampConfig?.inactiveIcon || '⚪'

                    processed.value = (activeIcon + ' ').repeat(current) + (emptyIcon + ' ').repeat(Math.max(0, max - current)).trim()
                }

                // Build field object with optional changeMessage for visible notifications
                const fieldResult: any = {
                    key: processed.key,
                    label: processed.label,
                    value: processed.value,
                    ...(processed.textAlignment && { textAlignment: processed.textAlignment })
                }

                // Add changeMessage for stamp-related fields to trigger visible iOS notifications
                if (processed.key === 'stamps' || processed.key === 'balance') {
                    fieldResult.changeMessage = '🎉 Neuer Stempel! Jetzt %@'
                }
                if (processed.key === 'progress_visual' || processed.key === 'progress') {
                    fieldResult.changeMessage = 'Dein Fortschritt wurde aktualisiert!'
                }
                if (processed.key === 'reward') {
                    fieldResult.changeMessage = '%@'
                }
                if (processed.key === 'points') {
                    fieldResult.changeMessage = 'Du hast jetzt %@ Punkte!'
                }

                return fieldResult
            })
        }

        // Apply fields to pass
        const headerFields = processFields(draft.fields.headerFields)
        headerFields.forEach(f => pkPass.headerFields.push(f))

        // Always add Customer Number to header (Top Right)
        // User Request: "oben rechts soll bei der apple karte immer die mitgliednummer stehen"
        if (!headerFields.some(f => f.key === 'customerNumber')) {
            pkPass.headerFields.push({
                key: 'customerNumber',
                label: 'Kunde',
                value: state.customer_number || serialNumber.slice(0, 8),
                textAlignment: 'PKTextAlignmentRight'
            })
        }

        // Check if this is a redeemed single-use voucher
        if (state.redeemed === true) {
            // Override primary field to show EINGELÖST
            pkPass.primaryFields.push({
                key: 'status',
                label: 'STATUS',
                value: '✅ EINGELÖST',
                changeMessage: 'Gutschein wurde eingelöst!'
            })

            // Add redemption info to secondary fields
            const redeemDate = state.redeemed_at
                ? new Date(state.redeemed_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'Heute'
            pkPass.secondaryFields.push({
                key: 'redeemed_date',
                label: 'Eingelöst am',
                value: redeemDate
            })
            pkPass.secondaryFields.push({
                key: 'voucher_status',
                label: 'GUTSCHEIN',
                value: 'Wurde erfolgreich eingelöst'
            })
        } else {
            // Normal field processing
            processFields(draft.fields.primaryFields).forEach(f => pkPass.primaryFields.push(f))
            processFields(draft.fields.secondaryFields).forEach(f => pkPass.secondaryFields.push(f))
        }
        processFields(draft.fields.auxiliaryFields).forEach(f => pkPass.auxiliaryFields.push(f))
        processFields(draft.fields.backFields).forEach(f => pkPass.backFields.push(f))

        // Add notification message field to back (for push messaging)
        if (state.notification_message) {
            pkPass.backFields.push({
                key: 'news',
                label: 'AKTUELLE NEWS',
                value: state.notification_message,
                changeMessage: '%@'  // Shows the message in notification
            })
        }

        // 3. Images
        await this.loadImages(pkPass, draft.images)

        // 4. Barcode
        const barcodeMessage = state.id || serialNumber // Use ID for scanning if available
        pkPass.setBarcodes({
            format: draft.barcode.format || 'PKBarcodeFormatQR',
            message: barcodeMessage,
            messageEncoding: 'iso-8859-1',
        })

        // 5. Locations for GPS-based lockscreen notifications
        if (locations && locations.length > 0) {
            console.log(`[PassFactory] Adding ${locations.length} locations for GPS notifications`)
            pkPass.setLocations(...locations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                ...(loc.relevantText && { relevantText: loc.relevantText })
            })))
        } else if (draft.relevance?.locations && draft.relevance.locations.length > 0) {
            // Fallback to draft.relevance.locations if available
            console.log(`[PassFactory] Adding ${draft.relevance.locations.length} locations from draft.relevance`)
            pkPass.setLocations(...draft.relevance.locations.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
                ...(loc.relevantText && { relevantText: loc.relevantText })
            })))
        }

        return pkPass
    }

    private static async loadImages(pkPass: PKPass, images: any) {
        if (!images) return

        // If no icon is provided but logo exists, use logo as icon (for notifications)
        if (!images.icon && images.logo) {
            console.log('[PassFactory] Using logo as icon for notifications')
            images.icon = images.logo
        }

        // Fallback icon only if neither icon nor logo exists
        if (!images.icon) {
            // Create a simple colored icon instead of transparent pixel
            // This is a minimal 29x29 gray square as base64 PNG
            const fallback = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAOklEQVRIiWNgGAWjYBSMglEwCkYBNQDj//8M/6kBGP//Z2CkFhgFo2AUjIJRMApGwSgYBaNgKAEALwcEHQrqpIIAAAAASUVORK5CYII=', 'base64')
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
