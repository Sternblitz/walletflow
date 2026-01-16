'use client'

import { motion } from 'framer-motion'

interface OnboardingPreviewProps {
    config: {
        // Basic
        clientName: string
        logoUrl?: string | null

        // Design colors
        bgColor: string
        fgColor: string
        accentColor: string
        formBgColor: string
        formTextColor: string
        buttonBgColor: string
        buttonTextColor: string

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

export function OnboardingPreview({ config }: OnboardingPreviewProps) {
    const {
        clientName,
        logoUrl,
        bgColor = '#0A0A0A',
        fgColor = '#FFFFFF',
        accentColor = '#8B5CF6',
        formBgColor = '#FFFFFF',
        formTextColor = '#1F2937',
        buttonBgColor = '#000000',
        buttonTextColor = '#FFFFFF',
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

    return (
        <div className="flex items-center justify-center">
            {/* Phone Frame */}
            <div className="relative">
                {/* Phone Bezel */}
                <div className="relative w-[280px] h-[580px] bg-zinc-900 rounded-[40px] p-2 shadow-2xl shadow-black/50 border border-zinc-800">
                    {/* Screen */}
                    <div
                        className="w-full h-full rounded-[32px] overflow-hidden relative"
                        style={{ backgroundColor: bgColor }}
                    >
                        {/* Status Bar */}
                        <div className="h-8 flex items-center justify-between px-6 pt-2">
                            <span className="text-[10px] font-medium" style={{ color: fgColor }}>9:41</span>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-2.5 rounded-sm border" style={{ borderColor: fgColor }}>
                                    <div className="w-3/4 h-full rounded-sm" style={{ backgroundColor: fgColor }} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 pt-4 pb-4 h-[calc(100%-2rem)] overflow-y-auto">
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
                                <h1
                                    className="text-lg font-bold mb-1"
                                    style={{ color: fgColor }}
                                >
                                    {title || clientName}
                                </h1>
                                <p
                                    className="text-xs"
                                    style={{ color: accentColor }}
                                >
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
                                {/* Glow Border Animation Indicator */}
                                <div
                                    className="absolute -inset-[2px] rounded-2xl opacity-30 blur-sm"
                                    style={{ background: `linear-gradient(45deg, ${accentColor}, transparent)` }}
                                />

                                <div className="relative space-y-3">
                                    {/* Name Field */}
                                    {askName && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: formTextColor }}
                                            >
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

                                    {/* Birthday Field */}
                                    {askBirthday && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: formTextColor }}
                                            >
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

                                    {/* Email Field */}
                                    {askEmail && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: formTextColor }}
                                            >
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

                                    {/* Phone Field */}
                                    {askPhone && (
                                        <div>
                                            <label
                                                className="block text-[10px] font-medium mb-1"
                                                style={{ color: formTextColor }}
                                            >
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
                            <p
                                className="text-center text-[8px] mt-4"
                                style={{ color: accentColor }}
                            >
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
        </div>
    )
}
