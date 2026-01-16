'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Palette, Apple, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { OnboardingPreview } from './OnboardingPreview'
import { OnboardingColorEditor } from './OnboardingColorEditor'

interface OnboardingDesignConfig {
    // Content
    title?: string
    description?: string

    // Colors
    bgColor?: string
    fgColor?: string
    accentColor?: string
    formBgColor?: string
    formTextColor?: string
    buttonBgColor?: string
    buttonTextColor?: string
}

interface OnboardingDesignEditorProps {
    config: OnboardingDesignConfig
    onChange: (config: OnboardingDesignConfig) => void

    // From campaign/personalization
    clientName?: string
    logoUrl?: string | null

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
    logoUrl,
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

    // Default colors (matching onboarding-form.tsx)
    const colors = {
        bgColor: config.bgColor || '#0A0A0A',
        fgColor: config.fgColor || '#FFFFFF',
        accentColor: config.accentColor || '#8B5CF6',
        formBgColor: config.formBgColor || '#FFFFFF',
        formTextColor: config.formTextColor || '#1F2937',
        buttonBgColor: config.buttonBgColor || '#000000',
        buttonTextColor: config.buttonTextColor || '#FFFFFF',
    }

    const updateColors = (newColors: typeof colors) => {
        onChange({
            ...config,
            ...newColors,
        })
    }

    const previewConfig = {
        clientName,
        logoUrl,
        ...colors,
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
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-white/60">Seitentitel</Label>
                        <Input
                            value={config.title || ''}
                            onChange={(e) => onChange({ ...config, title: e.target.value })}
                            placeholder={clientName}
                            className="bg-white/5 border-white/10 h-9 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-white/60">Beschreibung</Label>
                        <Input
                            value={config.description || ''}
                            onChange={(e) => onChange({ ...config, description: e.target.value })}
                            placeholder="Personalisiere deine Karte"
                            className="bg-white/5 border-white/10 h-9 text-sm"
                        />
                    </div>
                </div>
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
                        {/* Color preview dots */}
                        <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: colors.bgColor }} />
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: colors.accentColor }} />
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: colors.formBgColor }} />
                        </div>
                        {showColorEditor ? (
                            <ChevronUp className="w-4 h-4 text-white/40" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        )}
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
                                    colors={colors}
                                    onChange={updateColors}
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
                        {/* Platform Toggle */}
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
                        {showPreview ? (
                            <ChevronUp className="w-4 h-4 text-white/40" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        )}
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
                    Diese Vorschau zeigt die Seite die Kunden sehen (start.getqard.com/[slug])
                </span>
            </div>
        </div>
    )
}
