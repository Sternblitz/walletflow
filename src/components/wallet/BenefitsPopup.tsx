'use client'

import { useEffect, useState } from 'react'

interface BenefitsPopupProps {
    isOpen: boolean
    platform: 'apple' | 'google'
    accentColor?: string
    onAccept: (withBenefits: boolean) => void
    onClose?: () => void
}

export function BenefitsPopup({
    isOpen,
    platform,
    accentColor = '#22C55E',
    onAccept,
    onClose,
}: BenefitsPopupProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true)
                })
            })
        } else {
            setIsAnimating(false)
            const timer = setTimeout(() => setIsVisible(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isVisible) return null

    const handleWithBenefits = () => {
        onAccept(true)
    }

    const handleWithoutBenefits = () => {
        onAccept(false)
    }

    const platformName = platform === 'apple' ? 'Apple Wallet' : 'Google Wallet'

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isAnimating ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'
                }`}
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) {
                    onClose()
                }
            }}
        >
            {/* Popup Card - Light Theme */}
            <div
                className={`relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${isAnimating
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 translate-y-4'
                    }`}
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            >
                {/* Content */}
                <div className="p-7 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    </div>

                    {/* Headline */}
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Exklusive Vorteile aktivieren?
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        Erhalte <span className="font-semibold text-gray-800">Rabatte, Gutscheinaktionen</span> und{' '}
                        <span className="font-semibold text-gray-800">besondere Überraschungen</span> – direkt per Push auf deine {platformName}-Karte.
                    </p>

                    {/* Primary Button - Green CTA */}
                    <button
                        onClick={handleWithBenefits}
                        className="w-full py-3.5 px-6 rounded-xl text-white font-semibold text-base shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] mb-3 flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                        }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Ja, Vorteile aktivieren
                    </button>

                    {/* Secondary Button */}
                    <button
                        onClick={handleWithoutBenefits}
                        className="w-full py-2.5 px-6 rounded-xl text-gray-500 font-medium text-sm transition-all duration-200 hover:text-gray-700 hover:bg-gray-50"
                    >
                        Nein danke, ohne Vorteile fortfahren
                    </button>

                    {/* Trust Note */}
                    <p className="text-gray-400 text-xs mt-5 leading-relaxed flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Jederzeit in den Einstellungen änderbar
                    </p>
                </div>
            </div>
        </div>
    )
}
