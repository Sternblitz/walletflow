'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Palette, Apple, Globe, ChevronDown, ChevronUp, Image, Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { OnboardingPreview } from './OnboardingPreview'
import { OnboardingColorEditor } from './OnboardingColorEditor'

interface OnboardingDesignConfig {
    // Content
    title?: string
    description?: string
    logoUrl?: string | null
    logoSource?: 'wallet' | 'custom' | 'none'

    // Colors
    bgColor?: string
    fgColor?: string
    accentColor?: string
    formBgColor?: string
    formTextColor?: string
}

interface OnboardingDesignEditorProps {
    config: OnboardingDesignConfig
    onChange: (config: OnboardingDesignConfig) => void

    // From campaign
    clientName?: string

    // Wallet card data
    walletColors?: {
        backgroundColor: string
        foregroundColor: string
        labelColor: string
    } | null
    walletLogoUrl?: string | null

    // Field settings from PersonalizationEditor
    askName?: boolean
    askBirthday?: boolean
    askEmail?: boolean
    askPhone?: boolean
    nameRequired?: boolean
    birthdayRequired?: boolean
    emailRequired?: boolean
    phoneRequired?: boolean
}

export function OnboardingDesignEditor({
    config,
    onChange,
    clientName = 'Mein Shop',
    walletColors,
    walletLogoUrl,
    askName = true,
    askBirthday = true,
    askEmail = false,
    askPhone = false,
    nameRequired = false,
    birthdayRequired = false,
    emailRequired = false,
    phoneRequired = false,
}: OnboardingDesignEditorProps) {
    const [showPreview, setShowPreview] = useState(true)
    const [previewPlatform, setPreviewPlatform] = useState<'ios' | 'android'>('ios')
    const [showColorEditor, setShowColorEditor] = useState(false)
    const [showLogoOptions, setShowLogoOptions] = useState(false)

    // Default colors from wallet card, or fallback
    const defaultColors = {
        bgColor: config.bgColor || walletColors?.backgroundColor || '#0A0A0A',
        fgColor: config.fgColor || walletColors?.foregroundColor || '#FFFFFF',
        accentColor: config.accentColor || walletColors?.labelColor || '#8B5CF6',
        formBgColor: config.formBgColor || '#FFFFFF',
        formTextColor: config.formTextColor || '#1F2937',
    }

    // Logo source logic
    const logoSource = config.logoSource || 'wallet'
    const displayLogo = logoSource === 'wallet' ? walletLogoUrl :
        logoSource === 'custom' ? config.logoUrl : null

    const updateColors = (newColors: typeof defaultColors) => {
        onChange({
            ...config,
            ...newColors,
        })
    }

    const setLogoSource = (source: 'wallet' | 'custom' | 'none') => {
        onChange({
            ...config,
            logoSource: source,
            logoUrl: source === 'wallet' ? null : config.logoUrl,
        })
    }

    const previewConfig = {
        clientName,
        logoUrl: displayLogo,
        ...defaultColors,
        title: config.title,
        description: config.description,
        askName,
        nameRequired,
        namePlaceholder: 'Max Mustermann',
        askBirthday,
        birthdayRequired,
        askEmail,
        emailRequired,
        emailPlaceholder: 'max@beispiel.de',
        askPhone,
        phoneRequired,
        phonePlaceholder: '+49 123 456789',
        platform: previewPlatform,
    }

    return (
        <div className="space-y-4">
            {/* Content Fields */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] text-white/50">Seitentitel</Label>
                        <Input
                            value={config.title || ''}
                            onChange={(e) => onChange({ ...config, title: e.target.value })}
                            placeholder={clientName}
                            className="bg-white/5 border-white/10 h-9 text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] text-white/50">Beschreibung</Label>
                        <Input
                            value={config.description || ''}
                            onChange={(e) => onChange({ ...config, description: e.target.value })}
                            placeholder="Personalisiere deine Karte"
                            className="bg-white/5 border-white/10 h-9 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Logo Section - Collapsible */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setShowLogoOptions(!showLogoOptions)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">Logo</span>
                        <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded bg-white/5">
                            {logoSource === 'wallet' ? 'Von Karte' : logoSource === 'custom' ? 'Eigenes' : 'Keins'}
                        </span>
                    </div>
                    {showLogoOptions ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>

                <AnimatePresence>
                    {showLogoOptions && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3 pt-2 border-t border-white/5 space-y-3">
                                {/* Logo Source Options */}
                                <div className="flex gap-2">
                                    {[
                                        { id: 'wallet', label: 'Von Karte' },
                                        { id: 'custom', label: 'Eigenes' },
                                        { id: 'none', label: 'Kein Logo' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setLogoSource(opt.id as any)}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                                                logoSource === opt.id
                                                    ? "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500"
                                                    : "bg-white/5 text-white/50 hover:bg-white/10"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Logo Preview */}
                                {displayLogo && (
                                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                                        <img src={displayLogo} alt="Logo" className="h-10 w-10 object-contain rounded" />
                                        <span className="text-xs text-white/60">Aktuelles Logo</span>
                                    </div>
                                )}

                                {/* Custom Upload (placeholder - would need actual upload logic) */}
                                {logoSource === 'custom' && (
                                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-lg">
                                        <div className="text-center">
                                            <Upload className="w-6 h-6 text-white/30 mx-auto mb-1" />
                                            <span className="text-[10px] text-white/40">Logo hochladen (coming soon)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Color Section - Collapsible */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setShowColorEditor(!showColorEditor)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium text-white">Farben anpassen</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: defaultColors.bgColor }} />
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: defaultColors.accentColor }} />
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: defaultColors.formBgColor }} />
                        </div>
                        {showColorEditor ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                </button>

                <AnimatePresence>
                    {showColorEditor && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 pt-2 border-t border-white/5">
                                <OnboardingColorEditor
                                    colors={defaultColors}
                                    onChange={updateColors}
                                    walletColors={walletColors}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Preview Section */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-medium text-white">Vorschau (Start-Seite)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 p-0.5 rounded-md bg-zinc-900 border border-white/10">
                            <button
                                onClick={(e) => { e.stopPropagation(); setPreviewPlatform('ios') }}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
                                    previewPlatform === 'ios' ? "bg-white/10 text-white" : "text-white/40"
                                )}
                            >
                                <Apple className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setPreviewPlatform('android') }}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
                                    previewPlatform === 'android' ? "bg-white/10 text-white" : "text-white/40"
                                )}
                            >
                                <Globe className="w-3 h-3" />
                            </button>
                        </div>
                        {showPreview ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                </button>

                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 bg-zinc-950 flex justify-center">
                                <OnboardingPreview config={previewConfig} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[10px] text-violet-300">
                    Standard: Farben werden automatisch von der Wallet-Karte übernommen
                </span>
            </div>
        </div>
    )
}
