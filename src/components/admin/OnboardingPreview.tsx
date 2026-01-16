'use client'

import { motion } from 'framer-motion'

type BackgroundStyle = 'solid' | 'gradient' | 'radial' | 'animated' | 'mesh' | 'noise'

interface OnboardingPreviewProps {
    config: {
        clientName: string
        logoUrl?: string | null

        // Background
        backgroundStyle?: BackgroundStyle

        // Colors
        bgColor: string
        fgColor: string
        accentColor: string
        formBgColor: string
        formTextColor: string

        // Advanced
        formGlassmorphism?: boolean
        glowBorderColor?: string

        // Content
        title?: string
        description?: string

        // Fields
        askName?: boolean
        nameRequired?: boolean
        namePlaceholder?: string
        askBirthday?: boolean
        birthdayRequired?: boolean
        askEmail?: boolean
        emailRequired?: boolean
        emailPlaceholder?: string
        askPhone?: boolean
        phoneRequired?: boolean
        phonePlaceholder?: string

        // Platform
        platform?: 'ios' | 'android'
    }
}

// Helper: darken/lighten color
function adjustColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
}

// Get background style CSS
function getBackgroundStyle(style: BackgroundStyle, bgColor: string): React.CSSProperties {
    const darker = adjustColor(bgColor, -20)
    const lighter = adjustColor(bgColor, 20)

    switch (style) {
        case 'gradient':
            return { background: `linear-gradient(to bottom, ${bgColor}, ${darker})` }
        case 'radial':
            return { background: `radial-gradient(circle at center, ${lighter}, ${bgColor})` }
        case 'animated':
        case 'mesh':
        case 'noise':
            // These need special handling in the component
            return { backgroundColor: bgColor }
        default:
            return { backgroundColor: bgColor }
    }
}

export function OnboardingPreview({ config }: OnboardingPreviewProps) {
    const {
        clientName,
        logoUrl,
        backgroundStyle = 'solid',
        bgColor = '#0A0A0A',
        fgColor = '#FFFFFF',
        accentColor = '#8B5CF6',
        formBgColor = '#FFFFFF',
        formTextColor = '#1F2937',
        formGlassmorphism = false,
        glowBorderColor,
        title,
        description,
        askName = true,
        nameRequired = false,
        namePlaceholder = 'Max Mustermann',
        askBirthday = true,
        birthdayRequired = false,
        askEmail = false,
        emailRequired = false,
        emailPlaceholder = 'max@beispiel.de',
        askPhone = false,
        phoneRequired = false,
        phonePlaceholder = '+49 123 456789',
        platform = 'ios'
    } = config

    const hasFields = askName || askBirthday || askEmail || askPhone
    const effectiveGlowColor = glowBorderColor || accentColor
    const bgStyle = getBackgroundStyle(backgroundStyle, bgColor)

    // Form card styles
    const formCardStyle: React.CSSProperties = formGlassmorphism
        ? {
            background: `rgba(255, 255, 255, 0.15)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
        }
        : {
            backgroundColor: formBgColor,
        }

    // Text color for glassmorphism
    const effectiveFormTextColor = formGlassmorphism ? fgColor : formTextColor

    return (
        <div className="flex items-center justify-center">
            {/* Phone Frame */}
            <div className="relative">
                <div className="relative w-[280px] h-[580px] bg-zinc-900 rounded-[40px] p-2 shadow-2xl shadow-black/50 border border-zinc-800">
                    {/* Screen */}
                    <div
                        className="w-full h-full rounded-[32px] overflow-hidden relative"
                        style={bgStyle}
                    >
                        {/* Animated Background Layer */}
                        {backgroundStyle === 'animated' && (
                            <div
                                className="absolute inset-0 animate-gradient-xy"
                                style={{
                                    background: `linear-gradient(-45deg, ${bgColor}, ${adjustColor(bgColor, 20)}, ${accentColor}40, ${bgColor})`,
                                    backgroundSize: '400% 400%',
                                }}
                            />
                        )}

                        {/* Mesh Background */}
                        {backgroundStyle === 'mesh' && (
                            <div className="absolute inset-0">
                                <div
                                    className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-40 animate-pulse"
                                    style={{ backgroundColor: accentColor }}
                                />
                                <div
                                    className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full blur-3xl opacity-30 animate-pulse"
                                    style={{ backgroundColor: adjustColor(accentColor, 40), animationDelay: '1s' }}
                                />
                            </div>
                        )}

                        {/* Noise Overlay */}
                        {backgroundStyle === 'noise' && (
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                                }}
                            />
                        )}

                        {/* Status Bar */}
                        <div className="relative z-10 h-8 flex items-center justify-between px-6 pt-2">
                            <span className="text-[10px] font-medium" style={{ color: fgColor }}>9:41</span>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-2.5 rounded-sm border" style={{ borderColor: fgColor }}>
                                    <div className="w-3/4 h-full rounded-sm" style={{ backgroundColor: fgColor }} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 px-4 pt-4 pb-4 h-[calc(100%-2rem)] overflow-y-auto">
                            {/* Logo & Title */}
                            <div className="text-center mb-6">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={clientName}
                                        className="h-12 max-w-[120px] object-contain mx-auto mb-3"
                                    />
                                ) : (
                                    <div
                                        className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-lg font-bold"
                                        style={{ backgroundColor: `${fgColor}20`, color: fgColor }}
                                    >
                                        {clientName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <h1 className="text-lg font-bold mb-1" style={{ color: fgColor }}>
                                    {title || clientName}
                                </h1>
                                <p className="text-xs" style={{ color: accentColor }}>
                                    {description || (hasFields ? 'Personalisiere deine Karte' : 'Deine digitale Treuekarte')}
                                </p>
                            </div>

                            {/* Form Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl p-4 shadow-lg relative"
                                style={formCardStyle}
                            >
                                {/* Glow Border */}
                                <div
                                    className="absolute -inset-[2px] rounded-2xl opacity-30 blur-sm"
                                    style={{ background: `linear-gradient(45deg, ${effectiveGlowColor}, transparent)` }}
                                />

                                <div className="relative space-y-3">
                                    {/* Name Field */}
                                    {askName && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: effectiveFormTextColor }}
                                            >
                                                Dein Name {!nameRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div
                                                className="h-8 rounded-lg px-3 flex items-center text-[10px]"
                                                style={{
                                                    backgroundColor: formGlassmorphism ? 'rgba(255,255,255,0.1)' : `${effectiveFormTextColor}08`,
                                                    color: `${effectiveFormTextColor}50`,
                                                    border: `1px solid ${formGlassmorphism ? 'rgba(255,255,255,0.2)' : effectiveFormTextColor + '15'}`
                                                }}
                                            >
                                                {namePlaceholder}
                                            </div>
                                        </div>
                                    )}

                                    {/* Birthday Field */}
                                    {askBirthday && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: effectiveFormTextColor }}
                                            >
                                                Geburtstag {!birthdayRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div className="flex gap-2">
                                                <div
                                                    className="flex-1 h-8 rounded-lg px-2 flex items-center justify-between text-[10px]"
                                                    style={{
                                                        backgroundColor: formGlassmorphism ? 'rgba(255,255,255,0.1)' : `${effectiveFormTextColor}08`,
                                                        color: `${effectiveFormTextColor}50`,
                                                        border: `1px solid ${formGlassmorphism ? 'rgba(255,255,255,0.2)' : effectiveFormTextColor + '15'}`
                                                    }}
                                                >
                                                    <span>Tag</span>
                                                    <span>▼</span>
                                                </div>
                                                <div
                                                    className="flex-[1.5] h-8 rounded-lg px-2 flex items-center justify-between text-[10px]"
                                                    style={{
                                                        backgroundColor: formGlassmorphism ? 'rgba(255,255,255,0.1)' : `${effectiveFormTextColor}08`,
                                                        color: `${effectiveFormTextColor}50`,
                                                        border: `1px solid ${formGlassmorphism ? 'rgba(255,255,255,0.2)' : effectiveFormTextColor + '15'}`
                                                    }}
                                                >
                                                    <span>Monat</span>
                                                    <span>▼</span>
                                                </div>
                                            </div>
                                            <p className="text-[8px] mt-1 opacity-50" style={{ color: effectiveFormTextColor }}>
                                                Für Geburtstagsüberraschungen 🎂
                                            </p>
                                        </div>
                                    )}

                                    {/* Email Field */}
                                    {askEmail && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: effectiveFormTextColor }}
                                            >
                                                E-Mail {!emailRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div
                                                className="h-8 rounded-lg px-3 flex items-center text-[10px]"
                                                style={{
                                                    backgroundColor: formGlassmorphism ? 'rgba(255,255,255,0.1)' : `${effectiveFormTextColor}08`,
                                                    color: `${effectiveFormTextColor}50`,
                                                    border: `1px solid ${formGlassmorphism ? 'rgba(255,255,255,0.2)' : effectiveFormTextColor + '15'}`
                                                }}
                                            >
                                                {emailPlaceholder}
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone Field */}
                                    {askPhone && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: effectiveFormTextColor }}
                                            >
                                                Telefon {!phoneRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div
                                                className="h-8 rounded-lg px-3 flex items-center text-[10px]"
                                                style={{
                                                    backgroundColor: formGlassmorphism ? 'rgba(255,255,255,0.1)' : `${effectiveFormTextColor}08`,
                                                    color: `${effectiveFormTextColor}50`,
                                                    border: `1px solid ${formGlassmorphism ? 'rgba(255,255,255,0.2)' : effectiveFormTextColor + '15'}`
                                                }}
                                            >
                                                {phonePlaceholder}
                                            </div>
                                        </div>
                                    )}

                                    {/* Wallet Button */}
                                    <div className="pt-2">
                                        <div className="flex justify-center mb-1">
                                            <span className="text-[8px] animate-bounce" style={{ color: `${effectiveFormTextColor}40` }}>↓</span>
                                        </div>
                                        {platform === 'ios' ? (
                                            <div className="flex justify-center">
                                                <img
                                                    src="/DE_Add_to_Apple_Wallet_RGB_101421.svg"
                                                    alt="Apple Wallet"
                                                    className="h-10 object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex justify-center">
                                                <img
                                                    src="/pass-assets/de_add_to_google_wallet_add-wallet-badge.svg"
                                                    alt="Google Wallet"
                                                    className="h-10 object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Footer */}
                            <p className="text-center text-[8px] mt-4" style={{ color: accentColor }}>
                                Deine Daten werden sicher gespeichert
                            </p>
                            <p
                                className="text-center text-[7px] mt-2 uppercase tracking-widest"
                                style={{ color: `${fgColor}30` }}
                            >
                                Powered by <span className="font-bold">QARD</span>
                            </p>
                        </div>

                        {/* Home Indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/20" />
                    </div>
                </div>

                {/* Phone Shadow */}
                <div className="absolute -inset-4 bg-gradient-to-b from-violet-500/5 to-fuchsia-500/5 rounded-[50px] -z-10 blur-2xl" />
            </div>

            {/* Animated gradient keyframes */}
            <style jsx global>{`
                @keyframes gradient-xy {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-xy {
                    animation: gradient-xy 8s ease infinite;
                }
            `}</style>
        </div>
    )
}
