import { createCanvas, loadImage } from 'canvas'

// ============================================
// APPLE WALLET DIMENSIONS
// ============================================

// Strip dimensions for storeCard @3x (375 x 144 points = 1125 x 432 pixels)
const STRIP_WIDTH = 1125
const STRIP_HEIGHT = 432

// Primary fields are rendered by Apple at the TOP of the strip
// We should put stamps LOWER to avoid overlap
const SAFE_ZONE = {
    // Apple renders text in the top portion (~150px)
    // We want our stamps to start nicely below that - INCREASED for better spacing
    topPadding: 200, // Increased from 160 for better top spacing
    bottomPadding: 50, // Increased from 40 for better bottom spacing
    leftPadding: 60,
    rightPadding: 100, // Increased from 60 to account for Apple's safe zone (notch area)
}

// ============================================
// TYPES
// ============================================

export type StampLayout = 'bottom-spread' | 'bottom-centered' | 'right' | 'grid-2-rows'
export type StampStyle = 'filled' | 'glow' | 'ring' | 'check'
export type EmptyStyle = 'dashed' | 'solid' | 'faded' | 'subtle'
export type StampSize = 'small' | 'medium' | 'large' | 'auto'
export type Spacing = 'tight' | 'normal' | 'loose' | 'auto'

export interface StampConfig {
    total: number
    current: number
    icon: string

    layout?: StampLayout
    stampSize?: StampSize
    spacing?: Spacing
    stampStyle?: StampStyle
    emptyStyle?: EmptyStyle
    accentColor?: string

    showLabel?: boolean
    labelText?: string
    showCount?: boolean

    backgroundBuffer?: Buffer
    backgroundColor?: string
}

// ============================================
// MAIN GENERATOR
// ============================================

export async function generateStampStrip(config: StampConfig): Promise<Buffer> {
    const canvas = createCanvas(STRIP_WIDTH, STRIP_HEIGHT)
    const ctx = canvas.getContext('2d')

    // Defaults
    const total = config.total || 10

    // Use bottom-spread as default for premium single-row layout
    // Only use grid-2-rows if explicitly requested or for very large stamp counts (>15)
    const layout = config.layout || (total > 15 ? 'grid-2-rows' : 'bottom-spread')

    const stampStyle = config.stampStyle || 'check'
    const emptyStyle = config.emptyStyle || 'subtle'
    const accentColor = config.accentColor || '#22C55E'
    const current = config.current || 0

    // === 1. BACKGROUND - FULLY TRANSPARENT ===
    ctx.clearRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)

    if (config.backgroundBuffer) {
        try {
            const bg = await loadImage(config.backgroundBuffer)
            const scale = Math.max(STRIP_WIDTH / bg.width, STRIP_HEIGHT / bg.height)
            const w = bg.width * scale
            const h = bg.height * scale
            ctx.drawImage(bg, (STRIP_WIDTH - w) / 2, (STRIP_HEIGHT - h) / 2, w, h)
        } catch (e) {
            // Keep transparent
        }
    }

    // === 2. CALCULATE OPTIMAL STAMP SIZE ===
    const availableWidth = STRIP_WIDTH - SAFE_ZONE.leftPadding - SAFE_ZONE.rightPadding
    const availableHeight = STRIP_HEIGHT - SAFE_ZONE.topPadding - SAFE_ZONE.bottomPadding

    let size: number
    let gap: number

    // Determine configuration based on Layout
    const isGrid = layout === 'grid-2-rows'
    const rows = isGrid ? 2 : 1
    const cols = Math.ceil(total / rows)

    if (config.stampSize === 'auto' || !config.stampSize) {
        // Auto-calculate for perfect fit - OPTIMIZED FOR 10 STAMPS
        // Goal: Make stamps as large as possible while fitting perfectly

        // Width Constrained
        // width = cols * size + (cols - 1) * gap
        // gap = 0.25 * size (tighter spacing for premium look)
        // width = size * (cols + 0.25 * cols - 0.25) = size * (1.25 * cols - 0.25)
        const widthBasedSize = availableWidth / (1.25 * cols - 0.25)

        // Height Constrained
        // height = rows * size + (rows - 1) * gap
        // gap = 0.25 * size
        const heightBasedSize = availableHeight / (1.25 * rows - 0.25)

        // Take the smaller of the two to ensure it fits both dimensions
        size = Math.min(widthBasedSize, heightBasedSize)

        // For 10 stamps in a single row, we want them to be LARGE and prominent
        // Use 95% of calculated size to ensure perfect fit with some margin
        size = size * 0.95

        // Constraints - LARGER STAMPS for better visibility and premium feel
        // For 10 stamps, we want them to be as large as possible while fitting perfectly
        size = Math.min(size, 160) // Max size for premium visibility
        size = Math.max(size, 90)  // Increased min size to 90 for premium visibility (was 80)

        // Recalculate Gap based on final size - TIGHTER spacing for perfect fit
        gap = Math.floor(size * 0.25) // Optimal spacing ratio for professional look
    } else {
        // Increased sizes for better visibility and premium feel
        const sizes = { small: 70, medium: 95, large: 120 } // All increased further for premium look
        size = sizes[config.stampSize] || 95
        gap = config.spacing === 'tight' ? 15 : config.spacing === 'loose' ? 40 : 25
    }

    // === 3. CALCULATE POSITIONS ===
    const stamps = calculateStampPositions(layout, total, rows, cols, size, gap, availableWidth, availableHeight)

    // === 4. DRAW STAMPS ===
    for (let i = 0; i < stamps.length && i < total; i++) {
        const { x, y } = stamps[i]

        if (i < current) {
            drawFilledStamp(ctx, x, y, size, stampStyle, accentColor)
        } else {
            drawEmptyStamp(ctx, x, y, size, emptyStyle)
        }
    }

    return canvas.toBuffer('image/png')
}

// ============================================
// POSITION CALCULATOR
// ============================================

function calculateStampPositions(
    layout: string,
    total: number,
    rows: number,
    cols: number,
    size: number,
    gap: number,
    availableWidth: number,
    availableHeight: number
): { x: number; y: number }[] {
    const stamps: { x: number; y: number }[] = []

    // Calculate dimensions of the whole grid/row block
    const blockWidth = (cols * size) + ((cols - 1) * gap)
    const blockHeight = (rows * size) + ((rows - 1) * gap)

    // Start coordinates (Top-Left of the block) to center it
    const startX = SAFE_ZONE.leftPadding + (availableWidth - blockWidth) / 2
    
    // Vertical positioning based on layout type - OPTIMIZED FOR PREMIUM LOOK
    let startY: number
    if (layout === 'bottom-spread' || layout === 'bottom-centered') {
        // For bottom layouts, position stamps in the lower 60% of available space
        // This ensures they're clearly visible below the primary field text
        // Using 60% from top gives good spacing while keeping stamps prominent
        const targetY = SAFE_ZONE.topPadding + (availableHeight * 0.6)
        startY = targetY - (blockHeight / 2) + size / 2
    } else if (layout === 'right') {
        // For right layout, center vertically
        startY = SAFE_ZONE.topPadding + (availableHeight - blockHeight) / 2 + size / 2
    } else {
        // For grid layouts, center in available space with extra top spacing
        startY = SAFE_ZONE.topPadding + (availableHeight - blockHeight) / 2 + size / 2 + 20
    }
    // Note: + size/2 because our draw functions use center (cx, cy) coordinates

    for (let i = 0; i < total; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols

        const cx = startX + (col * (size + gap)) + (size / 2)
        const cy = startY + (row * (size + gap))

        stamps.push({ x: cx, y: cy })
    }

    return stamps
}

// ============================================
// STAMP RENDERERS
// ============================================

function drawFilledStamp(
    ctx: any,
    cx: number,
    cy: number,
    size: number,
    style: StampStyle,
    accentColor: string
) {
    ctx.save()

    const radius = size / 2 - 2

    switch (style) {
        case 'glow':
            // Glowing circle
            ctx.shadowColor = accentColor
            ctx.shadowBlur = 20
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = accentColor
            ctx.fill()
            ctx.closePath()
            break

        case 'ring':
            // Thick ring with center dot
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.strokeStyle = accentColor
            ctx.lineWidth = 5
            ctx.stroke()
            ctx.closePath()

            ctx.beginPath()
            ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2)
            ctx.fillStyle = accentColor
            ctx.fill()
            ctx.closePath()
            break

        case 'check':
            // Circle with elegant checkmark
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = accentColor
            ctx.fill()
            ctx.closePath()

            // Draw checkmark
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = Math.max(3, size * 0.06)
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            const cs = radius * 0.55
            ctx.moveTo(cx - cs * 0.5, cy + cs * 0.05)
            ctx.lineTo(cx - cs * 0.1, cy + cs * 0.45)
            ctx.lineTo(cx + cs * 0.55, cy - cs * 0.35)
            ctx.stroke()
            break

        case 'filled':
        default:
            // Simple filled circle
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = accentColor
            ctx.fill()
            ctx.closePath()
            break
    }

    ctx.restore()
}

function drawEmptyStamp(
    ctx: any,
    cx: number,
    cy: number,
    size: number,
    style: EmptyStyle
) {
    ctx.save()

    const radius = size / 2 - 2

    switch (style) {
        case 'solid':
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
            ctx.lineWidth = 2
            ctx.stroke()
            ctx.closePath()
            break

        case 'faded':
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
            ctx.fill()
            ctx.closePath()
            break

        case 'subtle':
            // Very subtle - just a hint
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([])
            ctx.stroke()
            ctx.closePath()
            break

        case 'dashed':
        default:
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.stroke()
            ctx.closePath()
            break
    }

    ctx.restore()
}

// ============================================
// UTILITY EXPORTS
// ============================================

export async function generateSolidStrip(color: string): Promise<Buffer> {
    const canvas = createCanvas(STRIP_WIDTH, STRIP_HEIGHT)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)
    return canvas.toBuffer('image/png')
}

export async function generateGradientStrip(
    colorStart: string,
    colorEnd: string
): Promise<Buffer> {
    const canvas = createCanvas(STRIP_WIDTH, STRIP_HEIGHT)
    const ctx = canvas.getContext('2d')

    const gradient = ctx.createLinearGradient(0, 0, STRIP_WIDTH, 0)
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(1, colorEnd)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)

    return canvas.toBuffer('image/png')
}

// Export constants
export { STRIP_WIDTH, STRIP_HEIGHT }

// Legacy exports for compatibility
export const SIZES = { small: 50, medium: 65, large: 80, auto: 65 }
export const SPACINGS = { tight: 8, normal: 12, loose: 20, auto: 12 }
