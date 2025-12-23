import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createCanvas } from "canvas"

// Helper to convert hex to rgb
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : 'rgb(0,0,0)';
}

export async function POST(req: NextRequest) {
    try {
        const { text, color, backgroundColor } = await req.json()

        if (!text) {
            return NextResponse.json({ error: "Missing text" }, { status: 400 })
        }

        // Thumbnail is 90x90pt.
        // User requested "much much bigger".
        // Let's go to 1080x1080px (@12x) to be absolutely sure it's crisp.
        const size = 1080
        const canvas = createCanvas(size, size)
        const ctx = canvas.getContext('2d')

        // Background (Rounded Square or Circle? Apple masks it anyway)
        ctx.fillStyle = backgroundColor || '#FFFFFF'
        ctx.fillRect(0, 0, size, size)

        // Text
        ctx.fillStyle = color || '#000000'

        // Font logic (1080px base)
        const fontSize = text.length > 3 ? 400 : 520
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Center Text
        ctx.fillText(text, size / 2, size / 2)

        // Upload
        const buffer = canvas.toBuffer('image/png')
        const supabase = await createClient()
        const fileName = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.png`

        const { error: uploadError } = await supabase.storage
            .from('pass-assets')
            .upload(fileName, buffer, { contentType: 'image/png', upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('pass-assets')
            .getPublicUrl(fileName)

        return NextResponse.json({ imageUrl: publicUrl })

    } catch (error: any) {
        console.error("Thumbnail generation error:", error)
        return NextResponse.json({ error: "Failed to generate thumbnail" }, { status: 500 })
    }
}
