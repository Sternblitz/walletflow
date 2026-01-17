'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Star, ExternalLink, Send, Heart, Loader2 } from 'lucide-react'

interface SuccessPageContentProps {
    slug: string
}

function SuccessPageContent({ slug }: SuccessPageContentProps) {
    const searchParams = useSearchParams()
    const [step, setStep] = useState<'loading' | 'success' | 'review'>('loading')
    const [selectedRating, setSelectedRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [reviewStep, setReviewStep] = useState<'rating' | 'negative' | 'positive' | 'thanks'>('rating')
    const [feedbackText, setFeedbackText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [campaignData, setCampaignData] = useState<{
        campaignId: string
        placeId: string | null
        businessName: string
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
        fetch(`/api/campaign/by-slug/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.campaign) {
                    setCampaignData({
                        campaignId: data.campaign.id,
                        placeId: data.campaign.google_place_id,
                        businessName: data.campaign.client?.name || ''
                    })
                }
            })
            .catch(console.error)
    }, [slug])

    // Start pass download & transition to success
    useEffect(() => {
        if (!campaignId || step !== 'loading') return

        const params = new URLSearchParams({
            campaignId,
            platform,
            ...(name && { name }),
            ...(birthday && { birthday }),
            ...(email && { email }),
            ...(phone && { phone }),
        })

        // Small delay then trigger download
        const timer = setTimeout(() => {
            if (platform === 'android') {
                window.location.href = `/api/pass/issue?${params.toString()}`
            } else {
                // Apple: Download via hidden iframe
                const iframe = document.createElement('iframe')
                iframe.style.display = 'none'
                iframe.src = `/api/pass/issue?${params.toString()}`
                document.body.appendChild(iframe)
            }

            // Show success state
            setStep('success')

            // After 2 seconds, show review section
            setTimeout(() => {
                setStep('review')
            }, 2000)
        }, 300)

        return () => clearTimeout(timer)
    }, [campaignId, platform, name, birthday, email, phone, step])

    // Track event
    const trackEvent = async (eventType: string, rating?: number) => {
        if (!campaignData?.campaignId) return
        try {
            await fetch('/api/reviews/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: campaignData.campaignId,
                    eventType,
                    rating,
                    metadata: { trigger: 'pass_added' }
                })
            })
        } catch (e) { console.error(e) }
    }

    // Handle rating click
    const handleRating = async (rating: number) => {
        setSelectedRating(rating)
        await trackEvent('rating_clicked', rating)
        setTimeout(() => {
            if (rating <= 3) {
                setReviewStep('negative')
            } else {
                setReviewStep('positive')
            }
        }, 400)
    }

    // Submit feedback
    const handleSubmitFeedback = async () => {
        if (!campaignData?.campaignId) return
        setIsSubmitting(true)
        try {
            await fetch('/api/reviews/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: campaignData.campaignId,
                    rating: selectedRating,
                    feedbackText: feedbackText.trim() || null
                })
            })
            await trackEvent('feedback_submitted', selectedRating)
            setReviewStep('thanks')
        } catch (e) { console.error(e) }
        setIsSubmitting(false)
    }

    // Google redirect
    const handleGoogleRedirect = async () => {
        await trackEvent('google_redirect', selectedRating)
        if (campaignData?.placeId) {
            window.open(`https://search.google.com/local/writereview?placeid=${campaignData.placeId}`, '_blank')
        }
        setReviewStep('thanks')
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-16 px-6 pb-20">

            {/* Confetti - always shows on success/review */}
            {step !== 'loading' && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: -10,
                                backgroundColor: ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#3B82F6'][i % 6],
                                borderRadius: i % 2 === 0 ? '50%' : '2px',
                                animation: `confetti ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.8}s forwards`
                            }}
                        />
                    ))}
                </div>
            )}

            <style jsx global>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(${Math.random() > 0.5 ? '' : '-'}720deg) scale(0.5); opacity: 0; }
                }
                @keyframes bounce-in {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.3); }
                    70% { transform: scale(0.85); }
                    100% { transform: scale(1); }
                }
                @keyframes fade-slide-up {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
                    50% { box-shadow: 0 0 0 15px rgba(139, 92, 246, 0); }
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
            `}</style>

            {/* Loading */}
            {step === 'loading' && (
                <div className="flex flex-col items-center justify-center flex-1">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                    <p className="text-zinc-500">Deine Karte wird erstellt...</p>
                </div>
            )}

            {/* Success + Review */}
            {step !== 'loading' && (
                <div className="text-center max-w-sm mx-auto relative z-10 w-full">

                    {/* Bouncing Checkmark */}
                    <div
                        className="inline-flex mb-5"
                        style={{ animation: 'bounce-in 0.6s ease-out forwards' }}
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                        </div>
                    </div>

                    {/* Title */}
                    <h1
                        className="text-2xl font-bold text-zinc-900 mb-2"
                        style={{ animation: 'fade-slide-up 0.5s ease-out 0.3s both' }}
                    >
                        Deine Karte ist bereit! 🎉
                    </h1>

                    <p
                        className="text-zinc-500 text-sm mb-8"
                        style={{ animation: 'fade-slide-up 0.5s ease-out 0.4s both' }}
                    >
                        Füge sie jetzt zu deiner Wallet hinzu!
                    </p>

                    {/* Review Section - Always shows after success */}
                    {step === 'review' && (
                        <div
                            className="bg-gradient-to-b from-violet-50 to-white rounded-3xl border-2 border-violet-100 p-6 shadow-xl"
                            style={{ animation: 'fade-slide-up 0.6s ease-out both' }}
                        >
                            {/* Rating Step */}
                            {reviewStep === 'rating' && (
                                <>
                                    <div
                                        className="text-4xl mb-3"
                                        style={{ animation: 'wiggle 0.5s ease-in-out' }}
                                    >
                                        ⭐
                                    </div>
                                    <p className="text-lg font-bold text-zinc-800 mb-1">
                                        Eine Sekunde noch?
                                    </p>
                                    <p className="text-sm text-zinc-500 mb-5">
                                        Dein Feedback bedeutet uns die Welt! 💜
                                    </p>

                                    {/* Stars */}
                                    <div className="flex justify-center gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => handleRating(star)}
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                className="p-1 transition-transform hover:scale-125 active:scale-95"
                                            >
                                                <Star
                                                    className={`w-11 h-11 transition-all duration-150 ${(hoveredRating || selectedRating) >= star
                                                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                                                            : 'text-zinc-200'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <p className="text-xs text-zinc-400">
                                        Tippe auf die Sterne ✨
                                    </p>
                                </>
                            )}

                            {/* Negative Feedback (1-3 stars) */}
                            {reviewStep === 'negative' && (
                                <>
                                    <div className="text-4xl mb-3">🙏</div>
                                    <p className="text-lg font-bold text-zinc-800 mb-2">
                                        Danke für dein Feedback!
                                    </p>
                                    <p className="text-sm text-zinc-500 mb-4">
                                        Was können wir besser machen?
                                    </p>

                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Dein Feedback... (optional)"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-violet-400 resize-none mb-4 text-sm"
                                    />

                                    <button
                                        onClick={handleSubmitFeedback}
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                        {isSubmitting ? 'Senden...' : 'Absenden'}
                                    </button>

                                    <button
                                        onClick={() => setReviewStep('thanks')}
                                        className="mt-3 text-xs text-zinc-400 hover:text-zinc-600"
                                    >
                                        Überspringen
                                    </button>
                                </>
                            )}

                            {/* Positive → Google (4-5 stars) */}
                            {reviewStep === 'positive' && (
                                <>
                                    <div className="text-5xl mb-3">🤩</div>
                                    <p className="text-xl font-bold text-zinc-800 mb-2">
                                        Wow, danke!
                                    </p>
                                    <p className="text-sm text-zinc-600 mb-5">
                                        Würdest du das auch auf <strong>Google</strong> teilen?<br />
                                        <span className="text-violet-600 font-medium">Das hilft uns riesig! 🚀</span>
                                    </p>

                                    <button
                                        onClick={handleGoogleRedirect}
                                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                                    >
                                        <Star className="w-5 h-5 fill-white" />
                                        Auf Google bewerten
                                        <ExternalLink className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => setReviewStep('thanks')}
                                        className="mt-4 text-xs text-zinc-400 hover:text-zinc-600"
                                    >
                                        Vielleicht später
                                    </button>
                                </>
                            )}

                            {/* Thank You */}
                            {reviewStep === 'thanks' && (
                                <div style={{ animation: 'fade-slide-up 0.4s ease-out' }}>
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Heart className="w-8 h-8 text-white fill-white" />
                                    </div>
                                    <p className="text-xl font-bold text-zinc-800 mb-1">
                                        Danke! 💚
                                    </p>
                                    <p className="text-sm text-zinc-500">
                                        Du bist großartig!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <p
                        className="text-xs text-zinc-400 mt-8"
                        style={{ animation: 'fade-slide-up 0.5s ease-out 0.6s both' }}
                    >
                        Du kannst diese Seite schließen.
                    </p>
                </div>
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
        )
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
        }>
            <SuccessPageContent slug={slug} />
        </Suspense>
    )
}
