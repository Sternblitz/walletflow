import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const { prompt, reward, businessType } = await req.json()

        if (!prompt && !reward) {
            return NextResponse.json({ error: "Missing prompt or reward" }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

        if (!apiKey) {
            return NextResponse.json({
                error: "No API key configured",
                iconUrl: null
            }, { status: 200 })
        }

        const ai = new GoogleGenAI({ apiKey })

        // Determine what icon to generate based on context
        const iconContext = reward || prompt || businessType || "gift reward"

        const iconPrompt = `Create a minimalist, premium icon for a loyalty card stamp.

Context: ${iconContext}

STRICT REQUIREMENTS:
- Single, simple symbol (e.g., coffee cup, star, heart, gift box)
- Clean line art style, like premium app icons
- Pure white color (#FFFFFF) on transparent background
- No gradients, no shadows, no 3D effects
- No text whatsoever
- Size: 256x256 pixels
- Very simple, recognizable at small sizes
- Modern, geometric, minimal design

For example:
- "Gratis Kaffee" → simple outline coffee cup
- "10% Rabatt" → star or badge icon
- "Sushi" → chopsticks or fish icon
- "Pizza" → pizza slice outline
- "Haircut" → scissors icon
- "Fitness" → dumbbell icon`

        console.log("Generating icon for:", iconContext)

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
                // Upload to Supabase
                const supabase = await createClient()
                const imageBuffer = Buffer.from(generatedImage.image.imageBytes, 'base64')
                const fileName = `stamp-icons/${Date.now()}-${Math.random().toString(36).slice(2)}.png`

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

                    console.log("✅ Icon generated and uploaded:", publicUrl)
                    return NextResponse.json({
                        iconUrl: publicUrl,
                        source: "ai"
                    })
                } else {
                    console.error("Upload error:", uploadError)
                }
            }
        } catch (imgError: any) {
            console.error("Imagen generation failed:", imgError?.message)
        }

        // Fallback: Return null, will use emoji fallback
        return NextResponse.json({
            iconUrl: null,
            source: "fallback",
            message: "Image generation unavailable, will use emoji"
        })

    } catch (error: any) {
        console.error("Icon generation error:", error)
        return NextResponse.json({
            error: error?.message || "Failed to generate icon",
            iconUrl: null
        }, { status: 500 })
    }
}
