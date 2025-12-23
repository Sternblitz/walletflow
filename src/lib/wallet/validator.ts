/**
 * Apple Wallet Pass Validator
 * 
 * Enforces all Apple PassKit rules:
 * - Field limits per style
 * - Image slot restrictions
 * - Square barcode rules
 * - EventTicket strip rule
 * - Text length warnings
 */

import {
    WalletPassDraft,
    ValidationResult,
    ValidationError,
    PassField,
    isSquareBarcode
} from './types'
import { LAYOUT_DEFINITIONS, getLayoutDefinition } from './layout-definitions'

// ============================================
// MAIN VALIDATOR
// ============================================

export function validateDraft(draft: WalletPassDraft): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    const def = getLayoutDefinition(draft.meta.style)
    const hasSquareBarcode = isSquareBarcode(draft.barcode.format)

    // 1. Validate Field Limits
    validateFieldLimits(draft, def, hasSquareBarcode, errors)

    // 2. Validate Image Slots
    validateImageSlots(draft, def, errors)

    // 3. EventTicket Strip Rule
    if (def.rules.stripBlocksBackgroundAndThumbnail && draft.images.strip) {
        if (draft.images.background) {
            errors.push({
                field: 'images.background',
                message: 'Bei eventTicket mit Strip ist kein Background erlaubt',
                severity: 'error'
            })
        }
        if (draft.images.thumbnail) {
            errors.push({
                field: 'images.thumbnail',
                message: 'Bei eventTicket mit Strip ist kein Thumbnail erlaubt',
                severity: 'error'
            })
        }
    }

    // 4. Required Fields
    validateRequiredFields(draft, errors)

    // 5. Text Length Warnings
    validateTextLengths(draft, warnings)

    // 6. Barcode Validation
    if (!draft.barcode.message) {
        warnings.push({
            field: 'barcode.message',
            message: 'Barcode-Nachricht ist leer',
            severity: 'warning'
        })
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    }
}

// ============================================
// FIELD LIMIT VALIDATION
// ============================================

function validateFieldLimits(
    draft: WalletPassDraft,
    def: ReturnType<typeof getLayoutDefinition>,
    hasSquareBarcode: boolean,
    errors: ValidationError[]
) {
    const { fields } = draft
    const { fieldLimits, rules } = def

    // Header Fields
    if (fields.headerFields.length > fieldLimits.headerFields) {
        errors.push({
            field: 'fields.headerFields',
            message: `Max ${fieldLimits.headerFields} Header-Felder erlaubt`,
            severity: 'error'
        })
    }

    // Primary Fields
    if (fields.primaryFields.length > fieldLimits.primaryFields) {
        errors.push({
            field: 'fields.primaryFields',
            message: `Max ${fieldLimits.primaryFields} Primary-Feld(er) erlaubt`,
            severity: 'error'
        })
    }

    // Secondary + Auxiliary (with square barcode rule)
    if (rules.squareBarcodeReducesFields && hasSquareBarcode) {
        const combined = fields.secondaryFields.length + fields.auxiliaryFields.length
        if (combined > 4) {
            errors.push({
                field: 'fields.secondaryFields',
                message: 'Bei QR-Code: Secondary + Auxiliary zusammen max 4',
                severity: 'error'
            })
        }
    } else {
        if (fields.secondaryFields.length > fieldLimits.secondaryFields) {
            errors.push({
                field: 'fields.secondaryFields',
                message: `Max ${fieldLimits.secondaryFields} Secondary-Felder erlaubt`,
                severity: 'error'
            })
        }
        if (fields.auxiliaryFields.length > fieldLimits.auxiliaryFields) {
            errors.push({
                field: 'fields.auxiliaryFields',
                message: `Max ${fieldLimits.auxiliaryFields} Auxiliary-Felder erlaubt`,
                severity: 'error'
            })
        }
    }
}

// ============================================
// IMAGE SLOT VALIDATION
// ============================================

function validateImageSlots(
    draft: WalletPassDraft,
    def: ReturnType<typeof getLayoutDefinition>,
    errors: ValidationError[]
) {
    const usedSlots = Object.keys(draft.images) as Array<keyof typeof draft.images>

    for (const slot of usedSlots) {
        if (draft.images[slot] && !def.allowedImages.includes(slot)) {
            errors.push({
                field: `images.${slot}`,
                message: `${slot} ist für ${def.displayName} nicht erlaubt`,
                severity: 'error'
            })
        }
    }
}

// ============================================
// REQUIRED FIELDS VALIDATION
// ============================================

function validateRequiredFields(
    draft: WalletPassDraft,
    errors: ValidationError[]
) {
    // Description is required
    if (!draft.content.description?.trim()) {
        errors.push({
            field: 'content.description',
            message: 'Beschreibung ist erforderlich',
            severity: 'error'
        })
    }

    // Organization name recommended
    if (!draft.content.organizationName?.trim()) {
        // This is a warning, not error
    }
}

// ============================================
// TEXT LENGTH VALIDATION
// ============================================

const TEXT_LENGTH_LIMITS = {
    headerValue: 10,
    primaryValue: 20,
    secondaryValue: 25,
    auxiliaryValue: 25,
    logoText: 20
}

function validateTextLengths(
    draft: WalletPassDraft,
    warnings: ValidationError[]
) {
    // Primary fields - very limited space
    draft.fields.primaryFields.forEach((field, i) => {
        if (String(field.value).length > TEXT_LENGTH_LIMITS.primaryValue) {
            warnings.push({
                field: `fields.primaryFields[${i}]`,
                message: `Primary-Wert "${field.value}" könnte abgeschnitten werden`,
                severity: 'warning'
            })
        }
    })

    // Header fields
    draft.fields.headerFields.forEach((field, i) => {
        if (String(field.value).length > TEXT_LENGTH_LIMITS.headerValue) {
            warnings.push({
                field: `fields.headerFields[${i}]`,
                message: `Header-Wert "${field.value}" könnte abgeschnitten werden`,
                severity: 'warning'
            })
        }
    })

    // Logo text
    if (draft.content.logoText && draft.content.logoText.length > TEXT_LENGTH_LIMITS.logoText) {
        warnings.push({
            field: 'content.logoText',
            message: 'Logo-Text könnte abgeschnitten werden',
            severity: 'warning'
        })
    }
}

// ============================================
// HELPER: Check if draft can add more fields
// ============================================

export function canAddField(
    draft: WalletPassDraft,
    fieldType: keyof WalletPassDraft['fields']
): boolean {
    const def = getLayoutDefinition(draft.meta.style)
    const hasSquareBarcode = isSquareBarcode(draft.barcode.format)
    const currentCount = draft.fields[fieldType].length

    // Unlimited back fields
    if (fieldType === 'backFields') return true

    // Check standard limit
    const limit = def.fieldLimits[fieldType]
    if (currentCount >= limit) return false

    // Check square barcode combined limit
    if (def.rules.squareBarcodeReducesFields && hasSquareBarcode) {
        if (fieldType === 'secondaryFields' || fieldType === 'auxiliaryFields') {
            const combined = draft.fields.secondaryFields.length + draft.fields.auxiliaryFields.length
            if (combined >= 4) return false
        }
    }

    return true
}

// ============================================
// HELPER: Get remaining field count
// ============================================

export function getRemainingFieldCount(
    draft: WalletPassDraft,
    fieldType: keyof WalletPassDraft['fields']
): number {
    const def = getLayoutDefinition(draft.meta.style)
    const hasSquareBarcode = isSquareBarcode(draft.barcode.format)
    const currentCount = draft.fields[fieldType].length

    if (fieldType === 'backFields') return Infinity

    let limit = def.fieldLimits[fieldType]

    // Square barcode combined limit
    if (def.rules.squareBarcodeReducesFields && hasSquareBarcode) {
        if (fieldType === 'secondaryFields' || fieldType === 'auxiliaryFields') {
            const combined = draft.fields.secondaryFields.length + draft.fields.auxiliaryFields.length
            return Math.max(0, 4 - combined)
        }
    }

    return Math.max(0, limit - currentCount)
}

// ============================================
// QUICK VALIDATION (for UI)
// ============================================

export function isValidDraft(draft: WalletPassDraft): boolean {
    return validateDraft(draft).valid
}
