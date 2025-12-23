/**
 * Apple Wallet Pass Layout Configuration
 * 
 * Based on official Apple documentation:
 * https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Creating.html
 * 
 * All dimensions are in pixels @3x (Retina)
 * Points → Pixels: multiply by 3
 */

export const PASS_DIMENSIONS = {
    // Store Card / Coupon Strip: 375 x 144 points = 1125 x 432 pixels @3x
    storeCard: {
        stripWidth: 1125,
        stripHeight: 432,
    },
    coupon: {
        stripWidth: 1125,
        stripHeight: 432,
    },
    // Event Ticket Strip: 375 x 98 points = 1125 x 294 pixels @3x
    eventTicket: {
        stripWidth: 1125,
        stripHeight: 294,
    },
    // Generic Strip: 375 x 123 points = 1125 x 369 pixels @3x
    generic: {
        stripWidth: 1125,
        stripHeight: 369,
    },
} as const

export type PassType = keyof typeof PASS_DIMENSIONS

/**
 * Stamp Layout Presets
 */
export const STAMP_LAYOUTS = {
    stacked: {
        name: 'Gestapelt',
        description: 'Text oben, Stempel darunter',
        icon: '↓'
    },
    horizontal: {
        name: 'Horizontal',
        description: 'Text links, Stempel rechts',
        icon: '→'
    },
    compact: {
        name: 'Kompakt',
        description: 'Kleinere Stempel, mehr Platz',
        icon: '⊕'
    },
    centered: {
        name: 'Zentriert',
        description: 'Alles in der Mitte',
        icon: '⊛'
    }
} as const

export type StampLayoutType = keyof typeof STAMP_LAYOUTS

/**
 * Stamp Visual Styles
 */
export const STAMP_STYLES = {
    'emoji-clean': {
        name: 'Clean',
        description: 'Nur Emoji, kein Hintergrund'
    },
    'emoji-glow': {
        name: 'Glow',
        description: 'Emoji mit Leuchten'
    },
    'emoji-circle': {
        name: 'Circle',
        description: 'Emoji im Kreis'
    },
    'dots': {
        name: 'Punkte',
        description: 'Farbige Punkte statt Emojis'
    }
} as const

export type StampStyleType = keyof typeof STAMP_STYLES

/**
 * Empty Stamp Styles
 */
export const EMPTY_STYLES = {
    dashed: {
        name: 'Gestrichelt',
        description: 'Gestrichelter Kreis'
    },
    solid: {
        name: 'Solid',
        description: 'Durchgehender Kreis'
    },
    faded: {
        name: 'Verblasst',
        description: 'Schwach gefüllter Kreis'
    }
} as const

export type EmptyStyleType = keyof typeof EMPTY_STYLES

/**
 * Stamp Size Presets
 */
export const STAMP_SIZES = {
    small: { value: 40, label: 'S' },
    medium: { value: 56, label: 'M' },
    large: { value: 72, label: 'L' }
} as const

export type StampSizeType = keyof typeof STAMP_SIZES

/**
 * Spacing Presets
 */
export const STAMP_SPACINGS = {
    tight: { value: 10, label: 'Eng' },
    normal: { value: 18, label: 'Normal' },
    loose: { value: 28, label: 'Weit' }
} as const

export type SpacingType = keyof typeof STAMP_SPACINGS

/**
 * Default Stamp Configuration
 */
export const DEFAULT_STAMP_CONFIG = {
    layout: 'stacked' as StampLayoutType,
    stampSize: 'medium' as StampSizeType,
    spacing: 'normal' as SpacingType,
    stampStyle: 'emoji-clean' as StampStyleType,
    emptyStyle: 'dashed' as EmptyStyleType,
    showLabel: true,
    showCount: true,
    labelText: 'DEINE STEMPEL'
} as const
