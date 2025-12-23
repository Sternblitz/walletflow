import { NextRequest, NextResponse } from "next/server"
import { generateStampStrip, type StampLayout, type StampStyle, type EmptyStyle, type StampSize, type Spacing } from "@/lib/wallet/banner-generator"

/**
 * Dynamic Strip Image Preview API
 * 
 * Generates a real-time preview of the stamp card strip image.
 * This ensures the editor shows EXACTLY what will be in the final pass.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    // Core
    const total = parseInt(searchParams.get('total') || '10')
    const current = parseInt(searchParams.get('current') || '0')
    const icon = searchParams.get('icon') || '🎁'

    // Layout - auto sizing for perfect fit
    const layout = (searchParams.get('layout') || 'bottom-spread') as StampLayout
    const stampSize = (searchParams.get('stampSize') || 'auto') as StampSize
    const spacing = (searchParams.get('spacing') || 'auto') as Spacing

    // Style
    const stampStyle = (searchParams.get('stampStyle') || 'check') as StampStyle
    const emptyStyle = (searchParams.get('emptyStyle') || 'subtle') as EmptyStyle
    const accentColor = searchParams.get('accentColor') || '#22C55E'  // Green default

    // Content
    const showLabel = searchParams.get('showLabel') !== 'false'
    const showCount = searchParams.get('showCount') !== 'false'
    const labelText = searchParams.get('labelText') || 'DEINE STEMPEL'

    // Background
    const bgColor = searchParams.get('bgColor')
    const bgUrl = searchParams.get('bgUrl')

    // Fetch Background Image if provided
    let backgroundBuffer: Buffer | undefined
    if (bgUrl && bgUrl.length > 0 && !bgUrl.startsWith('/api')) {
        try {
            const res = await fetch(bgUrl)
            if (res.ok) {
                const ab = await res.arrayBuffer()
                backgroundBuffer = Buffer.from(ab)
            }
        } catch (e) {
            console.error("Failed to fetch bg for preview:", e)
        }
    }

    try {
        const pngBuffer = await generateStampStrip({
            total,
            current,
            icon,
            layout,
            stampSize,
            spacing,
            stampStyle,
            emptyStyle,
            accentColor,
            showLabel,
            showCount,
            labelText,
            backgroundBuffer,
            backgroundColor: bgColor || undefined
        })

        return new NextResponse(pngBuffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=2, stale-while-revalidate=5'
            }
        })
    } catch (e) {
        console.error("Preview Generation Error:", e)
        return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 })
    }
}
