'use client'

import { useState } from 'react'

interface PersonalizationConfig {
    enabled?: boolean
    ask_name?: boolean
    name_required?: boolean
    ask_birthday?: boolean
    birthday_required?: boolean
    ask_email?: boolean
    email_required?: boolean
    ask_phone?: boolean
    phone_required?: boolean
    allow_skip?: boolean
    onboarding_title?: string
    onboarding_description?: string
    design_bg?: string
    design_text?: string
    design_accent?: string
    design_border?: string
    design_form_bg?: string
    design_form_text?: string
    design_button_bg?: string
    design_button_text?: string
}

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

interface OnboardingFormProps {
    slug: string
    campaignId: string
    platform: string
    clientName: string
    logoUrl?: string | null
    bgColor: string
    fgColor: string
    accentColor: string
    formBgColor?: string
    formTextColor?: string
    backgroundStyle?: BackgroundStyle
    glowBorderColor?: string
    gradientSettings?: GradientSettings
    radialSettings?: RadialSettings
    animatedSettings?: AnimatedSettings
    meshSettings?: MeshSettings
    noiseSettings?: NoiseSettings
    orbsSettings?: OrbsSettings
    customTitle?: string
    customDescription?: string
    personalization: PersonalizationConfig
}

export function OnboardingForm({
    slug,
    campaignId,
    platform,
    clientName,
    logoUrl,
    bgColor,
    fgColor,
    accentColor,
    formBgColor = '#FFFFFF',
    formTextColor = '#1F2937',
    backgroundStyle = 'solid',
    glowBorderColor,
    gradientSettings = { direction: 'to-bottom', intensity: 50 },
    radialSettings = { centerX: 50, centerY: 30, intensity: 50 },
    animatedSettings = { speed: 'normal', colors: [] },
    meshSettings = { opacity1: 40, opacity2: 30, blur: 80 },
    noiseSettings = { intensity: 20, scale: 'medium' },
    orbsSettings = { blur: 120, opacity: 15, speed: 'normal' },
    customTitle,
    customDescription,
    personalization
}: OnboardingFormProps) {
    const [name, setName] = useState('')
    const [birthday, setBirthday] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const p = personalization

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (p.ask_name && p.name_required && !name.trim()) {
            newErrors.name = 'Name ist erforderlich'
        }
        if (p.ask_birthday && p.birthday_required && !birthday) {
            newErrors.birthday = 'Geburtstag ist erforderlich'
        }
        if (p.ask_email && p.email_required && !email.trim()) {
            newErrors.email = 'E-Mail ist erforderlich'
        }
        if (p.ask_email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Ungültige E-Mail-Adresse'
        }
        if (p.ask_phone && p.phone_required && !phone.trim()) {
            newErrors.phone = 'Telefonnummer ist erforderlich'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return

        setIsLoading(true)

        // Build redirect URL with personalization params
        const params = new URLSearchParams({
            campaignId,
            platform,
            ...(name && { name }),
            ...(birthday && { birthday }),
            ...(email && { email }),
            ...(phone && { phone }),
        })

        // Redirect to pass issue API
        window.location.href = `/api/pass/issue?${params.toString()}`
    }

    // Check if any fields are configured
    const hasFields = p.ask_name || p.ask_birthday || p.ask_email || p.ask_phone

    // Colors - Prioritize Design Override -> Brand Color -> Default
    const finalBgColor = p.design_bg || bgColor
    const finalFgColor = p.design_text || fgColor
    const finalAccentColor = p.design_accent || accentColor
    const finalBorderColor = glowBorderColor || p.design_border || finalAccentColor

    // Form-specific colors from onboardingDesign
    const finalFormBgColor = p.design_form_bg || formBgColor
    const finalFormTextColor = p.design_form_text || formTextColor

    // Title and description - prioritize customTitle/Description from onboardingDesign
    const displayTitle = customTitle || p.onboarding_title || clientName
    const displayDescription = customDescription || p.onboarding_description || (hasFields ? 'Personalisiere deine Karte' : 'Deine digitale Treuekarte')

    // Helper: darken/lighten color
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

    // Get background style CSS using effect settings
    function getBackgroundStyle(): React.CSSProperties {
        const darkAmount = -(gradientSettings.intensity || 50) * 0.5
        const lightAmount = (radialSettings.intensity || 50) * 0.3
        const secondaryGradient = gradientSettings.secondaryColor || adjustColor(finalBgColor, darkAmount)
        const secondaryRadial = adjustColor(finalBgColor, lightAmount)

        switch (backgroundStyle) {
            case 'gradient':
                return { background: `linear-gradient(${getGradientDirection(gradientSettings.direction || 'to-bottom')}, ${finalBgColor}, ${secondaryGradient})` }
            case 'radial':
                return { background: `radial-gradient(circle at ${radialSettings.centerX || 50}% ${radialSettings.centerY || 30}%, ${secondaryRadial}, ${finalBgColor})` }
            default:
                return { backgroundColor: finalBgColor }
        }
    }

    // Animation speed
    const animationDuration = animatedSettings.speed === 'slow' ? '12s' : animatedSettings.speed === 'fast' ? '4s' : '8s'

    // Noise frequency
    const noiseFrequency = noiseSettings.scale === 'fine' ? '1.2' : noiseSettings.scale === 'coarse' ? '0.5' : '0.9'

    // Orbs animation duration
    const orbsAnimationDuration = orbsSettings.speed === 'slow' ? '6s' : orbsSettings.speed === 'fast' ? '2s' : '4s'

    // Form card styles (simple, no glassmorphism)
    const formCardStyle: React.CSSProperties = {
        backgroundColor: finalFormBgColor,
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{ ...getBackgroundStyle(), color: finalFgColor }}
        >


            <style jsx global>{`
                @keyframes spin {
                    from { --tw-rotate: 0deg; transform: rotate(0deg); }
                    to { --tw-rotate: 360deg; transform: rotate(360deg); }
                }
                @keyframes gradient-xy {
                    0% { background-position: 0% 50%; opacity: 0.5; }
                    50% { background-position: 100% 50%; opacity: 0.8; }
                    100% { background-position: 0% 50%; opacity: 0.5; }
                }
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.9; }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.05); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
            `}</style>

            {/* Animated Background */}
            {backgroundStyle === 'animated' && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(-45deg, ${animatedSettings.colors?.[0] || finalBgColor}, ${animatedSettings.colors?.[1] || finalAccentColor}40, ${animatedSettings.colors?.[0] || finalBgColor})`,
                        backgroundSize: '400% 400%',
                        animation: `gradient-xy ${animationDuration} ease infinite`,
                    }}
                />
            )}

            {/* Mesh Background */}
            {backgroundStyle === 'mesh' && (
                <div className="absolute inset-0">
                    <div
                        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-pulse"
                        style={{
                            backgroundColor: meshSettings.color1 || finalAccentColor,
                            opacity: (meshSettings.opacity1 || 40) / 100,
                            filter: `blur(${meshSettings.blur || 80}px)`,
                        }}
                    />
                    <div
                        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full animate-pulse"
                        style={{
                            backgroundColor: meshSettings.color2 || adjustColor(finalAccentColor, 40),
                            opacity: (meshSettings.opacity2 || 30) / 100,
                            filter: `blur(${meshSettings.blur || 80}px)`,
                            animationDelay: '1s'
                        }}
                    />
                </div>
            )}

            {/* Noise Overlay */}
            {backgroundStyle === 'noise' && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        opacity: (noiseSettings.intensity || 20) / 100,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${noiseFrequency}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />
            )}

            {/* Orbs Background */}
            {backgroundStyle === 'orbs' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Top Left Orb */}
                    <div
                        className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full"
                        style={{
                            backgroundColor: orbsSettings.color1 || '#6366F1',
                            opacity: (orbsSettings.opacity || 15) / 100,
                            filter: `blur(${orbsSettings.blur || 120}px)`,
                            animation: `pulse-slow ${orbsAnimationDuration} ease-in-out infinite`,
                        }}
                    />
                    {/* Top Right Orb */}
                    <div
                        className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full"
                        style={{
                            backgroundColor: orbsSettings.color2 || '#D946EF',
                            opacity: (orbsSettings.opacity || 15) / 100,
                            filter: `blur(${orbsSettings.blur || 120}px)`,
                            animation: `pulse-slow ${orbsAnimationDuration} ease-in-out infinite`,
                            animationDelay: '1s',
                        }}
                    />
                    {/* Bottom Center Orb */}
                    <div
                        className="absolute bottom-[-20%] left-[50%] -translate-x-1/2 w-[60%] h-[50%] rounded-full"
                        style={{
                            backgroundColor: orbsSettings.color3 || '#06B6D4',
                            opacity: ((orbsSettings.opacity || 15) / 100) * 0.7,
                            filter: `blur(${(orbsSettings.blur || 120) * 0.9}px)`,
                            animation: `pulse-slow ${orbsAnimationDuration} ease-in-out infinite`,
                            animationDelay: '2s',
                        }}
                    />
                </div>
            )}

            {/* Background gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo & Business Name */}
                <div className="text-center mb-10 flex flex-col items-center">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={clientName}
                            className="h-20 max-w-[180px] object-contain mx-auto mb-6"
                        />
                    ) : (
                        <div
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold"
                            style={{ color: finalFgColor }}
                        >
                            {clientName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <h1 className="text-3xl font-bold mb-2" style={{ color: finalFgColor }}>
                        {displayTitle}
                    </h1>
                    <p style={{ color: finalAccentColor }}>
                        {displayDescription}
                    </p>
                </div>

                {/* Form Card - Wrapper for animation */}
                <div className="relative">
                    {/* Rotating Glow Border - BEHIND the card */}
                    <div className="absolute -inset-[3px] rounded-3xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-[-50%] animate-[spin_3s_linear_infinite]"
                            style={{
                                background: `conic-gradient(from 0deg, transparent 0deg, ${finalBorderColor} 60deg, transparent 120deg)`,
                                filter: 'blur(8px)',
                            }}
                        />
                    </div>

                    {/* Actual Form Card - ON TOP of animation */}
                    <div
                        className="rounded-3xl p-6 shadow-2xl relative"
                        style={formCardStyle}
                    >
                        {/* Thin Border for definition */}
                        <div className="absolute inset-0 rounded-3xl pointer-events-none border border-black/5" />



                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            {/* Name Field */}
                            {p.ask_name && (
                                <FormField
                                    id="name"
                                    label="Dein Name"
                                    required={p.name_required}
                                    value={name}
                                    onChange={setName}
                                    error={errors.name}
                                    placeholder="Max Mustermann"
                                    accentColor={finalAccentColor}
                                    fgColor={finalFgColor}
                                />
                            )}

                            {/* Birthday Field - Month/Day Picker */}
                            {p.ask_birthday && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Geburtstag
                                        {p.birthday_required ? (
                                            <span className="text-red-500 ml-1">*</span>
                                        ) : (
                                            <span className="ml-1 text-xs opacity-60">(optional)</span>
                                        )}
                                    </label>
                                    <div className="flex gap-3">
                                        {/* Day Picker */}
                                        <div className="relative flex-1">
                                            <select
                                                value={birthday.split('-')[2] || ''}
                                                onChange={(e) => {
                                                    const month = birthday.split('-')[1] || '01'
                                                    setBirthday(e.target.value ? `2000-${month}-${e.target.value}` : '')
                                                }}
                                                className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer text-gray-900 bg-white border border-gray-200 shadow-sm"
                                            >
                                                <option value="">Tag</option>
                                                {[...Array(31)].map((_, i) => (
                                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                        {i + 1}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                ▼
                                            </div>
                                        </div>
                                        {/* Month Picker */}
                                        <div className="relative flex-[1.5]">
                                            <select
                                                value={birthday.split('-')[1] || ''}
                                                onChange={(e) => {
                                                    const day = birthday.split('-')[2] || '01'
                                                    setBirthday(e.target.value ? `2000-${e.target.value}-${day}` : '')
                                                }}
                                                className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer text-gray-900 bg-white border border-gray-200 shadow-sm"
                                            >
                                                <option value="">Monat</option>
                                                {['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map((month, i) => (
                                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                    {errors.birthday && (
                                        <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>
                                    )}
                                    <p className="text-xs text-gray-500">Für Geburtstagsüberraschungen 🎂</p>
                                </div>
                            )}

                            {/* Email Field */}
                            {p.ask_email && (
                                <FormField
                                    id="email"
                                    label="E-Mail"
                                    required={p.email_required}
                                    value={email}
                                    onChange={setEmail}
                                    error={errors.email}
                                    type="email"
                                    placeholder="max@beispiel.de"
                                    hint="Für exklusive Angebote"
                                    accentColor={finalAccentColor}
                                    fgColor={finalFgColor}
                                />
                            )}

                            {/* Phone Field */}
                            {p.ask_phone && (
                                <FormField
                                    id="phone"
                                    label="Telefon"
                                    required={p.phone_required}
                                    value={phone}
                                    onChange={setPhone}
                                    error={errors.phone}
                                    type="tel"
                                    placeholder="+49 123 456789"
                                    accentColor={finalAccentColor}
                                    fgColor={finalFgColor}
                                />
                            )}

                            {/* Wallet Button with Pulse Animation */}
                            <div className="mt-6 space-y-3">
                                {/* Arrow indicator */}
                                <div className="flex justify-center animate-bounce">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </div>

                                {/* Single Platform-Specific Wallet Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center py-3 transition-all transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-subtle"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2 text-gray-600">
                                            <Spinner />
                                            Karte wird erstellt...
                                        </span>
                                    ) : platform === 'android' ? (
                                        <img
                                            src="/pass-assets/de_add_to_google_wallet_add-wallet-badge.svg"
                                            alt="Zu Google Wallet hinzufügen"
                                            className="w-full max-w-[280px] h-auto object-contain"
                                        />
                                    ) : (
                                        <img
                                            src="/DE_Add_to_Apple_Wallet_RGB_101421.svg"
                                            alt="Zu Apple Wallet hinzufügen"
                                            className="w-full max-w-[280px] h-auto object-contain"
                                        />
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Privacy Note */}
                <p
                    className="text-center text-xs mt-6 px-4"
                    style={{ color: finalAccentColor }}
                >
                    Deine Daten werden sicher gespeichert und nicht weitergegeben.
                </p>

                {/* Powered by QARD */}
                <div className="text-center mt-8" style={{ color: `${finalFgColor}40` }}>
                    <p className="text-[10px] font-medium tracking-widest uppercase">
                        Powered by <span className="font-bold">QARD</span>
                    </p>
                </div>
            </div>
        </div>
    )
}

// Helper Components

interface FormFieldProps {
    id: string
    label: string
    required?: boolean
    value: string
    onChange: (value: string) => void
    error?: string
    type?: string
    placeholder?: string
    hint?: string
    accentColor: string
    fgColor: string
}

function FormField({
    id,
    label,
    required,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
    hint,
    accentColor,
    fgColor
}: FormFieldProps) {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-medium mb-2"
                style={{ color: '#374151' }}
            >
                {label}
                {required ? (
                    <span className="text-red-500 ml-1">*</span>
                ) : (
                    <span className="ml-1 text-xs text-gray-400">(optional)</span>
                )}
            </label>
            <input
                type={type}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl transition-all placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    color: '#1a1a1a',
                    borderColor: error ? '#ef4444' : 'rgba(0,0,0,0.1)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                }}
            />
            {error && (
                <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
            {hint && !error && (
                <p className="text-xs mt-1 text-gray-500">{hint}</p>
            )}
        </div>
    )
}

function Spinner() {
    return (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

// Utility function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1)
}
