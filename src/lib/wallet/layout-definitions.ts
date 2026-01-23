/**
 * Apple Wallet Layout Definitions
 * 
 * Defines the rules for each pass style and 3 simple templates:
 * - Stempelkarte
 * - Mitgliederkarte  
 * - Gutschein
 */

import { LayoutDefinition, PassStyle, ImageSlot, PassTemplate, WalletPassDraft } from './types'

// ============================================
// LAYOUT DEFINITIONS PER STYLE
// ============================================

export const LAYOUT_DEFINITIONS: Record<PassStyle, LayoutDefinition> = {
    storeCard: {
        style: 'storeCard',
        displayName: 'Kundenkarte',
        description: 'Stempelkarten, Bonuskarten, Treuekarten',
        allowedImages: ['logo', 'icon', 'strip'],
        fieldLimits: {
            headerFields: 3,
            primaryFields: 1,
            secondaryFields: 4,
            auxiliaryFields: 4,
            backFields: -1
        },
        rules: { squareBarcodeReducesFields: true },
        imageSizes: {
            logo: { width: 160, height: 50 },
            icon: { width: 29, height: 29 },
            strip: { width: 375, height: 144 }
        }
    },

    coupon: {
        style: 'coupon',
        displayName: 'Gutschein',
        description: 'Rabatte, Coupons, Angebote',
        allowedImages: ['logo', 'icon', 'strip'],
        fieldLimits: {
            headerFields: 3,
            primaryFields: 1,
            secondaryFields: 4,
            auxiliaryFields: 4,
            backFields: -1
        },
        rules: { squareBarcodeReducesFields: true },
        imageSizes: {
            logo: { width: 160, height: 50 },
            icon: { width: 29, height: 29 },
            strip: { width: 375, height: 144 }
        }
    },

    generic: {
        style: 'generic',
        displayName: 'Mitgliedschaft',
        description: 'VIP-Karten, Mitgliedsausweise, Club-Karten',
        allowedImages: ['logo', 'icon', 'thumbnail'],
        fieldLimits: {
            headerFields: 3,
            primaryFields: 1,
            secondaryFields: 4,
            auxiliaryFields: 4,
            backFields: -1
        },
        rules: { squareBarcodeReducesFields: true },
        imageSizes: {
            logo: { width: 160, height: 50 },
            icon: { width: 29, height: 29 },
            thumbnail: { width: 90, height: 90 }
        }
    },

    eventTicket: {
        style: 'eventTicket',
        displayName: 'Event-Ticket',
        description: 'Konzerte, Events, Kino',
        allowedImages: ['logo', 'icon', 'strip', 'thumbnail', 'background'],
        fieldLimits: {
            headerFields: 3,
            primaryFields: 1,
            secondaryFields: 4,
            auxiliaryFields: 4,
            backFields: -1
        },
        rules: { stripBlocksBackgroundAndThumbnail: true },
        imageSizes: {
            logo: { width: 160, height: 50 },
            icon: { width: 29, height: 29 },
            strip: { width: 375, height: 98 },
            thumbnail: { width: 90, height: 90 },
            background: { width: 180, height: 220 }
        }
    },

    boardingPass: {
        style: 'boardingPass',
        displayName: 'Boarding Pass',
        description: 'Flüge, Züge, Transit',
        allowedImages: ['logo', 'icon', 'footer'],
        fieldLimits: {
            headerFields: 2,
            primaryFields: 2,
            secondaryFields: 5,
            auxiliaryFields: 5,
            backFields: -1
        },
        rules: {},
        imageSizes: {
            logo: { width: 160, height: 50 },
            icon: { width: 29, height: 29 },
            footer: { width: 286, height: 15 }
        }
    }
}

// ============================================
// 3 SIMPLE TEMPLATES
// ============================================

export const PASS_TEMPLATES: PassTemplate[] = [
    // ============================================
    // 1. STEMPELKARTE
    // ============================================
    {
        id: 'stempelkarte',
        name: 'Stempelkarte',
        description: 'Klassische Stempelkarte - 10 Stempel sammeln',
        style: 'storeCard',
        defaultDraft: {
            colors: {
                backgroundColor: '#0F0F0F',
                foregroundColor: '#FFFFFF',
                labelColor: '#22C55E'
            },
            fields: {
                // Header: Card number right side
                headerFields: [],
                // Primary: "0 von 10" displayed BIG
                primaryFields: [{ key: 'stamps', label: 'DEINE STEMPEL', value: '0 von 10' }],
                // Secondary: Reward info
                secondaryFields: [{ key: 'reward', label: 'PRÄMIE', value: 'Gratis Kaffee' }],
                // Auxiliary: Powered by (at bottom)
                auxiliaryFields: [{ key: 'powered', label: 'POWERED BY', value: 'QARD' }],
                backFields: [
                    { key: 'howto', label: 'SO FUNKTIONIERT\'S', value: 'Bei jedem Besuch den QR-Code scannen lassen. Nach 10 Stempeln erhältst du deinen Gratis Kaffee!' }
                ]
            },
            barcode: { format: 'PKBarcodeFormatQR', message: '', messageEncoding: 'iso-8859-1' },
            content: { description: 'Digitale Stempelkarte', organizationName: '' }
        }
    },

    // ============================================
    // 1b. STEMPELKARTE 2.0 (EVENT STYLE)
    // ============================================
    {
        id: 'stempelkarte_v2',
        name: 'Stempelkarte 2.0',
        description: 'Modernes Design mit Hintergrundbild (Event Ticket Style)',
        style: 'eventTicket',
        defaultDraft: {
            colors: {
                backgroundColor: '#1A1A1A',
                foregroundColor: '#FFFFFF',
                labelColor: '#FFD700'
            },
            fields: {
                // Event Ticket has different layout.
                // Header: Logo Text usually visible. Added Customer ID top right.
                headerFields: [],
                // Primary: Big Progress -> Now coupled with logic
                primaryFields: [{ key: 'stamps', label: 'DEINE STEMPEL', value: '0 / 10' }],
                // Secondary: Reward info only
                secondaryFields: [
                    { key: 'reward', label: 'NÄCHSTE PRÄMIE', value: 'Gratis Kaffee' }
                ],
                // Auxiliary: Bottom info + Visual Progress
                auxiliaryFields: [
                    { key: 'progress_visual', label: 'FORTSCHRITT', value: '⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪' },
                    { key: 'powered', label: 'POWERED BY', value: 'QARD' }
                ],
                backFields: []
            },
            barcode: { format: 'PKBarcodeFormatQR', message: '', messageEncoding: 'iso-8859-1' },
            content: { description: 'Premium Stempelkarte', organizationName: '' }
        }
    },

    // ============================================
    // 2. MITGLIEDERKARTE (Premium VIP Look)
    // ============================================
    {
        id: 'mitgliederkarte',
        name: 'Mitgliederkarte',
        description: 'VIP-Karte für Club, Verein oder Treue-Mitglieder',
        style: 'generic',
        defaultDraft: {
            colors: {
                backgroundColor: '#0A0A0A',
                foregroundColor: '#F5DEB3', // Wheat/Gold
                labelColor: '#D4AF37' // Gold
            },
            fields: {
                headerFields: [{ key: 'status', label: 'STATUS', value: 'MEMBER' }],
                primaryFields: [{ key: 'name', label: 'MITGLIED', value: 'Dein Name' }],
                secondaryFields: [
                    { key: 'nr', label: 'MITGLIEDS-NR', value: 'M-2024-0001' },
                    { key: 'since', label: 'DABEI SEIT', value: '2024' }
                ],
                auxiliaryFields: [{ key: 'powered', label: 'POWERED BY', value: 'QARD' }],
                backFields: [
                    { key: 'benefits', label: 'DEINE VORTEILE', value: '✓ Exklusive Rabatte\n✓ Frühzugang zu Events\n✓ Punkte sammeln' }
                ]
            },
            barcode: { format: 'PKBarcodeFormatQR', message: '', messageEncoding: 'iso-8859-1' },
            content: { description: 'Premium Mitgliederkarte', organizationName: '' }
        }
    },

    // ============================================
    // 3. GUTSCHEIN (Eye-catching coupon)
    // ============================================
    {
        id: 'gutschein',
        name: 'Gutschein',
        description: 'Rabattgutschein oder Einmalgutschein',
        style: 'coupon',
        defaultDraft: {
            colors: {
                backgroundColor: '#18181B',
                foregroundColor: '#FFFFFF',
                labelColor: '#F43F5E' // Rose/Pink
            },
            fields: {
                headerFields: [{ key: 'type', label: 'COUPON', value: '' }],
                primaryFields: [{ key: 'value', label: 'RABATT', value: '20%' }],
                secondaryFields: [
                    { key: 'valid', label: 'GÜLTIG BIS', value: '31.12.2025' },
                    { key: 'min', label: 'AB', value: '20€ MBW' }
                ],
                auxiliaryFields: [{ key: 'powered', label: 'POWERED BY', value: 'QARD' }],
                backFields: [
                    { key: 'terms', label: 'BEDINGUNGEN', value: 'Einmalig einlösbar. Nicht mit anderen Aktionen kombinierbar. Nur im Ladengeschäft gültig.' }
                ]
            },
            barcode: { format: 'PKBarcodeFormatQR', message: 'COUPON-2024', messageEncoding: 'iso-8859-1' },
            content: { description: 'Digitaler Gutschein', organizationName: '' }
        }
    },

    // ============================================
    // 4. PUNKTEKARTE (Points/Loyalty)
    // ============================================
    {
        id: 'punktekarte',
        name: 'Punktekarte',
        description: 'Punkte sammeln und einlösen',
        style: 'storeCard',
        defaultDraft: {
            colors: {
                backgroundColor: '#0F172A', // Slate dark
                foregroundColor: '#E2E8F0', // Slate light
                labelColor: '#8B5CF6' // Violet
            },
            fields: {
                headerFields: [{ key: 'level', label: 'LEVEL', value: 'Bronze' }],
                primaryFields: [{ key: 'points', label: 'PUNKTE', value: '0' }],
                secondaryFields: [
                    { key: 'next', label: 'NÄCHSTES LEVEL', value: 'Silber bei 500' },
                    { key: 'value', label: 'WERT', value: '0,00 €' }
                ],
                auxiliaryFields: [{ key: 'powered', label: 'POWERED BY', value: 'QARD' }],
                backFields: [
                    { key: 'info', label: 'PUNKTE SAMMELN', value: '1€ = 1 Punkt\n100 Punkte = 5€ Rabatt\n\nLevel:\n• Bronze: 0-499\n• Silber: 500-999\n• Gold: 1000+' }
                ]
            },
            barcode: { format: 'PKBarcodeFormatQR', message: '', messageEncoding: 'iso-8859-1' },
            content: { description: 'Punktekarte', organizationName: '' }
        }
    },

    // ============================================
    // 5. STEMPELKARTE FLEX (Generic Style - Two Row Layout)
    // ============================================
    {
        id: 'stempelkarte_flex',
        name: 'Stempelkarte Flex',
        description: 'Stempelkarte mit 2-Zeilen Layout (Thumbnail statt Strip)',
        style: 'generic',
        defaultDraft: {
            colors: {
                backgroundColor: '#0F0F0F',
                foregroundColor: '#FFFFFF',
                labelColor: '#22C55E'
            },
            fields: {
                headerFields: [],
                // Primary: Stamp counter like Stempelkarte 1.0
                primaryFields: [{ key: 'stamps', label: 'DEINE STEMPEL', value: '0 von 10' }],
                // Secondary: Reward + Visual Progress (Row 1)
                secondaryFields: [
                    { key: 'reward', label: 'PRÄMIE', value: 'Gratis Kaffee' },
                    { key: 'progress_visual', label: 'FORTSCHRITT', value: '⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪' }
                ],
                // Auxiliary: Powered by + future gift field (Row 2)
                auxiliaryFields: [{ key: 'powered', label: 'POWERED BY', value: 'QARD' }],
                backFields: [
                    { key: 'howto', label: 'SO FUNKTIONIERT\'S', value: 'Bei jedem Besuch den QR-Code scannen lassen. Nach 10 Stempeln erhältst du deinen Gratis Kaffee!' }
                ]
            },
            barcode: { format: 'PKBarcodeFormatQR', message: '', messageEncoding: 'iso-8859-1' },
            content: { description: 'Digitale Stempelkarte Flex', organizationName: '' },
            // Stamp config for flex template
            stampConfig: {
                icon: '🟢',
                inactiveIcon: '⚪',
                total: 10,
                current: 1
            }
        }
    }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getLayoutDefinition(style: PassStyle): LayoutDefinition {
    return LAYOUT_DEFINITIONS[style]
}

export function getTemplateById(id: string): PassTemplate | undefined {
    return PASS_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByStyle(style: PassStyle): PassTemplate[] {
    return PASS_TEMPLATES.filter(t => t.style === style)
}

export function isImageAllowed(style: PassStyle, slot: ImageSlot): boolean {
    return LAYOUT_DEFINITIONS[style].allowedImages.includes(slot)
}

export function getMaxFieldCount(
    style: PassStyle,
    fieldType: keyof LayoutDefinition['fieldLimits'],
    hasSquareBarcode: boolean = false
): number {
    const def = LAYOUT_DEFINITIONS[style]
    const limit = def.fieldLimits[fieldType]

    if (limit === -1) return Infinity

    if (def.rules.squareBarcodeReducesFields && hasSquareBarcode) {
        if (fieldType === 'secondaryFields' || fieldType === 'auxiliaryFields') {
            return 4
        }
    }

    return limit
}

export function createDraftFromTemplate(templateId: string): WalletPassDraft | null {
    const template = getTemplateById(templateId)
    if (!template) return null

    const draft: WalletPassDraft = {
        meta: { style: template.style, templateId },
        colors: template.defaultDraft.colors || {
            backgroundColor: '#1A1A1A',
            foregroundColor: '#FFFFFF',
            labelColor: '#999999'
        },
        images: {},
        fields: template.defaultDraft.fields || {
            headerFields: [],
            primaryFields: [],
            secondaryFields: [],
            auxiliaryFields: [],
            backFields: []
        },
        barcode: template.defaultDraft.barcode || {
            format: 'PKBarcodeFormatQR',
            message: '',
            messageEncoding: 'iso-8859-1'
        },
        content: template.defaultDraft.content || {
            description: '',
            organizationName: ''
        }
    }

    // Add default stampConfig for stamp-capable styles (or use template's stampConfig if defined)
    if (template.defaultDraft.stampConfig) {
        draft.stampConfig = template.defaultDraft.stampConfig
    } else if (template.style === 'storeCard' || template.style === 'eventTicket') {
        draft.stampConfig = {
            icon: '🟢',
            inactiveIcon: '⚪',
            total: 10,
            current: 1
        }
    }

    return draft
}
