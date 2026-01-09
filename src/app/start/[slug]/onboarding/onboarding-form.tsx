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

interface OnboardingFormProps {
    slug: string
    campaignId: string
    platform: string
    clientName: string
    logoUrl?: string | null
    bgColor: string
    fgColor: string
    accentColor: string
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
    const finalBorderColor = p.design_border || finalAccentColor

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{ backgroundColor: finalBgColor, color: finalFgColor }}
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
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s ease-in-out infinite;
                }
            `}</style>

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
                        {p.onboarding_title || clientName}
                    </h1>
                    <p style={{ color: finalAccentColor }}>
                        {p.onboarding_description || (hasFields ? 'Personalisiere deine Karte' : 'Deine digitale Treuekarte')}
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
                        style={{
                            backgroundColor: p.design_form_bg || '#FFFFFF',
                        }}
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

                            {/* Birthday Field */}
                            {p.ask_birthday && (
                                <FormField
                                    id="birthday"
                                    label="Geburtstag"
                                    required={p.birthday_required}
                                    value={birthday}
                                    onChange={setBirthday}
                                    error={errors.birthday}
                                    type="date"
                                    hint="Für Geburtstagsüberraschungen 🎂"
                                    accentColor={finalAccentColor}
                                    fgColor={finalFgColor}
                                />
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
