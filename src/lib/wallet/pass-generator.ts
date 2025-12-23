/**
 * Pass Generator
 * 
 * Converts a WalletPassDraft into a valid Apple pass.json structure
 * and generates the signed .pkpass file.
 */

import { WalletPassDraft, PassField, PassStyle } from './types'
import { validateDraft } from './validator'
import { PKPass } from 'passkit-generator'
import { loadAppleCerts } from './apple'
import { randomUUID } from 'crypto'

// ============================================
// PASS.JSON STRUCTURE
// ============================================

interface PassJSON {
    formatVersion: 1
    passTypeIdentifier: string
    teamIdentifier: string
    serialNumber: string
    organizationName: string
    description: string

    // Colors
    backgroundColor?: string
    foregroundColor?: string
    labelColor?: string

    // Barcode
    barcodes?: Array<{
        format: string
        message: string
        messageEncoding: string
        altText?: string
    }>
    barcode?: {
        format: string
        message: string
        messageEncoding: string
        altText?: string
    }

    // Logo text
    logoText?: string

    // Style-specific structure
    storeCard?: PassStructure
    coupon?: PassStructure
    generic?: PassStructure
    eventTicket?: PassStructure
    boardingPass?: PassStructure & { transitType: string }

    // Web service (for updates)
    webServiceURL?: string
    authenticationToken?: string

    // Relevance
    locations?: Array<{ latitude: number; longitude: number; relevantText?: string }>
    relevantDate?: string
    maxDistance?: number
}

interface PassStructure {
    headerFields?: PassFieldJSON[]
    primaryFields?: PassFieldJSON[]
    secondaryFields?: PassFieldJSON[]
    auxiliaryFields?: PassFieldJSON[]
    backFields?: PassFieldJSON[]
}

interface PassFieldJSON {
    key: string
    label: string
    value: string | number
    textAlignment?: string
    dateStyle?: string
    timeStyle?: string
    currencyCode?: string
    numberStyle?: string
}

// ============================================
// CONVERT DRAFT TO PASS.JSON
// ============================================

export function draftToPassJSON(
    draft: WalletPassDraft,
    options: {
        passTypeIdentifier: string
        teamIdentifier: string
        serialNumber?: string
        webServiceURL?: string
        authenticationToken?: string
    }
): PassJSON {
    // Validate first
    const validation = validateDraft(draft)
    if (!validation.valid) {
        throw new Error(`Invalid draft: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const { colors, fields, barcode, content, relevance } = draft

    // Convert fields
    const convertFields = (fieldArray: PassField[]): PassFieldJSON[] =>
        fieldArray.map(f => ({
            key: f.key,
            label: f.label,
            value: f.value,
            ...(f.textAlignment && { textAlignment: f.textAlignment }),
            ...(f.dateStyle && { dateStyle: f.dateStyle }),
            ...(f.timeStyle && { timeStyle: f.timeStyle }),
            ...(f.currencyCode && { currencyCode: f.currencyCode }),
            ...(f.numberStyle && { numberStyle: f.numberStyle })
        }))

    // Build pass structure
    const passStructure: PassStructure = {
        ...(fields.headerFields.length > 0 && { headerFields: convertFields(fields.headerFields) }),
        ...(fields.primaryFields.length > 0 && { primaryFields: convertFields(fields.primaryFields) }),
        ...(fields.secondaryFields.length > 0 && { secondaryFields: convertFields(fields.secondaryFields) }),
        ...(fields.auxiliaryFields.length > 0 && { auxiliaryFields: convertFields(fields.auxiliaryFields) }),
        ...(fields.backFields.length > 0 && { backFields: convertFields(fields.backFields) })
    }

    // Build barcode
    const barcodeObj = {
        format: barcode.format,
        message: barcode.message || options.serialNumber || randomUUID(),
        messageEncoding: barcode.messageEncoding || 'iso-8859-1',
        ...(barcode.altText && { altText: barcode.altText })
    }

    // Build pass.json
    const passJSON: PassJSON = {
        formatVersion: 1,
        passTypeIdentifier: options.passTypeIdentifier,
        teamIdentifier: options.teamIdentifier,
        serialNumber: options.serialNumber || randomUUID(),
        organizationName: content.organizationName || 'Unknown',
        description: content.description,

        // Colors (convert to rgb format for Apple)
        backgroundColor: colors.backgroundColor,
        foregroundColor: colors.foregroundColor,
        labelColor: colors.labelColor,

        // Barcode (both legacy and new format)
        barcodes: [barcodeObj],
        barcode: barcodeObj,

        // Logo text
        ...(content.logoText && { logoText: content.logoText }),

        // Style-specific structure
        [draft.meta.style]: draft.meta.style === 'boardingPass'
            ? { ...passStructure, transitType: 'PKTransitTypeAir' }
            : passStructure,

        // Web service for updates
        ...(options.webServiceURL && { webServiceURL: options.webServiceURL }),
        ...(options.authenticationToken && { authenticationToken: options.authenticationToken }),

        // Relevance
        ...(relevance?.locations && { locations: relevance.locations }),
        ...(relevance?.relevantDate && { relevantDate: relevance.relevantDate }),
        ...(relevance?.maxDistance && { maxDistance: relevance.maxDistance })
    }

    return passJSON
}

// ============================================
// GENERATE SIGNED .PKPASS
// ============================================

export interface GeneratePassOptions {
    draft: WalletPassDraft
    passTypeIdentifier: string
    teamIdentifier: string
    serialNumber?: string
    webServiceURL?: string
    authenticationToken?: string
    images?: {
        icon?: Buffer
        logo?: Buffer
        strip?: Buffer
        thumbnail?: Buffer
        background?: Buffer
        footer?: Buffer
    }
}

export async function generateSignedPass(options: GeneratePassOptions): Promise<Buffer> {
    const { draft, images, ...passOptions } = options

    // Get certificates
    const certs = loadAppleCerts()

    // Convert draft to pass.json
    const passJSON = draftToPassJSON(draft, passOptions)

    // Create PKPass
    const pass = new PKPass(
        {},
        {
            wwdr: certs.wwdr,
            signerCert: certs.signerCert,
            signerKey: certs.signerKey,
            signerKeyPassphrase: certs.signerKeyPassphrase
        },
        passJSON as unknown as Record<string, unknown>
    )

    // Add required icon (mandatory)
    if (images?.icon) {
        pass.addBuffer('icon.png', images.icon)
        pass.addBuffer('icon@2x.png', images.icon)
    } else {
        // Generate a minimal icon if none provided
        const minimalIcon = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        )
        pass.addBuffer('icon.png', minimalIcon)
        pass.addBuffer('icon@2x.png', minimalIcon)
    }

    // Add optional images
    if (images?.logo) {
        pass.addBuffer('logo.png', images.logo)
        pass.addBuffer('logo@2x.png', images.logo)
    }

    if (images?.strip) {
        pass.addBuffer('strip.png', images.strip)
        pass.addBuffer('strip@2x.png', images.strip)
    }

    if (images?.thumbnail) {
        pass.addBuffer('thumbnail.png', images.thumbnail)
        pass.addBuffer('thumbnail@2x.png', images.thumbnail)
    }

    if (images?.background) {
        pass.addBuffer('background.png', images.background)
        pass.addBuffer('background@2x.png', images.background)
    }

    if (images?.footer) {
        pass.addBuffer('footer.png', images.footer)
        pass.addBuffer('footer@2x.png', images.footer)
    }

    // Generate signed buffer
    const buffer = pass.getAsBuffer()
    return buffer
}
