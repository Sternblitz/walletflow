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

    const handleSkip = () => {
        window.location.href = `/api/pass/issue?campaignId=${campaignId}&platform=${platform}`
    }

    // Check if any fields are configured
    const hasFields = p.ask_name || p.ask_birthday || p.ask_email || p.ask_phone

    // Derive gradient colors for button
    const buttonGradient = `linear-gradient(135deg, ${bgColor}, ${adjustColor(bgColor, 20)})`

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{ backgroundColor: bgColor, color: fgColor }}
        >
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-20"
                    style={{ backgroundColor: fgColor }}
                />
                <div
                    className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-20"
                    style={{ backgroundColor: accentColor, animationDelay: '1s' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo & Business Name */}
                <div className="text-center mb-8">
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt={clientName}
                            className="w-24 h-24 mx-auto mb-4 rounded-2xl object-cover shadow-2xl"
                        />
                    )}
                    <h1 className="text-3xl font-bold mb-2" style={{ color: fgColor }}>
                        {clientName}
                    </h1>
                    <p style={{ color: accentColor }}>
                        {hasFields ? 'Personalisiere deine Karte' : 'Deine digitale Treuekarte'}
                    </p>
                </div>

                {/* Form Card */}
                <div
                    className="backdrop-blur-xl rounded-3xl p-6 shadow-2xl border"
                    style={{
                        backgroundColor: `${fgColor}10`,
                        borderColor: `${fgColor}20`
                    }}
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                accentColor={accentColor}
                                fgColor={fgColor}
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
                                accentColor={accentColor}
                                fgColor={fgColor}
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
                                accentColor={accentColor}
                                fgColor={fgColor}
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
                                accentColor={accentColor}
                                fgColor={fgColor}
                            />
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                            style={{
                                background: buttonGradient,
                                color: fgColor
                            }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Spinner />
                                    Karte wird erstellt...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {platform === 'android' ? '📱 Zu Google Wallet' : '📱 Zu Apple Wallet'}
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Skip Link - only if allowed */}
                    {p.allow_skip !== false && hasFields && (
                        <button
                            onClick={handleSkip}
                            className="w-full mt-4 py-3 text-sm transition-colors hover:opacity-80"
                            style={{ color: accentColor }}
                        >
                            Ohne Angaben fortfahren →
                        </button>
                    )}
                </div>

                {/* Privacy Note */}
                <p
                    className="text-center text-xs mt-6 px-4"
                    style={{ color: accentColor }}
                >
                    Deine Daten werden sicher gespeichert und nicht weitergegeben.
                </p>

                {/* Powered by QARD */}
                <div className="text-center mt-8" style={{ color: `${fgColor}40` }}>
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
                style={{ color: `${fgColor}CC` }}
            >
                {label}
                {required ? (
                    <span className="text-red-400 ml-1">*</span>
                ) : (
                    <span className="ml-1 text-xs" style={{ color: accentColor }}>(optional)</span>
                )}
            </label>
            <input
                type={type}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl transition-all text-white placeholder-gray-500 focus:outline-none focus:ring-2"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderColor: error ? '#ef4444' : `${fgColor}20`,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                }}
            />
            {error && (
                <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
            {hint && !error && (
                <p className="text-xs mt-1" style={{ color: accentColor }}>{hint}</p>
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
