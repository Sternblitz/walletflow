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
    const designAssets = campaign.design_assets || {}

    // Extract branding colors
    const bgColor = designAssets.colors?.backgroundColor || '#1A1A1A'
    const fgColor = designAssets.colors?.foregroundColor || '#FFFFFF'
    const accentColor = designAssets.colors?.labelColor || '#888888'

    // Extract logo (Campaign logo > Client logo)
    const campaignLogo = designAssets.images?.logo?.url
    const logoUrl = campaignLogo || client.logo_url

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
            personalization={personalization}
        />
    )
}
