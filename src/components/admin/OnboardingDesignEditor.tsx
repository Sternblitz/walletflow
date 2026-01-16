'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Smartphone, Palette, Apple, Globe, ChevronDown, ChevronUp,
    Image, Upload, Sparkles, Layers, Eye
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { OnboardingPreview } from './OnboardingPreview'
import { OnboardingColorEditor } from './OnboardingColorEditor'

// Background style types
type BackgroundStyle = 'solid' | 'gradient' | 'radial' | 'animated' | 'mesh' | 'noise'

interface OnboardingDesignConfig {
    // Content
    title?: string
    description?: string
    logoUrl?: string | null
    logoSource?: 'wallet' | 'custom' | 'none'

    // Background
    backgroundStyle?: BackgroundStyle

    // Colors
    bgColor?: string
    fgColor?: string
    accentColor?: string
    formBgColor?: string
    formTextColor?: string

    // Advanced
    formGlassmorphism?: boolean
    useSeparateGlowColor?: boolean
    glowBorderColor?: string
}

interface OnboardingDesignEditorProps {
    config: OnboardingDesignConfig
    onChange: (config: OnboardingDesignConfig) => void
    clientName?: string
    walletColors?: {
        backgroundColor: string
        foregroundColor: string
        labelColor: string
    } | null
    walletLogoUrl?: string | null
    askName?: boolean
    askBirthday?: boolean
    askEmail?: boolean
    askPhone?: boolean
    nameRequired?: boolean
    birthdayRequired?: boolean
    emailRequired?: boolean
    phoneRequired?: boolean
}

const BACKGROUND_STYLES: { id: BackgroundStyle; label: string; icon: string }[] = [
    { id: 'solid', label: 'Solid', icon: '◼️' },
    { id: 'gradient', label: 'Gradient', icon: '🌓' },
    { id: 'radial', label: 'Radial', icon: '🔆' },
    { id: 'animated', label: 'Animiert', icon: '✨' },
    { id: 'mesh', label: 'Mesh', icon: '🌈' },
    { id: 'noise', label: 'Noise', icon: '📺' },
]

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
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Default colors
    const defaultColors = {
        bgColor: config.bgColor || walletColors?.backgroundColor || '#0A0A0A',
        fgColor: config.fgColor || walletColors?.foregroundColor || '#FFFFFF',
        accentColor: config.accentColor || walletColors?.labelColor || '#8B5CF6',
        formBgColor: config.formBgColor || '#FFFFFF',
        formTextColor: config.formTextColor || '#1F2937',
    }

    // Logo handling
    const logoSource = config.logoSource || 'wallet'
    const displayLogo = logoSource === 'wallet' ? walletLogoUrl :
        logoSource === 'custom' ? config.logoUrl : null

    // Glow color
    const glowColor = config.useSeparateGlowColor
        ? (config.glowBorderColor || defaultColors.accentColor)
        : defaultColors.accentColor

    const updateColors = (newColors: typeof defaultColors) => {
        onChange({ ...config, ...newColors })
    }

    const setLogoSource = (source: 'wallet' | 'custom' | 'none') => {
        onChange({
            ...config,
            logoSource: source,
            logoUrl: source === 'wallet' ? null : config.logoUrl,
        })
    }

    // Logo upload handler
    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'public')
            formData.append('folder', 'onboarding-logos')

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (res.ok) {
                const data = await res.json()
                onChange({
                    ...config,
                    logoSource: 'custom',
                    logoUrl: data.url,
                })
            }
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setUploading(false)
        }
    }

    const previewConfig = {
        clientName,
        logoUrl: displayLogo,
        ...defaultColors,
        backgroundStyle: config.backgroundStyle || 'solid',
        formGlassmorphism: config.formGlassmorphism || false,
        glowBorderColor: glowColor,
        title: config.title,
        description: config.description,
        askName, nameRequired, namePlaceholder: 'Max Mustermann',
        askBirthday, birthdayRequired,
        askEmail, emailRequired, emailPlaceholder: 'max@beispiel.de',
        askPhone, phoneRequired, phonePlaceholder: '+49 123 456789',
        platform: previewPlatform,
    }

    return (
        <div className="space-y-4">
            {/* Content Fields */}
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

            {/* Background Style Picker */}
            <div className="rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Hintergrund-Stil</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                    {BACKGROUND_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onChange({ ...config, backgroundStyle: style.id })}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center",
                                (config.backgroundStyle || 'solid') === style.id
                                    ? "bg-violet-500/20 ring-1 ring-violet-500 text-white"
                                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                            )}
                        >
                            <span className="text-lg">{style.icon}</span>
                            <span className="text-[9px] font-medium">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Logo Section */}
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

                                {displayLogo && (
                                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                                        <img src={displayLogo} alt="Logo" className="h-10 w-10 object-contain rounded" />
                                        <span className="text-xs text-white/60">Aktuelles Logo</span>
                                    </div>
                                )}

                                {logoSource === 'custom' && (
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
                                        >
                                            {uploading ? (
                                                <span className="text-xs text-white/60">Wird hochgeladen...</span>
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-white/40" />
                                                    <span className="text-xs text-white/60">Logo hochladen</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Colors Section */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setShowColorEditor(!showColorEditor)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium text-white">Farben</span>
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

            {/* Advanced Effects Section */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.07] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-white">Effekte & Erweitert</span>
                    </div>
                    {showAdvanced ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>

                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 pt-2 border-t border-white/5 space-y-4">
                                {/* Glassmorphism Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-cyan-400" />
                                            <span className="text-sm font-medium text-white">Glassmorphism</span>
                                        </div>
                                        <p className="text-[10px] text-white/40 mt-0.5">Frosted-Glass Effekt für die Form-Card</p>
                                    </div>
                                    <button
                                        onClick={() => onChange({ ...config, formGlassmorphism: !config.formGlassmorphism })}
                                        className={cn(
                                            "relative w-10 h-5 rounded-full transition-colors",
                                            config.formGlassmorphism ? "bg-emerald-500" : "bg-zinc-700"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                            config.formGlassmorphism ? "translate-x-5" : "translate-x-0.5"
                                        )} />
                                    </button>
                                </div>

                                {/* Glow Border Separation */}
                                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-violet-400" />
                                                <span className="text-sm font-medium text-white">Glow-Rahmen separat</span>
                                            </div>
                                            <p className="text-[10px] text-white/40 mt-0.5">Andere Farbe für den animierten Rahmen</p>
                                        </div>
                                        <button
                                            onClick={() => onChange({
                                                ...config,
                                                useSeparateGlowColor: !config.useSeparateGlowColor,
                                                glowBorderColor: config.glowBorderColor || defaultColors.accentColor
                                            })}
                                            className={cn(
                                                "relative w-10 h-5 rounded-full transition-colors",
                                                config.useSeparateGlowColor ? "bg-emerald-500" : "bg-zinc-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                                config.useSeparateGlowColor ? "translate-x-5" : "translate-x-0.5"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Glow Color Picker - only show when enabled */}
                                    <AnimatePresence>
                                        {config.useSeparateGlowColor && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                                                    <div
                                                        className="w-10 h-10 rounded-lg border border-white/20 overflow-hidden cursor-pointer shadow-lg relative"
                                                        style={{ backgroundColor: config.glowBorderColor || defaultColors.accentColor }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={config.glowBorderColor || defaultColors.accentColor}
                                                            onChange={(e) => onChange({ ...config, glowBorderColor: e.target.value })}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-white/60">Glow-Rahmen Farbe</span>
                                                        <p className="text-[10px] text-white/40 font-mono">{config.glowBorderColor || defaultColors.accentColor}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
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
                        <span className="text-sm font-medium text-white">Live Vorschau</span>
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
