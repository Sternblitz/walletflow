import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export interface FullDesignProposal {
    id: string
    name: string
    colors: {
        background: string
        text: string
        label: string
        accent: string  // New: for glow effects
    }
    content: {
        logoText: string
        headerLabel: string
        headerValue: string
        primaryLabel: string
        secLabel1: string
        secValue1: string
        auxLabel1: string
        auxValue1: string
    }
    stampIcon: string  // Emoji fallback
    stampIconUrl?: string  // AI-generated icon URL
    style: string
}

export async function POST(req: NextRequest) {
    try {
        const { prompt, businessName, concept, generateIcon } = await req.json()

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

        if (!apiKey) {
            const design = generateLocalFullDesign(prompt, businessName, concept)
            return NextResponse.json({ design, source: "local" })
        }

        try {
            const ai = new GoogleGenAI({ apiKey })

            // Step 1: Generate design config with Gemini
            const designPrompt = `You are Nano Banana, an elite AI designer for Apple Wallet loyalty passes.

Based on the business description, generate a COMPLETE pass design:

Business: "${prompt}"
Business Name: "${businessName || 'Unknown'}"
Card Type: ${concept || 'STAMP_CARD'} 

Generate a premium design with vibrant accent colors. Return ONLY valid JSON (no markdown, no code blocks):
{
    "id": "design_1",
    "name": "Creative Theme Name",
    "colors": {
        "background": "#1A1A2E",
        "text": "#FFFFFF",
        "label": "#soft_muted_color",
        "accent": "#vibrant_glow_color"
    },
    "content": {
        "logoText": "${businessName || 'Business Name'}",
        "headerLabel": "BONUSKARTE",
        "headerValue": "#1234",
        "primaryLabel": "STEMPEL",
        "secLabel1": "NÄCHSTE PRÄMIE",
        "secValue1": "Matching reward",
        "auxLabel1": "POWERED BY",
        "auxValue1": "QARD"
    },
    "stampIcon": "matching_emoji",
    "iconDescription": "What icon should represent the stamp (e.g., coffee cup, star, scissors)",
    "style": "2-3 word style"
}`

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: designPrompt,
            })

            const text = response.text?.trim() || ""

            // Parse JSON
            let jsonStr = text
            if (jsonStr.includes("```")) {
                const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
                if (match) jsonStr = match[1]
            }
            const objMatch = jsonStr.match(/\{[\s\S]*\}/)

            if (!objMatch) {
                throw new Error("Failed to parse design JSON")
            }

            const design = JSON.parse(objMatch[0]) as FullDesignProposal & { iconDescription?: string }

            // Step 2: Generate AI icon if requested
            let stampIconUrl: string | undefined

            if (generateIcon !== false) {  // Generate by default
                try {
                    console.log("🎨 Generating AI stamp icon...")

                    const iconPrompt = `Create a minimalist, premium icon.

Context: ${design.iconDescription || design.content.secValue1 || prompt}

STRICT REQUIREMENTS:
- Single, simple symbol (like premium app icons)
- Clean line art style, very minimal
- Pure white color (#FFFFFF) on completely transparent background
- NO gradients, NO shadows, NO 3D effects
- NO text whatsoever
- Modern, geometric, recognizable at tiny sizes (32px)
- Think: Apple SF Symbols style

Examples:
- Coffee → simple outline coffee cup with steam
- Gift → minimalist gift box outline
- Star → clean 5-point star
- Scissors → simple barber scissors`

                    const iconResponse = await ai.models.generateImages({
                        model: "imagen-4.0-generate-001",
                        prompt: iconPrompt,
                        config: {
                            numberOfImages: 1,
                            aspectRatio: "1:1",
                        }
                    })

                    const generatedImage = iconResponse.generatedImages?.[0]

                    if (generatedImage?.image?.imageBytes) {
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
                            stampIconUrl = publicUrl
                            console.log("✅ AI icon generated:", stampIconUrl)
                        }
                    }
                } catch (iconError: any) {
                    console.log("Icon generation unavailable:", iconError?.message)
                    // Continue with emoji fallback
                }
            }

            const finalDesign: FullDesignProposal = {
                id: design.id || `design_${Date.now()}`,
                name: design.name,
                colors: {
                    background: design.colors.background,
                    text: design.colors.text,
                    label: design.colors.label,
                    accent: design.colors.accent || design.colors.label
                },
                content: design.content,
                stampIcon: design.stampIcon || "🎁",
                stampIconUrl,
                style: design.style
            }

            return NextResponse.json({
                design: finalDesign,
                source: "gemini",
                iconGenerated: !!stampIconUrl
            })

        } catch (aiError: any) {
            console.error("Gemini AI error:", aiError?.message || aiError)
            const design = generateLocalFullDesign(prompt, businessName, concept)
            return NextResponse.json({ design, source: "local_fallback", error: aiError?.message })
        }

    } catch (error: any) {
        console.error("Full Design API error:", error)
        return NextResponse.json({ error: "Failed to generate design" }, { status: 500 })
    }
}

function generateLocalFullDesign(
    prompt: string,
    businessName?: string,
    concept?: string
): FullDesignProposal {
    const lowerPrompt = prompt.toLowerCase()

    type IndustryDesign = {
        colors: { background: string; text: string; label: string; accent: string }
        emoji: string
        reward: string
        style: string
    }

    const industries: Record<string, IndustryDesign> = {
        cafe: {
            colors: { background: "#1C1410", text: "#FFF8F0", label: "#D4A574", accent: "#F59E0B" },
            emoji: "☕️",
            reward: "Gratis Kaffee",
            style: "Warm & Cozy"
        },
        restaurant: {
            colors: { background: "#1A1A2E", text: "#FFFFFF", label: "#E5C07B", accent: "#FFD700" },
            emoji: "🍽️",
            reward: "Gratis Hauptgericht",
            style: "Golden Luxury"
        },
        sushi: {
            colors: { background: "#1A0A14", text: "#FFFFFF", label: "#F9A8D4", accent: "#EC4899" },
            emoji: "🍣",
            reward: "Gratis Sushi-Rolle",
            style: "Japanese Elegance"
        },
        pizza: {
            colors: { background: "#1A0A0A", text: "#FFFFFF", label: "#FCA5A5", accent: "#EF4444" },
            emoji: "🍕",
            reward: "Gratis Pizza",
            style: "Italian Fire"
        },
        barber: {
            colors: { background: "#1A1A1A", text: "#FFFFFF", label: "#D4AF37", accent: "#F59E0B" },
            emoji: "✂️",
            reward: "Gratis Haarschnitt",
            style: "Classic Gentleman"
        },
        gym: {
            colors: { background: "#0A1A14", text: "#FFFFFF", label: "#6EE7B7", accent: "#10B981" },
            emoji: "💪",
            reward: "Gratis Monat",
            style: "Power Energy"
        },
        retail: {
            colors: { background: "#1A0A10", text: "#FFFFFF", label: "#FBCFE8", accent: "#EC4899" },
            emoji: "🛍️",
            reward: "20% Rabatt",
            style: "Fashion Luxe"
        },
        bakery: {
            colors: { background: "#2D1B0E", text: "#FFF5E1", label: "#FCD34D", accent: "#F59E0B" },
            emoji: "🥐",
            reward: "Gratis Croissant",
            style: "Fresh Baked"
        },
        spa: {
            colors: { background: "#0F172A", text: "#FFFFFF", label: "#A5B4FC", accent: "#8B5CF6" },
            emoji: "💆",
            reward: "Gratis Massage",
            style: "Zen Wellness"
        }
    }

    let matched: IndustryDesign = {
        colors: { background: "#1A1033", text: "#FFFFFF", label: "#C4B5FD", accent: "#8B5CF6" },
        emoji: "🎁",
        reward: "Gratis Überraschung",
        style: "Modern Premium"
    }

    for (const [key, design] of Object.entries(industries)) {
        if (lowerPrompt.includes(key) ||
            (key === 'cafe' && (lowerPrompt.includes('kaffee') || lowerPrompt.includes('coffee'))) ||
            (key === 'barber' && (lowerPrompt.includes('friseur') || lowerPrompt.includes('hair')))) {
            matched = design
            break
        }
    }

    return {
        id: `local_${Date.now()}`,
        name: `${businessName || 'Premium'} Design`,
        colors: matched.colors,
        content: {
            logoText: businessName || "Store",
            headerLabel: "BONUSKARTE",
            headerValue: `#${Math.floor(1000 + Math.random() * 9000)}`,
            primaryLabel: concept === 'STAMP_CARD' ? "DEINE STEMPEL" : "PUNKTE",
            secLabel1: "NÄCHSTE PRÄMIE",
            secValue1: matched.reward,
            auxLabel1: "POWERED BY",
            auxValue1: "QARD"
        },
        stampIcon: matched.emoji,
        style: matched.style
    }
}
