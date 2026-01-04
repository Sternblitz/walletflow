"use client"

import { useState, useEffect } from "react"
import { MarketingDesigner } from "@/components/marketing/marketing-designer"
import { Loader2 } from "lucide-react"

export default function MarketingPage({ params }: { params: Promise<{ id: string }> }) {
    const [campaign, setCampaign] = useState<{ id: string, name: string, slug: string, color: string } | null>(null)
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
                // Determine accent color from pass config or fallback
                // Assuming campaign.pass_template_config might hold styling, or we use a default
                // For now, let's extract or default
                const mockColor = data.campaign.pass_template_config?.backgroundColor || '#000000'

                setCampaign({
                    id: data.campaign.id,
                    name: data.campaign.client?.name || data.campaign.name,
                    slug: data.campaign.client?.slug,
                    color: mockColor
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
