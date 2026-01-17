'use client'

import { motion } from 'framer-motion'

type BackgroundStyle = 'solid' | 'gradient' | 'radial' | 'animated' | 'mesh' | 'noise' | 'orbs'

interface GradientSettings {
    direction: 'to-bottom' | 'to-top' | 'to-right' | 'to-left' | 'diagonal'
    intensity: number
    secondaryColor?: string
}

interface RadialSettings {
    centerX: number
    centerY: number
    intensity: number
    secondaryColor?: string
}

interface AnimatedSettings {
    speed: 'slow' | 'normal' | 'fast'
    colors: string[]
}

interface MeshSettings {
    color1?: string
    color2?: string
    opacity1: number
    opacity2: number
    blur: number
}

interface NoiseSettings {
    intensity: number
    scale: 'fine' | 'medium' | 'coarse'
}

interface OrbsSettings {
    color1?: string
    color2?: string
    color3?: string
    blur: number
    opacity: number
    speed: 'slow' | 'normal' | 'fast'
}

interface OnboardingPreviewProps {
    config: {
        clientName: string
        logoUrl?: string | null
        backgroundStyle?: BackgroundStyle
        bgColor: string
        fgColor: string
        accentColor: string
        formBgColor: string
        formTextColor: string
        glowBorderColor?: string
        gradientSettings?: GradientSettings
        radialSettings?: RadialSettings
        animatedSettings?: AnimatedSettings
        meshSettings?: MeshSettings
        noiseSettings?: NoiseSettings
        orbsSettings?: OrbsSettings
        title?: string
        description?: string
        showTitle?: boolean
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
        platform?: 'ios' | 'android'
    }
}

function adjustColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
}

function getGradientDirection(dir: string): string {
    switch (dir) {
        case 'to-top': return 'to top'
        case 'to-right': return 'to right'
        case 'to-left': return 'to left'
        case 'diagonal': return 'to bottom right'
        default: return 'to bottom'
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
        glowBorderColor,
        gradientSettings = { direction: 'to-bottom', intensity: 50 },
        radialSettings = { centerX: 50, centerY: 30, intensity: 50 },
        animatedSettings = { speed: 'normal', colors: [bgColor, accentColor] },
        meshSettings = { opacity1: 40, opacity2: 30, blur: 80 },
        noiseSettings = { intensity: 20, scale: 'medium' },
        orbsSettings = { blur: 120, opacity: 15, speed: 'normal' },
        title,
        showTitle = false,
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

    // Calculate background based on style and settings
    const getBackgroundStyle = (): React.CSSProperties => {
        const darkAmount = -gradientSettings.intensity * 0.5
        const lightAmount = radialSettings.intensity * 0.3
        const secondaryGradient = gradientSettings.secondaryColor || adjustColor(bgColor, darkAmount)
        const secondaryRadial = radialSettings.secondaryColor || adjustColor(bgColor, lightAmount)

        switch (backgroundStyle) {
            case 'gradient':
                return { background: `linear-gradient(${getGradientDirection(gradientSettings.direction)}, ${bgColor}, ${secondaryGradient})` }
            case 'radial':
                return { background: `radial-gradient(circle at ${radialSettings.centerX}% ${radialSettings.centerY}%, ${secondaryRadial}, ${bgColor})` }
            default:
                return { backgroundColor: bgColor }
        }
    }

    // Animated speed
    const animationDuration = animatedSettings.speed === 'slow' ? '12s' : animatedSettings.speed === 'fast' ? '4s' : '8s'

    // Noise frequency based on scale
    const noiseFrequency = noiseSettings.scale === 'fine' ? '1.2' : noiseSettings.scale === 'coarse' ? '0.5' : '0.9'

    // Orbs animation duration
    const orbsAnimationDuration = orbsSettings.speed === 'slow' ? '6s' : orbsSettings.speed === 'fast' ? '2s' : '4s'

    return (
        <div className="flex items-center justify-center">
            {/* Phone Frame */}
            <div className="relative">
                <div className="relative w-[280px] h-[580px] bg-zinc-900 rounded-[40px] p-2 shadow-2xl shadow-black/50 border border-zinc-800">
                    {/* Screen */}
                    <div
                        className="w-full h-full rounded-[32px] overflow-hidden relative"
                        style={getBackgroundStyle()}
                    >
                        {/* Animated Background */}
                        {backgroundStyle === 'animated' && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(-45deg, ${animatedSettings.colors[0] || bgColor}, ${animatedSettings.colors[1] || accentColor}40, ${animatedSettings.colors[0] || bgColor})`,
                                    backgroundSize: '400% 400%',
                                    animation: `gradient-xy ${animationDuration} ease infinite`,
                                }}
                            />
                        )}

                        {/* Mesh Background */}
                        {backgroundStyle === 'mesh' && (
                            <div className="absolute inset-0">
                                <div
                                    className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full animate-pulse"
                                    style={{
                                        backgroundColor: meshSettings.color1 || accentColor,
                                        opacity: meshSettings.opacity1 / 100,
                                        filter: `blur(${meshSettings.blur}px)`,
                                    }}
                                />
                                <div
                                    className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full animate-pulse"
                                    style={{
                                        backgroundColor: meshSettings.color2 || adjustColor(accentColor, 40),
                                        opacity: meshSettings.opacity2 / 100,
                                        filter: `blur(${meshSettings.blur}px)`,
                                        animationDelay: '1s'
                                    }}
                                />
                            </div>
                        )}

                        {/* Orbs Background */}
                        {backgroundStyle === 'orbs' && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {/* Top Left Orb */}
                                <div
                                    className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full"
                                    style={{
                                        backgroundColor: orbsSettings.color1 || '#6366F1',
                                        opacity: orbsSettings.opacity / 100,
                                        filter: `blur(${orbsSettings.blur}px)`,
                                        animation: `pulse-slow ${orbsAnimationDuration} ease-in-out infinite`,
                                    }}
                                />
                                {/* Top Right Orb */}
                                <div
                                    className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full"
                                    style={{
                                        backgroundColor: orbsSettings.color2 || '#D946EF',
                                        opacity: orbsSettings.opacity / 100,
                                        filter: `blur(${orbsSettings.blur}px)`,
                                        animation: `pulse-slow ${orbsAnimationDuration} ease-in-out infinite`,
                                        animationDelay: '1s',
                                    }}
                                />
                                {/* Bottom Center Orb */}
                                <div
                                    className="absolute bottom-[-20%] left-[50%] -translate-x-1/2 w-[60%] h-[50%] rounded-full"
                                    style={{
                                        backgroundColor: orbsSettings.color3 || '#06B6D4',
                                        opacity: (orbsSettings.opacity / 100) * 0.7,
                                        filter: `blur(${orbsSettings.blur * 0.9}px)`,
                                        animation: `pulse-slow ${orbsAnimationDuration} ease-in-out infinite`,
                                        animationDelay: '2s',
                                    }}
                                />
                            </div>
                        )}

                        {/* Noise Overlay */}
                        {backgroundStyle === 'noise' && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    opacity: noiseSettings.intensity / 100,
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${noiseFrequency}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
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
                                {showTitle && (
                                    <h1 className="text-lg font-bold mb-1" style={{ color: fgColor }}>
                                        {title || clientName}
                                    </h1>
                                )}
                                <p className="text-xs" style={{ color: accentColor }}>
                                    {description || (hasFields ? 'Personalisiere deine Karte' : 'Deine digitale Treuekarte')}
                                </p>
                            </div>

                            {/* Form Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl p-4 shadow-lg relative"
                                style={{ backgroundColor: formBgColor }}
                            >
                                {/* Glow Border */}
                                <div
                                    className="absolute -inset-[2px] rounded-2xl opacity-30 blur-sm"
                                    style={{ background: `linear-gradient(45deg, ${effectiveGlowColor}, transparent)` }}
                                />

                                <div className="relative space-y-3">
                                    {askName && (
                                        <div>
                                            <label className="block text-[10px] font-medium mb-1" style={{ color: formTextColor }}>
                                                Dein Name {!nameRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div
                                                className="h-8 rounded-lg px-3 flex items-center text-[10px]"
                                                style={{
                                                    backgroundColor: `${formTextColor}08`,
                                                    color: `${formTextColor}50`,
                                                    border: `1px solid ${formTextColor}15`
                                                }}
                                            >
                                                {namePlaceholder}
                                            </div>
                                        </div>
                                    )}

                                    {askBirthday && (
                                        <div>
                                            <label className="block text-[10px] font-medium mb-1" style={{ color: formTextColor }}>
                                                Geburtstag {!birthdayRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div className="flex gap-2">
                                                <div
                                                    className="flex-1 h-8 rounded-lg px-2 flex items-center justify-between text-[10px]"
                                                    style={{
                                                        backgroundColor: `${formTextColor}08`,
                                                        color: `${formTextColor}50`,
                                                        border: `1px solid ${formTextColor}15`
                                                    }}
                                                >
                                                    <span>Tag</span>
                                                    <span>▼</span>
                                                </div>
                                                <div
                                                    className="flex-[1.5] h-8 rounded-lg px-2 flex items-center justify-between text-[10px]"
                                                    style={{
                                                        backgroundColor: `${formTextColor}08`,
                                                        color: `${formTextColor}50`,
                                                        border: `1px solid ${formTextColor}15`
                                                    }}
                                                >
                                                    <span>Monat</span>
                                                    <span>▼</span>
                                                </div>
                                            </div>
                                            <p className="text-[8px] mt-1 opacity-50" style={{ color: formTextColor }}>
                                                Für Geburtstagsüberraschungen 🎂
                                            </p>
                                        </div>
                                    )}

                                    {askEmail && (
                                        <div>
                                            <label className="block text-[10px] font-medium mb-1" style={{ color: formTextColor }}>
                                                E-Mail {!emailRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div
                                                className="h-8 rounded-lg px-3 flex items-center text-[10px]"
                                                style={{
                                                    backgroundColor: `${formTextColor}08`,
                                                    color: `${formTextColor}50`,
                                                    border: `1px solid ${formTextColor}15`
                                                }}
                                            >
                                                {emailPlaceholder}
                                            </div>
                                        </div>
                                    )}

                                    {askPhone && (
                                        <div>
                                            <label className="block text-[10px] font-medium mb-1" style={{ color: formTextColor }}>
                                                Telefon {!phoneRequired && <span className="opacity-50">(optional)</span>}
                                            </label>
                                            <div
                                                className="h-8 rounded-lg px-3 flex items-center text-[10px]"
                                                style={{
                                                    backgroundColor: `${formTextColor}08`,
                                                    color: `${formTextColor}50`,
                                                    border: `1px solid ${formTextColor}15`
                                                }}
                                            >
                                                {phonePlaceholder}
                                            </div>
                                        </div>
                                    )}

                                    {/* Wallet Button */}
                                    <div className="pt-2">
                                        <div className="flex justify-center mb-1">
                                            <span className="text-[8px] animate-bounce" style={{ color: `${formTextColor}40` }}>↓</span>
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
                            <p className="text-center text-[7px] mt-2 uppercase tracking-widest" style={{ color: `${fgColor}30` }}>
                                Powered by <span className="font-bold">QARD</span>
                            </p>
                        </div>

                        {/* Home Indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/20" />
                    </div>
                </div>

                <div className="absolute -inset-4 bg-gradient-to-b from-violet-500/5 to-fuchsia-500/5 rounded-[50px] -z-10 blur-2xl" />
            </div>

            <style jsx global>{`
                @keyframes gradient-xy {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.05); }
                }
            `}</style>
        </div>
    )
}
