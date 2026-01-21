"use client"

import { useState, useEffect } from "react"
import { MarketingDesigner } from "@/components/marketing/marketing-designer"
import { Loader2 } from "lucide-react"

interface CampaignData {
    id: string
    name: string
    slug: string
    color: string
    logoUrl?: string
    maxStamps?: number
    reward?: string
}

export default function MarketingPage({ params }: { params: Promise<{ id: string }> }) {
    const [campaign, setCampaign] = useState<CampaignData | null>(null)
    const [loading, setLoading] = useState(true)
    const [campaignId, setCampaignId] = useState<string | null>(null)

    useEffect(() => {
        params.then(p => setCampaignId(p.id))
    }, [params])

    useEffect(() => {
        if (campaignId) {
            fetchCampaign()
        }
    }, [campaignId])

    const fetchCampaign = async () => {
        if (!campaignId) return
        try {
            const response = await fetch(`/api/campaign/${campaignId}`)
            const data = await response.json()
            if (data.campaign) {
                const designAssets = data.campaign.design_assets || {}
                const config = data.campaign.config || {}

                // Extract accent color from design assets or config
                const accentColor = designAssets.colors?.accent ||
                    designAssets.backgroundColor ||
                    config.accentColor ||
                    '#000000'

                // Extract logo from design assets
                const logoUrl = designAssets.images?.logo?.url ||
                    designAssets.logoUrl ||
                    null

                // Extract stamp info
                const maxStamps = designAssets.stampConfig?.total ||
                    config.maxStamps ||
                    10

                // Extract reward text
                const reward = config.rewardText ||
                    designAssets.rewardText ||
                    '1x Gratis'

                setCampaign({
                    id: data.campaign.id,
                    name: data.campaign.client?.name || data.campaign.name,
                    slug: data.campaign.client?.slug,
                    color: accentColor,
                    logoUrl: logoUrl,
                    maxStamps: maxStamps,
                    reward: reward
                })
            }
        } catch (error) {
            console.error('Error fetching campaign:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    if (!campaign) {
        return <div className="p-8 text-white">Kampagne nicht gefunden.</div>
    }

    return (
        <div className="h-full flex-1 bg-zinc-950 text-white overflow-hidden">
            <MarketingDesigner campaign={campaign} />
        </div>
    )
}
