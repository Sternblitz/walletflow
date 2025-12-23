/**
 * Apple Wallet Pass Types
 * Based on Apple PassKit Documentation
 * https://developer.apple.com/documentation/walletpasses
 */

// ============================================
// LEGACY TYPES (for backwards compatibility)
// ============================================

export interface UniversalPassConfig {
    serialNumber: string
    logoText: string
    backgroundColor: string
    labelColor: string
    foregroundColor: string
    headerLabel: string
    headerValue: string
    primaryLabel: string
    primaryValue: string
    secondaryFields?: Array<{ label: string; value: string }>
    auxiliaryFields?: Array<{ label: string; value: string }>
    backFields?: Array<{ label: string; value: string }>
    barcodeValue: string
    authToken?: string
    iconBuffer?: Buffer
    stripBuffer?: Buffer
}

export interface WalletService {
    generatePass(config: UniversalPassConfig): Promise<Buffer>
}

export type PassConcept = 'STAMP_CARD' | 'VIP_CLUB'

// ============================================
// NEW SLOT-BASED TYPES
// ============================================

// Pass Styles
export type PassStyle = 'storeCard' | 'coupon' | 'generic' | 'eventTicket' | 'boardingPass'

// Barcode Formats
export type BarcodeFormat =
    | 'PKBarcodeFormatQR'
    | 'PKBarcodeFormatPDF417'
    | 'PKBarcodeFormatAztec'
    | 'PKBarcodeFormatCode128'

export const SQUARE_BARCODE_FORMATS: BarcodeFormat[] = [
    'PKBarcodeFormatQR',
    'PKBarcodeFormatAztec'
]

export interface Barcode {
    format: BarcodeFormat
    message: string
    messageEncoding?: string
    altText?: string
}

// Text Alignment
export type TextAlignment = 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight' | 'PKTextAlignmentNatural'

// Pass Field
export interface PassField {
    key: string
    label: string
    value: string | number
    textAlignment?: TextAlignment
    dateStyle?: 'PKDateStyleNone' | 'PKDateStyleShort' | 'PKDateStyleMedium' | 'PKDateStyleLong' | 'PKDateStyleFull'
    timeStyle?: 'PKDateStyleNone' | 'PKDateStyleShort' | 'PKDateStyleMedium' | 'PKDateStyleLong' | 'PKDateStyleFull'
    currencyCode?: string
    numberStyle?: 'PKNumberStyleDecimal' | 'PKNumberStylePercent' | 'PKNumberStyleScientific' | 'PKNumberStyleSpellOut'
}

// Image Slots
export type ImageSlot = 'logo' | 'icon' | 'strip' | 'thumbnail' | 'background' | 'footer'

export interface ImageAsset {
    url: string
    fileName?: string
    cropData?: { x: number; y: number; width: number; height: number }
}

// ============================================
// WALLET PASS DRAFT (Editor State)
// ============================================

export interface WalletPassDraft {
    meta: {
        style: PassStyle
        templateId?: string
        passTypeIdentifier?: string
        teamIdentifier?: string
    }
    colors: {
        backgroundColor: string
        foregroundColor: string
        labelColor: string
    }
    images: Partial<Record<ImageSlot, ImageAsset>>
    fields: {
        headerFields: PassField[]
        primaryFields: PassField[]
        secondaryFields: PassField[]
        auxiliaryFields: PassField[]
        backFields: PassField[]
    }
    barcode: Barcode
    content: {
        logoText?: string
        hideLogoText?: boolean
        description: string
        organizationName: string
    }
    relevance?: {
        locations?: Array<{ latitude: number; longitude: number; relevantText?: string }>
        relevantDate?: string
        maxDistance?: number
    }
    webService?: {
        authenticationToken?: string
        webServiceURL?: string
    }
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationError {
    field: string
    message: string
    severity: 'error' | 'warning'
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
    warnings: ValidationError[]
}

// ============================================
// LAYOUT DEFINITION
// ============================================

export interface FieldLimits {
    headerFields: number
    primaryFields: number
    secondaryFields: number
    auxiliaryFields: number
    backFields: number // -1 = unlimited
}

export interface LayoutDefinition {
    style: PassStyle
    displayName: string
    description: string
    allowedImages: ImageSlot[]
    fieldLimits: FieldLimits
    rules: {
        squareBarcodeReducesFields?: boolean
        stripBlocksBackgroundAndThumbnail?: boolean
    }
    imageSizes: Partial<Record<ImageSlot, { width: number; height: number }>>
}

// ============================================
// TEMPLATE
// ============================================

export interface PassTemplate {
    id: string
    name: string
    description: string
    style: PassStyle
    preview?: string
    defaultDraft: Partial<WalletPassDraft>
}

// ============================================
// HELPERS
// ============================================

export function isSquareBarcode(format: BarcodeFormat): boolean {
    return SQUARE_BARCODE_FORMATS.includes(format)
}

export function createEmptyField(key?: string): PassField {
    return { key: key || `field_${Date.now()}`, label: '', value: '' }
}

export function createDefaultDraft(style: PassStyle): WalletPassDraft {
    return {
        meta: { style },
        colors: { backgroundColor: '#1A1A1A', foregroundColor: '#FFFFFF', labelColor: '#999999' },
        images: {},
        fields: { headerFields: [], primaryFields: [], secondaryFields: [], auxiliaryFields: [], backFields: [] },
        barcode: { format: 'PKBarcodeFormatQR', message: '', messageEncoding: 'iso-8859-1' },
        content: { logoText: '', description: '', organizationName: '' }
    }
}
