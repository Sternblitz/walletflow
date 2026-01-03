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
            // Use Gemini with image generation capability
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-exp",  // Gemini model with image generation
                contents: iconPrompt,
                config: {
                    responseModalities: ["image", "text"],
                }
            })

            // Extract image from response
            const parts = response.candidates?.[0]?.content?.parts || []
            let imageData: string | undefined = undefined

            for (const part of parts) {
                if (part.inlineData?.mimeType?.startsWith("image/")) {
                    imageData = part.inlineData.data
                    break
                }
            }

            if (imageData) {
                const supabase = await createClient()
                const imageBuffer = Buffer.from(imageData, 'base64')

                const timestamp = Date.now()
                const randomId = Math.random().toString(36).slice(2, 8)
                const fileName = `notification-icons/${timestamp}-${randomId}.png`

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

                    console.log("✅ Notification icon generated with Gemini:", publicUrl)

                    return NextResponse.json({
                        iconUrl: publicUrl,
                        icon2xUrl: publicUrl,
                        icon3xUrl: publicUrl,
                        source: "gemini"
                    })
                } else {
                    console.error("Upload error:", uploadError)
                    return NextResponse.json({
                        error: "Upload fehlgeschlagen: " + uploadError.message,
                        iconUrl: null
                    })
                }
            } else {
                console.error("No image in Gemini response, parts:", parts.length)
                return NextResponse.json({
                    error: "Gemini hat kein Bild generiert. Versuche es erneut.",
                    iconUrl: null
                })
            }
        } catch (genError: any) {
            console.error("Gemini image generation failed:", genError?.message, genError?.code)

            let errorMessage = "Bildgenerierung fehlgeschlagen"
            if (genError?.message?.includes("quota")) {
                errorMessage = "API-Quota erschöpft. Bitte später erneut versuchen."
            } else if (genError?.message?.includes("permission") || genError?.message?.includes("403")) {
                errorMessage = "API-Zugang fehlt. Prüfe den API-Key."
            } else if (genError?.message?.includes("not supported") || genError?.message?.includes("modality")) {
                errorMessage = "Bild-Generierung für dieses Modell nicht verfügbar."
            } else if (genError?.message) {
                errorMessage = genError.message
            }

            return NextResponse.json({
                error: errorMessage,
                iconUrl: null,
                source: "gemini_error"
            })
        }

    } catch (error: any) {
        console.error("Notification icon generation error:", error)
        return NextResponse.json({
            error: error?.message || "Failed to generate icon",
            iconUrl: null
        }, { status: 500 })
    }
}
