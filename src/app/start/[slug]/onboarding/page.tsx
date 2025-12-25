'use client'

import { useState } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'

/**
 * Onboarding page for personalized passes
 * Collects customer name/birthday before generating pass
 */
export default function OnboardingPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const slug = params.slug as string
    const campaignId = searchParams.get('campaignId')
    const platform = searchParams.get('platform') || 'ios'

    const [name, setName] = useState('')
    const [birthday, setBirthday] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Build redirect URL with personalization params
        const params = new URLSearchParams({
            campaignId: campaignId || '',
            platform,
            ...(name && { name }),
            ...(birthday && { birthday }),
        })

        // Redirect to pass issue API
        window.location.href = `/api/pass/issue?${params.toString()}`
    }

    const handleSkip = () => {
        // Skip personalization, go directly to pass
        window.location.href = `/api/pass/issue?campaignId=${campaignId}&platform=${platform}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-6">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        Deine persönliche Karte ✨
                    </h1>
                    <p className="text-gray-400">
                        Optional: Personalisiere deine Wallet-Karte
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-300 mb-2"
                            >
                                Dein Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Max Mustermann"
                                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Birthday Field (optional) */}
                        <div>
                            <label
                                htmlFor="birthday"
                                className="block text-sm font-medium text-gray-300 mb-2"
                            >
                                Geburtstag <span className="text-gray-500">(optional)</span>
                            </label>
                            <input
                                type="date"
                                id="birthday"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Für Geburtstagsüberraschungen 🎂
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Karte wird erstellt...
                                </span>
                            ) : (
                                <>
                                    {platform === 'android' ? '📱 Zu Google Wallet hinzufügen' : '📱 Zu Apple Wallet hinzufügen'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Skip Link */}
                    <button
                        onClick={handleSkip}
                        className="w-full mt-4 py-3 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        Überspringen →
                    </button>
                </div>

                {/* Privacy Note */}
                <p className="text-center text-gray-500 text-xs mt-6 px-4">
                    Deine Daten werden nur für deine persönliche Karte verwendet
                    und nicht weitergegeben.
                </p>
            </div>
        </div>
    )
}
