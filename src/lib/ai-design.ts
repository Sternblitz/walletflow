export interface FullDesignProposal {
    id: string
    name: string
    colors: {
        background: string
        text: string
        label: string
        accent: string  // For glow effects on stamps
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

export interface GenerateDesignResult {
    design: FullDesignProposal | null
    source: 'gemini' | 'local' | 'local_fallback'
    iconGenerated?: boolean
    error?: string
}

/**
 * Generate a COMPLETE design using Nano Banana AI
 * 
 * This generates:
 * - Premium color scheme with accent for glows
 * - All text content
 * - AI-generated stamp icon (or emoji fallback)
 * 
 * @param prompt - Business description
 * @param businessName - Name of the business
 * @param concept - Card type (STAMP_CARD, etc.)
 * @param generateIcon - If true, generates AI icon (default: true)
 */
export async function generateFullDesign(
    prompt: string,
    businessName?: string,
    concept?: string,
    generateIcon: boolean = true
): Promise<FullDesignProposal | null> {
    try {
        const response = await fetch('/api/design/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                businessName,
                concept,
                generateIcon
            })
        })

        if (!response.ok) {
            throw new Error('API request failed')
        }

        const data: GenerateDesignResult = await response.json()

        if (data.iconGenerated) {
            console.log("✅ AI Stamp Icon generated!")
        }

        return data.design || null
    } catch (error) {
        console.error("Full design generation error:", error)
        return null
    }
}

// Legacy interface for backwards compatibility
export interface DesignProposal {
    id: string
    name: string
    colors: {
        primary: string
        secondary: string
        accent: string
        background: string
        text: string
        label: string
    }
    typography: string
    style: string
    emoji: string
}

/**
 * @deprecated Use generateFullDesign instead
 */
export async function generateDesignProposals(prompt: string): Promise<DesignProposal[]> {
    const design = await generateFullDesign(prompt)
    if (!design) return []

    return [{
        id: design.id,
        name: design.name,
        colors: {
            primary: design.colors.accent,
            secondary: design.colors.label,
            accent: design.colors.accent,
            background: design.colors.background,
            text: design.colors.text,
            label: design.colors.label
        },
        typography: "Inter",
        style: design.style,
        emoji: design.stampIcon
    }]
}
