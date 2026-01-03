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

        // Determine icon style based on business type - more specific visual descriptions
        const businessHints: Record<string, string> = {
            // Food & Drinks
            döner: "delicious döner kebab wrap with meat, salad, and sauce",
            kebab: "tasty kebab sandwich with grilled meat",
            pizza: "cheesy pizza slice with toppings",
            burger: "juicy hamburger with lettuce and cheese",
            sushi: "fresh sushi rolls with salmon and rice",
            restaurant: "elegant dinner plate with gourmet food",
            cafe: "steaming coffee cup with latte art",
            coffee: "aromatic coffee cup with steam rising",
            kaffee: "beautiful coffee cup with foam art",
            bar: "stylish cocktail glass with colorful drink",
            bakery: "fresh baked croissant with golden crust",
            bäckerei: "artisan bread loaf with crusty texture",
            eis: "colorful ice cream cone with multiple scoops",
            icecream: "delicious ice cream sundae",

            // Beauty & Wellness
            barber: "vintage barber scissors with comb",
            friseur: "professional hairdresser scissors",
            hair: "elegant hair styling scissors",
            spa: "serene lotus flower on water",
            wellness: "peaceful zen stones with bamboo",
            nail: "beautiful manicured nails with polish",
            beauty: "luxurious makeup brush set",

            // Fitness & Sports
            gym: "powerful dumbbell weights",
            fitness: "athletic running shoes",
            yoga: "peaceful yoga pose silhouette",
            sport: "dynamic sports equipment",

            // Retail & Services
            retail: "trendy shopping bag with logo",
            shop: "elegant store front design",
            auto: "sleek modern car silhouette",
            car: "shiny automobile",
            taxi: "yellow taxi cab",
            hotel: "luxury hotel building"
        }

        // Find matching hint
        let iconHint = "premium business logo with elegant design"
        const lowerType = (businessType || businessName || "").toLowerCase()
        for (const [key, hint] of Object.entries(businessHints)) {
            if (lowerType.includes(key)) {
                iconHint = hint
                break
            }
        }

        const backgroundColor = colors?.background || "#1A1A2E"

        const iconPrompt = `Generate a high-quality product image for a "${businessName}" business.

CRITICAL - TRANSPARENT BACKGROUND:
- The subject MUST be on a completely TRANSPARENT background
- NO background color, NO floor, NO shadows on background
- Pure alpha transparency around the subject
- PNG format with transparency

VISUAL REQUIREMENTS:
- Main subject: ${iconHint}
- Style: Modern, vibrant, photorealistic 3D render
- Lighting: Professional studio lighting
- Colors: Rich, saturated colors that pop
- Composition: Centered, filling 80% of the frame
- Quality: Ultra HD, crisp details, visually striking
- Angle: Slightly angled 3/4 view for depth

IMPORTANT:
- ONLY the subject, nothing else
- Should be eye-catching and appetizing (if food)
- NO text, NO letters, NO words
- NO background elements, NO surfaces
- Clean isolated product shot

Think: Professional product photography with transparent background for compositing.`

        console.log("🎨 Generating notification icon for:", businessName, "| Hint:", iconHint)

        try {
            // Use Gemini 3 Pro Image (Nano Banana Pro) for high-quality icon generation
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",  // Nano Banana Pro - studio quality
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
