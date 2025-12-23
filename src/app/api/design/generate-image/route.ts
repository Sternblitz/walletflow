import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"
import { createCanvas, loadImage } from "canvas"

// Helper to convert hex to rgb
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/**
 * Generate AI Strip Image using Gemini 3 Pro Image (Nano Banana Pro)
 * 
 * Strategy:
 * 1. AI: Generates a 4K wide image.
 * 2. Canvas: Processes at @3x Retina resolution (1125x432) to fix pixelation.
 * 3. Fade: Applies a long, super-soft gradient to avoid "hard edges".
 */
export async function POST(req: NextRequest) {
    try {
        const {
            businessDescription,
            businessName,
            backgroundColor = '#1A1A1A',
            accentColor,
            style = "modern",
            type = "strip" // 'strip' | 'background'
        } = await req.json()

        if (!businessDescription) {
            return NextResponse.json({ error: "Missing businessDescription" }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

        if (!apiKey) {
            return NextResponse.json({ error: "No API key configured", imageUrl: null }, { status: 200 })
        }

        const ai = new GoogleGenAI({ apiKey })

        // 1. Define Config based on Type
        let width = 0
        let height = 0
        let prompt = ""
        let aspectRatio = "16:9"

        if (type === 'background') {
            // Background: 180x220pt -> @3x = 540x660px
            width = 540
            height = 660
            aspectRatio = "3:4" // Closest to 180:220

            prompt = `Vertical background image for a mobile event ticket / stamp card.
            SUBJECT: ${businessDescription}
            STYLE: ${style}
            COLORS: Compatible with main color ${backgroundColor}.
            
            COMPOSITION:
            - Vertical composition (Portrait).
            - **SUBJECT**: Show the subject (e.g., ${businessDescription}) clearly.
            - **LIGHTING**: Bright and clear. Avoid dark shadows to ensure the image remains visible when slightly dimmed by the OS.
            - IT MUST NOT BE TOO BUSY. It will sit behind text.
            - High contrast, commercial photography style.
            - NO TEXT. NO LOGOS.
            
            CONTEXT:
            Used as a background wallpaper for a digital pass. Should look premium.`
        } else if (type === 'thumbnail') {
            // Thumbnail: 90x90pt -> @4x = 360x360px (Consistent with Text Tool)
            width = 360
            height = 360
            aspectRatio = "1:1"

            prompt = `App Icon Design / Logo for a loyalty card.
            SUBJECT: ${businessDescription}
            STYLE: ${style} (Vector, Flat, Minimalist)
            COLOR: Main Icon Color: ${accentColor}. Background: SOLID WHITE (HEX #FFFFFF).
            
            COMPOSITION:
            - Centered subject (e.g., ${businessDescription}) on a SOLID WHITE background.
            - **STYLE**: Apple App Icon style but without a background container. Just the shape/object.
            - **COLOR**: Use ${accentColor} for the icon.
            - NO TEXT. NO COMPLEX DETAILS.
            - It should look like a high-quality vector icon or emoji.
            - CRITICAL: OUTPUT MUST HAVE A SOLID WHITE BACKGROUND to allow easy background removal.`
        } else {
            // Strip: 375x144pt -> @3x = 1125x432px
            width = 1125
            height = 432
            aspectRatio = "16:9"

            prompt = `Wide header image for a loyalty card.
            SUBJECT: ${businessDescription}
            STYLE: ${style}
            ACCENT COLOR: ${accentColor || 'Neutral'}

            COMPOSITION:
            - Wide cinematic framing (16:9).
            - **SUBJECT:** Place the main subject on the **RIGHT SIDE** of the frame.
            - **BACKGROUND:** The background should extend across the entire width. Dark/Moody preferred.
            - NO TEXT. NO LOGOS.
            - The image should look like a premium header for a wallet pass.

            DESCRIPTION:
            A beautiful, commercial-grade shot of ${businessDescription}. The lighting is dramatic. The subject is clearly visible on the right.`
        }

        console.log(`🎨 Generating ${type} with Gemini... Prompt: ${businessDescription}`)

        let generatedImage: any = null;

        try {
            // Try Gemini 3 Pro first (or Flash if sufficient)
            // User requested "2k not 4k": We will not force 4k resolution for backgrounds
            const imageSize = type === 'background' ? undefined : "4K"

            const response = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: [prompt],
                config: {
                    responseModalities: ['IMAGE'],
                    imageConfig: {
                        aspectRatio: aspectRatio as any,
                        imageSize: imageSize
                    }
                }
            })

            const candidate = response.candidates?.[0]
            const part = candidate?.content?.parts?.[0]

            if (part?.inlineData) {
                generatedImage = { image: { imageBytes: part.inlineData.data } }
            }

        } catch (err: any) {
            console.error("Gemini 3 Pro failed, falling back to Flash:", err.message)
            // Fallback to Gemini 2.5 Flash Image
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-image",
                    contents: [prompt],
                    config: {
                        responseModalities: ['IMAGE'],
                        imageConfig: { aspectRatio: aspectRatio as any }
                    }
                })
                const part = response.candidates?.[0]?.content?.parts?.[0]
                if (part?.inlineData) {
                    generatedImage = { image: { imageBytes: part.inlineData.data } }
                }
            } catch (fallbackErr) {
                console.error("Fallback failed:", fallbackErr)
                throw new Error("All image models failed")
            }
        }

        if (!generatedImage?.image?.imageBytes) {
            return NextResponse.json({ imageUrl: null, error: "Image generation failed" })
        }

        // 2. Post-Process with Canvas (Resize & Gradient if Strip)
        console.log("🎨 Post-processing with Canvas...")

        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')
        const rawBuffer = Buffer.from(generatedImage.image.imageBytes, 'base64')
        const img = await loadImage(rawBuffer)

        // Draw Cover
        const scale = Math.max(width / img.width, height / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const offsetX = (width - scaledWidth) / 2
        const offsetY = (height - scaledHeight) / 2 // Center crop

        // For strips, align right (override center crop)
        const finalOffsetX = type === 'strip' ? (width - scaledWidth) : offsetX

        ctx.drawImage(img, finalOffsetX, offsetY, scaledWidth, scaledHeight)

        // Apply Gradient Overlay ONLY for Strip (to hide text on left)
        if (type === 'strip') {
            const rgb = hexToRgb(backgroundColor)
            const gradient = ctx.createLinearGradient(0, 0, width, 0)
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`)
            gradient.addColorStop(0.2, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`)
            gradient.addColorStop(0.85, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)
        }

        // 3. Upload
        const processedBuffer = canvas.toBuffer('image/png')
        const supabase = await createClient()
        const folder = type === 'background' ? 'background-images' : 'strip-images'
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`

        const { error: uploadError } = await supabase.storage
            .from('pass-assets')
            .upload(fileName, processedBuffer, { contentType: 'image/png', upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('pass-assets')
            .getPublicUrl(fileName)

        return NextResponse.json({ imageUrl: publicUrl, source: "gemini-generated" })

    } catch (error: any) {
        console.error("Image generation error:", error)
        return NextResponse.json({ error: error.message || "Generation failed", imageUrl: null }, { status: 500 })
    }
}
