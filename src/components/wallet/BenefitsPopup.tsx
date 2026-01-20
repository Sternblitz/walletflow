'use client'

import { useState } from 'react'

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
    accentColor = '#22C55E', // Default Green
    onAccept,
    onClose,
}: BenefitsPopupProps) {
    const [step, setStep] = useState<'initial' | 'confirm_decline'>('initial')

    if (!isOpen) return null

    const handleWithBenefits = () => {
        onAccept(true)
    }

    const handleInitialDecline = () => {
        setStep('confirm_decline')
    }

    const handleConfirmDecline = () => {
        onAccept(false)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) {
                    onClose()
                }
            }}
        >
            <style jsx>{`
                @keyframes shine-sweep {
                    0% { transform: translateX(-100%) skewX(-20deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateX(200%) skewX(-20deg); opacity: 0; }
                }
                .animate-shine-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
                    transform: translateX(-150%) skewX(-20deg);
                    animation: shine-sweep 1s ease-in-out forwards;
                    animation-delay: 0.5s;
                    pointer-events: none;
                    z-index: 20;
                }
            `}</style>

            <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/20">

                {/* STEP 1: INITIAL OFFER */}
                {step === 'initial' && (
                    <div className="p-8 pt-10 text-center">

                        {/* Bouncing Checkmark Icon - No Background */}
                        <div className="relative mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                            {/* Background Glow (Static behind) */}
                            <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-20"></div>

                            {/* Icon Itself - Bouncing */}
                            <div className="animate-bounce relative z-10" style={{ animationDuration: '2s' }}>
                                {/* Bold Checkmark with Drop Shadow */}
                                <svg className="w-16 h-16 text-green-500 drop-shadow-lg filter" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-[28px] font-bold text-gray-900 mb-3 leading-tight tracking-tight">
                            Vorteile aktivieren 🎁
                        </h2>

                        {/* Main Text */}
                        <p className="text-gray-600 text-[16px] leading-relaxed mb-6 px-1 font-medium">
                            Rabatte, Gutscheinaktionen & Überraschungen direkt in deiner Karte.
                        </p>

                        {/* Mini-Text */}
                        <p className="text-xs text-gray-400 mb-8 px-4 leading-normal">
                            Angebote per Wallet-Push. Jederzeit in der Karte deaktivierbar.
                        </p>

                        {/* Primary Button - Improved Shine */}
                        <button
                            onClick={handleWithBenefits}
                            className="w-full relative overflow-hidden py-4 px-6 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-[17px] shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group"
                        >
                            {/* Shine Element */}
                            <div className="animate-shine-effect"></div>

                            {/* Button Content */}
                            <span className="relative z-10">Ja, Vorteile aktivieren ✅</span>
                        </button>

                        {/* Secondary Link */}
                        <button
                            onClick={handleInitialDecline}
                            className="mt-5 text-[13px] text-gray-400 font-medium hover:text-gray-600 transition-colors py-2 px-4 rounded-lg hover:bg-gray-50 bg-transparent border-none"
                        >
                            Ohne Vorteile fortfahren
                        </button>
                    </div>
                )}

                {/* STEP 2: NEUTRAL CONFIRMATION */}
                {step === 'confirm_decline' && (
                    <div className="p-8 pt-12 pb-10 text-center animate-in slide-in-from-right-4 fade-in duration-300">
                        {/* Neutral Header Icon (Gray) */}
                        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
                            Ohne Vorteile fortfahren?
                        </h2>

                        <p className="text-gray-500 text-[15px] leading-relaxed mb-10 px-2">
                            Du nutzt die Karte dann ohne Angebote.
                        </p>

                        <div className="space-y-4">
                            {/* Button 1: Activate (GREEN GRADIENT) */}
                            <button
                                onClick={handleWithBenefits}
                                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-[16px] shadow-lg shadow-green-100 hover:shadow-green-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                Vorteile aktivieren 🎁
                            </button>

                            {/* Button 2: Continue without benefits (Gray) */}
                            <button
                                onClick={handleConfirmDecline}
                                className="w-full py-3.5 px-6 rounded-xl bg-white border-2 border-gray-200 text-gray-600 font-semibold text-[15px] hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                Ohne Vorteile weiter
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
