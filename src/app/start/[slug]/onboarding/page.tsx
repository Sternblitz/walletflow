import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { OnboardingForm } from "./onboarding-form"

interface PageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ campaignId?: string; platform?: string }>
}

export default async function OnboardingPage({ params, searchParams }: PageProps) {
    const { slug } = await params
    const { campaignId, platform = 'ios' } = await searchParams

    const supabase = await createClient()

    // Fetch client and campaign data
    const { data: client, error } = await supabase
        .from('clients')
        .select('id, name, logo_url, campaigns(id, config, design_assets)')
        .eq('slug', slug)
        .single()

    if (error || !client || !client.campaigns || client.campaigns.length === 0) {
        notFound()
    }

    // Find specific campaign or use first
    const campaign = campaignId
        ? client.campaigns.find((c: any) => c.id === campaignId) || client.campaigns[0]
        : client.campaigns[0]

    const config = campaign.config || {}
    const personalization = config.personalization || {}
    const onboardingDesign = config.onboardingDesign || {}
    const designAssets = campaign.design_assets || {}

    // Extract branding colors - prioritize onboardingDesign, fallback to wallet card colors
    const walletBgColor = designAssets.colors?.backgroundColor || '#1A1A1A'
    const walletFgColor = designAssets.colors?.foregroundColor || '#FFFFFF'
    const walletAccentColor = designAssets.colors?.labelColor || '#888888'

    // Use onboardingDesign if set, otherwise fallback to wallet colors
    const bgColor = onboardingDesign.bgColor || walletBgColor
    const fgColor = onboardingDesign.fgColor || walletFgColor
    const accentColor = onboardingDesign.accentColor || walletAccentColor
    const formBgColor = onboardingDesign.formBgColor || '#FFFFFF'
    const formTextColor = onboardingDesign.formTextColor || '#1F2937'

    // New design options
    const backgroundStyle = onboardingDesign.backgroundStyle || 'solid'
    const glowBorderColor = onboardingDesign.useSeparateGlowColor
        ? (onboardingDesign.glowBorderColor || accentColor)
        : accentColor

    // Effect-specific settings
    const gradientSettings = onboardingDesign.gradientSettings
    const radialSettings = onboardingDesign.radialSettings
    const animatedSettings = onboardingDesign.animatedSettings
    const meshSettings = onboardingDesign.meshSettings
    const noiseSettings = onboardingDesign.noiseSettings
    const orbsSettings = onboardingDesign.orbsSettings

    // Extract logo - onboardingDesign logo > Campaign logo > Client logo
    const campaignLogo = designAssets.images?.logo?.url
    const logoUrl = onboardingDesign.logoUrl || campaignLogo || client.logo_url

    // Custom title/description from onboardingDesign
    const customTitle = onboardingDesign.title
    const customDescription = onboardingDesign.description

    return (
        <OnboardingForm
            slug={slug}
            campaignId={campaign.id}
            platform={platform}
            clientName={client.name}
            logoUrl={logoUrl}
            bgColor={bgColor}
            fgColor={fgColor}
            accentColor={accentColor}
            formBgColor={formBgColor}
            formTextColor={formTextColor}
            backgroundStyle={backgroundStyle}
            glowBorderColor={glowBorderColor}
            gradientSettings={gradientSettings}
            radialSettings={radialSettings}
            animatedSettings={animatedSettings}
            meshSettings={meshSettings}
            noiseSettings={noiseSettings}
            orbsSettings={orbsSettings}
            customTitle={customTitle}
            customDescription={customDescription}
            personalization={personalization}
        />
    )
}
