"use client"

import { CampaignDashboard } from "@/components/admin/CampaignDashboard"
import { useState, useEffect } from "react"

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [id, setId] = useState<string | null>(null)

    useEffect(() => {
        params.then(p => setId(p.id))
    }, [params])

    if (!id) return null

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <CampaignDashboard campaignId={id} />
        </div>
    )
}
