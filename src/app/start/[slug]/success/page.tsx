'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Star, ExternalLink, Send, Heart, Sparkles, Loader2 } from 'lucide-react'

interface SuccessPageContentProps {
    slug: string
}

function SuccessPageContent({ slug }: SuccessPageContentProps) {
    const searchParams = useSearchParams()
    const [passDownloadStarted, setPassDownloadStarted] = useState(false)
    const [showReview, setShowReview] = useState(false)
    const [selectedRating, setSelectedRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [reviewStep, setReviewStep] = useState<'rating' | 'negative' | 'positive' | 'thanks'>('rating')
    const [feedbackText, setFeedbackText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

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

    // Fetch campaign data
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
                            passId: null,
                            placeId: data.campaign.google_place_id,
                            businessName: data.campaign.client?.name || data.campaign.name || '',
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

    // Start pass download
    useEffect(() => {
        if (!campaignId || passDownloadStarted) return

        const params = new URLSearchParams({
            campaignId,
            platform,
            ...(name && { name }),
            ...(birthday && { birthday }),
            ...(email && { email }),
            ...(phone && { phone }),
        })

        const timer = setTimeout(() => {
            setPassDownloadStarted(true)

            if (platform === 'android') {
                window.location.href = `/api/pass/issue?${params.toString()}`
            } else {
                // Apple: Trigger download via iframe
                const iframe = document.createElement('iframe')
                iframe.style.display = 'none'
                iframe.src = `/api/pass/issue?${params.toString()}`
                document.body.appendChild(iframe)

                // Show review section after delay
                if (campaignData?.placeId) {
                    setTimeout(() => setShowReview(true), 2000)
                }
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [campaignId, platform, name, birthday, email, phone, passDownloadStarted, campaignData?.placeId])

    // Track event
    const trackEvent = async (eventType: string, rating?: number, metadata?: object) => {
        try {
            await fetch('/api/reviews/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passId: campaignData?.passId,
                    campaignId: campaignData?.campaignId,
                    eventType,
                    rating,
                    metadata: { trigger: 'pass_added', ...metadata }
                })
            })
        } catch (e) {
            console.error('Track error:', e)
        }
    }

    // Handle rating
    const handleRating = async (rating: number) => {
        setSelectedRating(rating)
        await trackEvent('rating_clicked', rating)

        setTimeout(() => {
            if (rating <= 3) {
                setReviewStep('negative')
            } else {
                setReviewStep('positive')
            }
        }, 300)
    }

    // Submit feedback
    const handleSubmitFeedback = async () => {
        setIsSubmitting(true)
        try {
            await fetch('/api/reviews/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passId: campaignData?.passId,
                    campaignId: campaignData?.campaignId,
                    rating: selectedRating,
                    feedbackText: feedbackText.trim() || null
                })
            })
            await trackEvent('feedback_submitted', selectedRating)
            setReviewStep('thanks')
        } catch (e) {
            console.error('Feedback error:', e)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Google redirect
    const handleGoogleRedirect = async () => {
        await trackEvent('google_redirect', selectedRating)
        window.open(`https://search.google.com/local/writereview?placeid=${campaignData?.placeId}`, '_blank')
        setReviewStep('thanks')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 flex flex-col items-center justify-center p-6">

            {/* Confetti */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {passDownloadStarted && Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-3 h-3 rounded-sm opacity-80"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: -20,
                            backgroundColor: ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#EF4444'][Math.floor(Math.random() * 6)],
                            animation: `confetti-fall ${2.5 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes check-bounce {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                @keyframes fade-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Main Content */}
            <div className="text-center max-w-md mx-auto relative z-10">

                {/* Success Check Animation */}
                <div
                    className="relative inline-flex mb-6"
                    style={{ animation: passDownloadStarted ? 'check-bounce 0.6s ease-out' : 'none' }}
                >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
                        <Check className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                    <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-3xl font-bold text-zinc-900 mb-3"
                    style={{ animation: passDownloadStarted ? 'fade-up 0.5s ease-out 0.2s both' : 'none' }}
                >
                    Deine Karte ist bereit! 🎉
                </h1>

                <p
                    className="text-zinc-500 mb-8"
                    style={{ animation: passDownloadStarted ? 'fade-up 0.5s ease-out 0.3s both' : 'none' }}
                >
                    Füge sie jetzt zu deiner Wallet hinzu, um Stempel zu sammeln!
                </p>

                {/* Review Section - appears after download */}
                {showReview && campaignData?.placeId && (
                    <div
                        className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-6 mt-4"
                        style={{ animation: 'fade-up 0.5s ease-out both' }}
                    >
                        {/* Rating Step */}
                        {reviewStep === 'rating' && (
                            <>
                                <div className="mb-4">
                                    <p className="text-lg font-semibold text-zinc-800 mb-1">
                                        Wie gefällt dir das? ✨
                                    </p>
                                    <p className="text-sm text-zinc-500">
                                        Dein Feedback hilft uns sehr!
                                    </p>
                                </div>

                                {/* Stars */}
                                <div className="flex justify-center gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="transition-all duration-150 hover:scale-110 active:scale-95"
                                        >
                                            <Star
                                                className={`w-10 h-10 transition-colors ${(hoveredRating || selectedRating) >= star
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-zinc-200'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <p className="text-xs text-zinc-400">
                                    Tippe auf die Sterne
                                </p>
                            </>
                        )}

                        {/* Negative Feedback (1-3 stars) */}
                        {reviewStep === 'negative' && (
                            <>
                                <div className="text-4xl mb-3">😔</div>
                                <p className="text-lg font-semibold text-zinc-800 mb-2">
                                    Das tut uns leid!
                                </p>
                                <p className="text-sm text-zinc-500 mb-4">
                                    Was können wir verbessern?
                                </p>

                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Dein Feedback ist uns wichtig... (optional)"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none mb-4"
                                />

                                <button
                                    onClick={handleSubmitFeedback}
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {isSubmitting ? 'Wird gesendet...' : 'Absenden'}
                                </button>

                                <button
                                    onClick={() => setReviewStep('thanks')}
                                    className="mt-3 text-sm text-zinc-400 hover:text-zinc-600"
                                >
                                    Überspringen
                                </button>
                            </>
                        )}

                        {/* Positive (4-5 stars) → Google */}
                        {reviewStep === 'positive' && (
                            <>
                                <div className="text-4xl mb-3">🎉</div>
                                <p className="text-lg font-semibold text-zinc-800 mb-2">
                                    Mega, danke dir!
                                </p>
                                <p className="text-sm text-zinc-500 mb-5">
                                    Würdest du das auch auf <strong>Google</strong> teilen?<br />
                                    <span className="text-violet-600">Das hilft uns riesig! 💜</span>
                                </p>

                                <button
                                    onClick={handleGoogleRedirect}
                                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Star className="w-5 h-5 fill-white" />
                                    Auf Google bewerten
                                    <ExternalLink className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => setReviewStep('thanks')}
                                    className="mt-3 text-sm text-zinc-400 hover:text-zinc-600"
                                >
                                    Vielleicht später
                                </button>
                            </>
                        )}

                        {/* Thank You */}
                        {reviewStep === 'thanks' && (
                            <>
                                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                    <Heart className="w-8 h-8 text-white fill-white" />
                                </div>
                                <p className="text-lg font-semibold text-zinc-800 mb-1">
                                    Vielen Dank! 💚
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Das bedeutet uns wirklich viel.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Loading state */}
                {!passDownloadStarted && (
                    <div className="flex items-center justify-center gap-2 text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Wird erstellt...</span>
                    </div>
                )}

                {/* Footer hint */}
                <p className="text-xs text-zinc-400 mt-8">
                    Du kannst diese Seite schließen, sobald die Karte in deiner Wallet ist.
                </p>
            </div>
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-300 animate-spin" />
            </div>
        )
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-300 animate-spin" />
            </div>
        }>
            <SuccessPageContent slug={slug} />
        </Suspense>
    )
}
