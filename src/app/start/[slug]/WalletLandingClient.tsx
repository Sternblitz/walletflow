'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConsentCheckbox } from '@/components/wallet/ConsentCheckbox'
import { BenefitsPopup } from '@/components/wallet/BenefitsPopup'

interface WalletLandingClientProps {
    slug: string
    clientId: string
    clientName: string
    clientLogo?: string
    campaignId: string
    requiresOnboarding: boolean
    bgColor: string
    fgColor: string
    accentColor: string
    smartLinkUrl: string
    isMobile: boolean
    detectedPlatform: 'ios' | 'android' | 'desktop'
}

export function WalletLandingClient({
    slug,
    clientId,
    clientName,
    clientLogo,
    campaignId,
    requiresOnboarding,
    bgColor,
    fgColor,
    accentColor,
    smartLinkUrl,
    isMobile,
    detectedPlatform,
}: WalletLandingClientProps) {
    const router = useRouter()
    const [consentAccepted, setConsentAccepted] = useState(false)
    const [showPopup, setShowPopup] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<'apple' | 'google' | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showConsentError, setShowConsentError] = useState(false)

    const handleWalletButtonClick = (platform: 'apple' | 'google') => {
        if (!consentAccepted) {
            setShowConsentError(true)
            // Auto-hide error after 3 seconds
            setTimeout(() => setShowConsentError(false), 3000)
            return
        }
        setSelectedPlatform(platform)
        setShowPopup(true)
    }

    const handlePopupChoice = async (withBenefits: boolean) => {
        if (!selectedPlatform) return

        setIsLoading(true)
        setShowPopup(false)

        try {
            // Log consent to API
            await fetch('/api/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    clientId,
                    consentPrivacyTerms: true,
                    consentBenefitsMarketing: withBenefits,
                    platform: selectedPlatform,
                }),
            })
        } catch (error) {
            console.error('Failed to log consent:', error)
            // Continue anyway - don't block user
        }

        // Determine where to redirect
        const platform = selectedPlatform === 'apple' ? 'ios' : 'android'

        if (requiresOnboarding) {
            router.push(`/start/${slug}/onboarding?campaignId=${campaignId}&platform=${platform}`)
        } else {
            // Direct to pass issue
            window.location.href = `/api/pass/issue?campaignId=${campaignId}&platform=${platform}`
        }
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-6"
            style={{ backgroundColor: bgColor, color: fgColor }}
        >
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-20"
                    style={{ backgroundColor: accentColor }}
                />
                <div
                    className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-20"
                    style={{ backgroundColor: accentColor }}
                />
            </div>

            <div className="relative z-10">
                {/* Logo */}
                {clientLogo && (
                    <img
                        src={clientLogo}
                        alt={clientName}
                        className="w-24 h-24 mx-auto mb-4 rounded-2xl object-cover shadow-lg"
                    />
                )}

                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{clientName}</h1>
                <p className="text-gray-400 mb-6">
                    {isMobile
                        ? 'Füge deine Karte zum Wallet hinzu'
                        : 'Scanne diesen Code mit deinem Smartphone'
                    }
                </p>
            </div>

            {/* QR Code (Desktop only) */}
            {!isMobile && (
                <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl">
                    <div className="w-64 h-64 flex items-center justify-center">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(smartLinkUrl)}`}
                            alt="QR Code"
                            className="w-full h-full"
                        />
                    </div>
                    <p className="text-gray-500 text-sm mt-4 font-mono">{slug}</p>
                </div>
            )}

            {/* Consent Checkbox */}
            <div className="relative z-10 max-w-md w-full px-4">
                <ConsentCheckbox
                    accentColor={accentColor}
                    textColor={fgColor}
                    onConsentChange={(accepted) => {
                        setConsentAccepted(accepted)
                        if (accepted) setShowConsentError(false)
                    }}
                />

                {/* Consent Error Message */}
                {showConsentError && (
                    <div className="mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm animate-shake">
                        Bitte akzeptiere zuerst die Datenschutzerklärung und Nutzungsbedingungen.
                    </div>
                )}
            </div>

            {/* Platform Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 items-center mt-2 w-full max-w-md px-4">
                {/* Apple Wallet Button */}
                <button
                    onClick={() => handleWalletButtonClick('apple')}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full font-medium transition-all duration-200 ${consentAccepted
                            ? 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple Wallet
                </button>

                {/* Google Wallet Button */}
                <button
                    onClick={() => handleWalletButtonClick('google')}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full font-medium transition-all duration-200 ${consentAccepted
                            ? 'bg-white text-black border border-gray-200 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-gray-600 text-gray-400 border border-gray-500 cursor-not-allowed'
                        }`}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.523 2.047a.5.5 0 0 0-.77-.064l-2.342 2.342a8.46 8.46 0 0 0-4.822 0L7.247 1.983a.5.5 0 0 0-.77.064 9.96 9.96 0 0 0-2.452 6.538V20.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-2.465a8.46 8.46 0 0 0 7.95 0V20.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V8.585a9.96 9.96 0 0 0-2.452-6.538z" />
                    </svg>
                    Google Wallet
                </button>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="relative z-10 flex items-center gap-2 text-gray-400">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Wird vorbereitet...
                </div>
            )}

            {/* Footer */}
            <div className="relative z-10 mt-6 text-gray-500 text-sm">
                <p>Powered by <span className="font-semibold">QARD</span></p>
            </div>

            {/* Benefits Popup */}
            <BenefitsPopup
                isOpen={showPopup}
                platform={selectedPlatform || 'apple'}
                accentColor={accentColor}
                onAccept={handlePopupChoice}
            />

            {/* Shake animation */}
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    )
}
