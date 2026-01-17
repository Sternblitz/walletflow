'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ReviewGateModal } from '@/components/ReviewGateModal'
import { Check, Wallet, Download, Loader2 } from 'lucide-react'

interface SuccessPageContentProps {
    slug: string
}

function SuccessPageContent({ slug }: SuccessPageContentProps) {
    const searchParams = useSearchParams()
    const [passDownloadStarted, setPassDownloadStarted] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [campaignData, setCampaignData] = useState<{
        campaignId: string
        passId: string | null
        placeId: string | null
        businessName: string
        logoUrl: string | null
        accentColor: string
    } | null>(null)

    const campaignId = searchParams.get('campaignId')
    const platform = searchParams.get('platform') || 'ios'
    const name = searchParams.get('name')
    const birthday = searchParams.get('birthday')
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')

    // Fetch campaign data for review modal
    useEffect(() => {
        if (!slug) return

        const fetchCampaign = async () => {
            try {
                const res = await fetch(`/api/campaign/by-slug/${slug}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.campaign) {
                        setCampaignData({
                            campaignId: data.campaign.id,
                            passId: null, // Will be set after pass is created
                            placeId: data.campaign.google_place_id,
                            businessName: data.campaign.client?.name || data.campaign.name || 'Unbekannt',
                            logoUrl: data.campaign.design_assets?.images?.logo?.url || null,
                            accentColor: data.campaign.design_assets?.colors?.backgroundColor || '#8B5CF6'
                        })
                    }
                }
            } catch (e) {
                console.error('Failed to fetch campaign:', e)
            }
        }

        fetchCampaign()
    }, [slug])

    // Start pass download after component mounts
    useEffect(() => {
        if (!campaignId || passDownloadStarted) return

        // Build query params for pass issue
        const params = new URLSearchParams({
            campaignId,
            platform,
            ...(name && { name }),
            ...(birthday && { birthday }),
            ...(email && { email }),
            ...(phone && { phone }),
        })

        // Open pass download in same window after a small delay
        const timer = setTimeout(() => {
            setPassDownloadStarted(true)

            // For iOS/Apple: Open the pass download which will trigger the native "Add to Wallet" sheet
            // For Android/Google: Redirect to Google's save URL
            if (platform === 'android') {
                // Google Wallet: Redirect to save URL
                window.location.href = `/api/pass/issue?${params.toString()}`
            } else {
                // Apple Wallet: Open in a new tab or same window
                // Use an iframe approach to trigger download while staying on success page
                const iframe = document.createElement('iframe')
                iframe.style.display = 'none'
                iframe.src = `/api/pass/issue?${params.toString()}`
                document.body.appendChild(iframe)

                // Show review popup after pass download is triggered
                if (campaignData?.placeId) {
                    setTimeout(() => {
                        setShowReviewModal(true)
                    }, 1500)
                }
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [campaignId, platform, name, birthday, email, phone, passDownloadStarted, campaignData?.placeId])

    // For Google Wallet, we redirect so this page won't show long
    // For Apple Wallet, we show the success page with review popup

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-4">
            {/* Confetti effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="confetti-piece absolute w-3 h-3 rounded-sm"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: -20,
                            backgroundColor: ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981'][Math.floor(Math.random() * 5)],
                            animation: `fall ${2 + Math.random() * 2}s ease-out ${Math.random()}s forwards`
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `}</style>

            {/* Success Content */}
            <div className="text-center max-w-md mx-auto relative z-10">
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
                    Deine Karte ist bereit! 🎉
                </h1>

                <p className="text-zinc-400 mb-8">
                    {passDownloadStarted
                        ? platform === 'android'
                            ? 'Du wirst zu Google Wallet weitergeleitet...'
                            : 'Die Karte wird heruntergeladen. Füge sie zur Wallet hinzu!'
                        : 'Einen Moment, deine Karte wird erstellt...'}
                </p>

                {!passDownloadStarted ? (
                    <div className="flex items-center justify-center gap-2 text-violet-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Wird erstellt...</span>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-zinc-300">Karte erfolgreich erstellt</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Download className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-zinc-300">Download gestartet</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-violet-400" />
                            </div>
                            <span className="text-zinc-300">Zur Wallet hinzufügen</span>
                        </div>
                    </div>
                )}

                <p className="text-sm text-zinc-500 mt-6">
                    Nach dem Hinzufügen kannst du diese Seite schließen.
                </p>
            </div>

            {/* Review Gate Modal */}
            {campaignData?.placeId && (
                <ReviewGateModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    placeId={campaignData.placeId}
                    campaignId={campaignData.campaignId}
                    passId={campaignData.passId || undefined}
                    businessName={campaignData.businessName}
                    logoUrl={campaignData.logoUrl || undefined}
                    trigger="pass_added"
                    accentColor={campaignData.accentColor}
                />
            )}
        </div>
    )
}

interface SuccessPageProps {
    params: Promise<{ slug: string }>
}

export default function SuccessPage({ params }: SuccessPageProps) {
    const [slug, setSlug] = useState<string>('')

    useEffect(() => {
        params.then(p => setSlug(p.slug))
    }, [params])

    if (!slug) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        }>
            <SuccessPageContent slug={slug} />
        </Suspense>
    )
}
