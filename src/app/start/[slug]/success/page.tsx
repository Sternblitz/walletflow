'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ReviewGateModal } from '@/components/ReviewGateModal'
import { Check, Wallet } from 'lucide-react'

interface SuccessPageProps {
    params: Promise<{ slug: string }>
}

export default function SuccessPage({ params }: SuccessPageProps) {
    const searchParams = useSearchParams()
    const [slug, setSlug] = useState<string>('')
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [campaignData, setCampaignData] = useState<{
        campaignId: string
        passId: string
        placeId: string | null
        businessName: string
        logoUrl: string | null
        accentColor: string
    } | null>(null)

    const campaignId = searchParams.get('campaignId')
    const passId = searchParams.get('passId')

    // Get slug
    useEffect(() => {
        params.then(p => setSlug(p.slug))
    }, [params])

    // Fetch campaign data for review modal
    useEffect(() => {
        if (!campaignId) return

        const fetchCampaign = async () => {
            try {
                const res = await fetch(`/api/campaign/by-slug/${slug}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.campaign) {
                        setCampaignData({
                            campaignId: data.campaign.id,
                            passId: passId || '',
                            placeId: data.campaign.google_place_id,
                            businessName: data.campaign.client?.name || data.campaign.name || 'Unbekannt',
                            logoUrl: data.campaign.design_assets?.images?.logo?.url || null,
                            accentColor: data.campaign.design_assets?.colors?.backgroundColor || '#8B5CF6'
                        })

                        // Show review modal after 1 second if place_id is set
                        if (data.campaign.google_place_id) {
                            setTimeout(() => {
                                setShowReviewModal(true)
                            }, 1000)
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to fetch campaign:', e)
            }
        }

        if (slug) {
            fetchCampaign()
        }
    }, [campaignId, passId, slug])

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-4">
            {/* Success Content */}
            <div className="text-center max-w-md mx-auto">
                {/* Animated Check */}
                <div className="relative inline-flex mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce">
                        <Check className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                    <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    Karte hinzugefügt! 🎉
                </h1>

                <p className="text-zinc-400 mb-8">
                    Deine Kundenkarte wurde erfolgreich zu deinem Wallet hinzugefügt.
                    Du findest sie jetzt in deiner Wallet-App.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-zinc-300">Karte erfolgreich erstellt</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-zinc-300">Zum Wallet hinzugefügt</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-zinc-300">Bereit zum Scannen</span>
                    </div>
                </div>

                <p className="text-sm text-zinc-500 mt-6">
                    Du kannst diese Seite jetzt schließen.
                </p>
            </div>

            {/* Review Gate Modal */}
            {campaignData?.placeId && (
                <ReviewGateModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    placeId={campaignData.placeId}
                    campaignId={campaignData.campaignId}
                    passId={campaignData.passId}
                    businessName={campaignData.businessName}
                    logoUrl={campaignData.logoUrl || undefined}
                    trigger="pass_added"
                    accentColor={campaignData.accentColor}
                />
            )}
        </div>
    )
}
