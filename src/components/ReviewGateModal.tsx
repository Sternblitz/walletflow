'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, ExternalLink, Send, Heart, Sparkles } from 'lucide-react'

interface ReviewGateModalProps {
    isOpen: boolean
    onClose: () => void
    placeId: string
    campaignId: string
    passId?: string
    businessName: string
    logoUrl?: string
    trigger: 'pass_added' | 'qr_scan'
    accentColor?: string
}

// Confetti particle
function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
    const randomX = Math.random() * 100
    const randomRotate = Math.random() * 360
    const randomDuration = 2 + Math.random() * 2

    return (
        <motion.div
            className="absolute w-3 h-3 rounded-sm"
            style={{
                left: `${randomX}%`,
                top: -20,
                backgroundColor: color,
            }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
                y: '100vh',
                rotate: randomRotate + 720,
                opacity: [1, 1, 0]
            }}
            transition={{
                duration: randomDuration,
                delay: delay,
                ease: 'easeOut'
            }}
        />
    )
}

// Confetti explosion
function Confetti() {
    const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#EF4444']
    const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
    }))

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
            {pieces.map(piece => (
                <ConfettiPiece key={piece.id} delay={piece.delay} color={piece.color} />
            ))}
        </div>
    )
}

// Star Rating Component
function StarRating({
    value,
    onChange,
    size = 'large'
}: {
    value: number;
    onChange: (rating: number) => void;
    size?: 'small' | 'large'
}) {
    const [hovered, setHovered] = useState(0)
    const starSize = size === 'large' ? 'w-12 h-12' : 'w-8 h-8'

    return (
        <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                    key={star}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="focus:outline-none"
                >
                    <Star
                        className={`${starSize} transition-colors ${(hovered || value) >= star
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-zinc-300'
                            }`}
                    />
                </motion.button>
            ))}
        </div>
    )
}

export function ReviewGateModal({
    isOpen,
    onClose,
    placeId,
    campaignId,
    passId,
    businessName,
    logoUrl,
    trigger,
    accentColor = '#8B5CF6'
}: ReviewGateModalProps) {
    const [step, setStep] = useState<'rating' | 'negative_feedback' | 'positive_confirm' | 'thank_you'>('rating')
    const [rating, setRating] = useState(0)
    const [feedbackText, setFeedbackText] = useState('')
    const [showConfetti, setShowConfetti] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Show confetti on open
    useEffect(() => {
        if (isOpen && trigger === 'pass_added') {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
        }
    }, [isOpen, trigger])

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('rating')
                setRating(0)
                setFeedbackText('')
            }, 300)
        }
    }, [isOpen])

    // Track event
    const trackEvent = useCallback(async (eventType: string, eventRating?: number, metadata?: object) => {
        try {
            await fetch('/api/reviews/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passId,
                    campaignId,
                    eventType,
                    rating: eventRating,
                    metadata: { trigger, ...metadata }
                })
            })
        } catch (e) {
            console.error('Failed to track review event:', e)
        }
    }, [passId, campaignId, trigger])

    // Track popup shown
    useEffect(() => {
        if (isOpen) {
            trackEvent('popup_shown')
        }
    }, [isOpen, trackEvent])

    // Handle rating selection
    const handleRating = async (selectedRating: number) => {
        setRating(selectedRating)
        await trackEvent('rating_clicked', selectedRating)

        if (selectedRating <= 3) {
            setStep('negative_feedback')
        } else {
            setStep('positive_confirm')
        }
    }

    // Submit negative feedback
    const handleSubmitFeedback = async () => {
        setIsSubmitting(true)
        try {
            await fetch('/api/reviews/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passId,
                    campaignId,
                    rating,
                    feedbackText: feedbackText.trim() || null
                })
            })
            await trackEvent('feedback_submitted', rating, { hasText: !!feedbackText.trim() })
            setStep('thank_you')
        } catch (e) {
            console.error('Failed to submit feedback:', e)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Redirect to Google
    const handleGoogleRedirect = async () => {
        await trackEvent('google_redirect', rating)
        window.open(`https://search.google.com/local/writereview?placeid=${placeId}`, '_blank')
        onClose()
    }

    // Dismiss
    const handleDismiss = async () => {
        await trackEvent('dismissed', rating || undefined)
        onClose()
    }

    // Messages based on trigger
    const getHeadline = () => {
        if (trigger === 'pass_added') {
            return 'Deine Karte ist bereit! 🎉'
        }
        return 'Danke für deinen Besuch! 🙏'
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Confetti */}
                    {showConfetti && <Confetti />}

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Content */}
                        <div className="p-8 pt-10">
                            <AnimatePresence mode="wait">
                                {/* STEP 1: Rating */}
                                {step === 'rating' && (
                                    <motion.div
                                        key="rating"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center"
                                    >
                                        {/* Logo */}
                                        {logoUrl && (
                                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                                                <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        {/* Headline */}
                                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                                            {getHeadline()}
                                        </h2>

                                        <p className="text-zinc-600 mb-8">
                                            Hast du eine Sekunde? <br />
                                            <span className="font-medium" style={{ color: accentColor }}>
                                                Deine Meinung bedeutet uns wirklich viel! 💜
                                            </span>
                                        </p>

                                        {/* Stars */}
                                        <div className="mb-8">
                                            <StarRating value={rating} onChange={handleRating} />
                                        </div>

                                        {/* Skip */}
                                        <button
                                            onClick={handleDismiss}
                                            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                                        >
                                            Später
                                        </button>
                                    </motion.div>
                                )}

                                {/* STEP 2A: Negative Feedback (1-3 stars) */}
                                {step === 'negative_feedback' && (
                                    <motion.div
                                        key="negative"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center"
                                    >
                                        <div className="w-16 h-16 mx-auto mb-6 bg-zinc-100 rounded-full flex items-center justify-center">
                                            <span className="text-3xl">😔</span>
                                        </div>

                                        <h2 className="text-xl font-bold text-zinc-900 mb-2">
                                            Das tut uns leid!
                                        </h2>

                                        <p className="text-zinc-600 mb-6">
                                            Was können wir verbessern?
                                        </p>

                                        {/* Optional Textarea */}
                                        <textarea
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                            placeholder="Dein Feedback hilft uns, besser zu werden... (optional)"
                                            rows={3}
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none mb-6"
                                        />

                                        {/* Submit */}
                                        <button
                                            onClick={handleSubmitFeedback}
                                            disabled={isSubmitting}
                                            className="w-full py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4" />
                                            {isSubmitting ? 'Wird gesendet...' : 'Absenden'}
                                        </button>

                                        <button
                                            onClick={handleDismiss}
                                            className="mt-4 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                                        >
                                            Überspringen
                                        </button>
                                    </motion.div>
                                )}

                                {/* STEP 2B: Positive Confirm (4-5 stars) */}
                                {step === 'positive_confirm' && (
                                    <motion.div
                                        key="positive"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center"
                                    >
                                        <motion.div
                                            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                        >
                                            <Sparkles className="w-10 h-10 text-white" />
                                        </motion.div>

                                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                                            Wow, danke! 🎉
                                        </h2>

                                        <p className="text-zinc-600 mb-8">
                                            Würdest du das auch auf <strong>Google</strong> teilen?<br />
                                            <span className="text-sm">Das hilft uns enorm! 🙏</span>
                                        </p>

                                        {/* Google Button */}
                                        <motion.button
                                            onClick={handleGoogleRedirect}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-violet-500/30 transition-all"
                                        >
                                            <Star className="w-5 h-5 fill-white" />
                                            Auf Google bewerten
                                            <ExternalLink className="w-4 h-4" />
                                        </motion.button>

                                        <button
                                            onClick={handleDismiss}
                                            className="mt-4 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                                        >
                                            Nein danke
                                        </button>
                                    </motion.div>
                                )}

                                {/* STEP 3: Thank You */}
                                {step === 'thank_you' && (
                                    <motion.div
                                        key="thanks"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-4"
                                    >
                                        <motion.div
                                            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 10 }}
                                        >
                                            <Heart className="w-10 h-10 text-white fill-white" />
                                        </motion.div>

                                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                                            Danke! 💚
                                        </h2>

                                        <p className="text-zinc-600 mb-6">
                                            Dein Feedback hilft uns, besser zu werden.<br />
                                            <span className="text-sm">Wir melden uns!</span>
                                        </p>

                                        <button
                                            onClick={onClose}
                                            className="py-3 px-8 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded-xl transition-colors"
                                        >
                                            Schließen
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
