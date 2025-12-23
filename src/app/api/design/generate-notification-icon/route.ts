import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const { businessName, businessType, colors } = await req.json()

        if (!businessName) {
            return NextResponse.json({ error: "Missing businessName" }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

        if (!apiKey) {
            return NextResponse.json({
                error: "No API key configured",
                iconUrl: null,
                source: "no_key"
            }, { status: 200 })
        }

        const ai = new GoogleGenAI({ apiKey })

        // Determine icon style based on business type
        const businessHints: Record<string, string> = {
            cafe: "coffee cup with steam",
            coffee: "coffee cup with steam",
            kaffee: "coffee cup with steam",
            restaurant: "fork and knife crossed",
            sushi: "chopsticks",
            pizza: "pizza slice",
            barber: "scissors",
            friseur: "scissors",
            hair: "scissors",
            gym: "dumbbell",
            fitness: "dumbbell",
            spa: "lotus flower",
            wellness: "lotus flower",
            bakery: "croissant or bread",
            bäckerei: "croissant or bread",
            retail: "shopping bag",
            shop: "shopping bag"
        }

        // Find matching hint
        let iconHint = "star or badge"
        const lowerType = (businessType || businessName || "").toLowerCase()
        for (const [key, hint] of Object.entries(businessHints)) {
            if (lowerType.includes(key)) {
                iconHint = hint
                break
            }
        }

        const backgroundColor = colors?.background || "#1A1A2E"
        const accentColor = colors?.accent || "#FFFFFF"

        const iconPrompt = `Create a minimalist app icon for "${businessName}".

STRICT REQUIREMENTS:
- Icon represents: ${iconHint}
- Style: Premium, modern, minimalist like iOS app icons
- Colors: White (#FFFFFF) symbol on solid ${backgroundColor} background
- Simple, bold shape that's recognizable at 29x29 pixels
- NO text, NO letters, NO words
- NO gradients, NO shadows, NO 3D effects
- Clean geometric lines, flat design
- Single centered symbol
- Square format with slightly rounded corners

Think Apple SF Symbols or premium fintech app icons.`

        console.log("🎨 Generating notification icon for:", businessName, "| Hint:", iconHint)

        try {
            const response = await ai.models.generateImages({
                model: "imagen-3.0-generate-002",
                prompt: iconPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "1:1",
                }
            })

            const generatedImage = response.generatedImages?.[0]

            if (generatedImage?.image?.imageBytes) {
                const supabase = await createClient()
                const imageBuffer = Buffer.from(generatedImage.image.imageBytes, 'base64')

                const timestamp = Date.now()
                const randomId = Math.random().toString(36).slice(2, 8)
                const fileName = `notification-icons/${timestamp}-${randomId}.png`

                // Upload original - Apple Wallet will handle resizing
                const { error: uploadError } = await supabase.storage
                    .from('pass-assets')
                    .upload(fileName, imageBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    })

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('pass-assets')
                        .getPublicUrl(fileName)

                    console.log("✅ Notification icon generated:", publicUrl)

                    return NextResponse.json({
                        iconUrl: publicUrl,
                        icon2xUrl: publicUrl,  // Same URL, will be resized by pass generator
                        icon3xUrl: publicUrl,
                        source: "ai"
                    })
                } else {
                    console.error("Upload error:", uploadError)
                }
            }
        } catch (imgError: any) {
            console.error("Imagen generation failed:", imgError?.message)
        }

        // Fallback
        return NextResponse.json({
            iconUrl: null,
            source: "fallback",
            message: "Image generation unavailable"
        })

    } catch (error: any) {
        console.error("Notification icon generation error:", error)
        return NextResponse.json({
            error: error?.message || "Failed to generate icon",
            iconUrl: null
        }, { status: 500 })
    }
}
