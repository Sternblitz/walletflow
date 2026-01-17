'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Smartphone, Palette, Apple, Globe, ChevronDown, ChevronUp,
    Image, Upload, Sparkles, Layers
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { OnboardingPreview } from './OnboardingPreview'
import { OnboardingColorEditor } from './OnboardingColorEditor'

type BackgroundStyle = 'solid' | 'gradient' | 'radial' | 'animated' | 'mesh' | 'noise' | 'orbs'

interface GradientSettings {
    direction: 'to-bottom' | 'to-top' | 'to-right' | 'to-left' | 'diagonal'
    intensity: number // 0-100
    secondaryColor?: string
}

interface RadialSettings {
    centerX: number // 0-100
    centerY: number // 0-100
    intensity: number // 0-100
    secondaryColor?: string
}

interface AnimatedSettings {
    speed: 'slow' | 'normal' | 'fast'
    colors: string[] // up to 3 colors
}

interface MeshSettings {
    color1?: string
    color2?: string
    opacity1: number
    opacity2: number
    blur: number
}

interface NoiseSettings {
    intensity: number // 0-100
    scale: 'fine' | 'medium' | 'coarse'
}

interface OrbsSettings {
    color1?: string
    color2?: string
    color3?: string
    blur: number // 60-200
    opacity: number // 10-50
    speed: 'slow' | 'normal' | 'fast'
}

interface OnboardingDesignConfig {
    title?: string
    description?: string
    showTitle?: boolean  // Whether to show the page title (default: false)
    logoUrl?: string | null
    logoSource?: 'wallet' | 'custom' | 'none'
    backgroundStyle?: BackgroundStyle
    bgColor?: string
    fgColor?: string
    accentColor?: string
    formBgColor?: string
    formTextColor?: string
    useSeparateGlowColor?: boolean
    glowBorderColor?: string
    // Effect-specific settings
    gradientSettings?: GradientSettings
    radialSettings?: RadialSettings
    animatedSettings?: AnimatedSettings
    meshSettings?: MeshSettings
    noiseSettings?: NoiseSettings
    orbsSettings?: OrbsSettings
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

const BACKGROUND_STYLES: { id: BackgroundStyle; label: string; icon: string; hasOptions: boolean }[] = [
    { id: 'solid', label: 'Solid', icon: '◼️', hasOptions: false },
    { id: 'gradient', label: 'Gradient', icon: '🌓', hasOptions: true },
    { id: 'radial', label: 'Radial', icon: '🔆', hasOptions: true },
    { id: 'animated', label: 'Animiert', icon: '✨', hasOptions: true },
    { id: 'mesh', label: 'Mesh', icon: '🌈', hasOptions: true },
    { id: 'orbs', label: 'Orbs', icon: '🔮', hasOptions: true },
    { id: 'noise', label: 'Noise', icon: '📺', hasOptions: true },
]

// Orbs color presets
const ORBS_PRESETS = [
    { name: 'neon', label: '🌆 Neon', colors: { color1: '#6366F1', color2: '#D946EF', color3: '#06B6D4' } },
    { name: 'sunset', label: '🌅 Sunset', colors: { color1: '#F97316', color2: '#EC4899', color3: '#FBBF24' } },
    { name: 'ocean', label: '🌊 Ocean', colors: { color1: '#0EA5E9', color2: '#06B6D4', color3: '#3B82F6' } },
    { name: 'forest', label: '🌲 Forest', colors: { color1: '#22C55E', color2: '#10B981', color3: '#14B8A6' } },
    { name: 'mono', label: '⚫ Mono', colors: { color1: '#6B7280', color2: '#9CA3AF', color3: '#4B5563' } },
    { name: 'fire', label: '🔥 Fire', colors: { color1: '#EF4444', color2: '#F97316', color3: '#DC2626' } },
]

function getOrbsPresetName(settings: OrbsSettings): string {
    for (const preset of ORBS_PRESETS) {
        if (settings.color1 === preset.colors.color1 &&
            settings.color2 === preset.colors.color2 &&
            settings.color3 === preset.colors.color3) {
            return preset.name
        }
    }
    return 'custom'
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
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const defaultColors = {
        bgColor: config.bgColor || walletColors?.backgroundColor || '#0A0A0A',
        fgColor: config.fgColor || walletColors?.foregroundColor || '#FFFFFF',
        accentColor: config.accentColor || walletColors?.labelColor || '#8B5CF6',
        formBgColor: config.formBgColor || '#FFFFFF',
        formTextColor: config.formTextColor || '#1F2937',
    }

    const logoSource = config.logoSource || 'wallet'
    const displayLogo = logoSource === 'wallet' ? walletLogoUrl :
        logoSource === 'custom' ? config.logoUrl : null

    const currentStyle = config.backgroundStyle || 'solid'
    const currentStyleInfo = BACKGROUND_STYLES.find(s => s.id === currentStyle)

    const glowColor = config.useSeparateGlowColor
        ? (config.glowBorderColor || defaultColors.accentColor)
        : defaultColors.accentColor

    const updateColors = (newColors: typeof defaultColors) => {
        onChange({ ...config, ...newColors })
    }

    const setLogoSource = (source: 'wallet' | 'custom' | 'none') => {
        onChange({ ...config, logoSource: source, logoUrl: source === 'wallet' ? null : config.logoUrl })
    }

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'onboarding-logos')

            const res = await fetch('/api/upload', { method: 'POST', body: formData })

            if (res.ok) {
                const data = await res.json()
                onChange({ ...config, logoSource: 'custom', logoUrl: data.url })
            } else {
                console.error('Upload failed:', await res.text())
            }
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setUploading(false)
        }
    }

    // Default effect settings
    const gradientSettings = config.gradientSettings || { direction: 'to-bottom', intensity: 50 }
    const radialSettings = config.radialSettings || { centerX: 50, centerY: 30, intensity: 50 }
    const animatedSettings = config.animatedSettings || { speed: 'normal', colors: [defaultColors.bgColor, defaultColors.accentColor] }
    const meshSettings = config.meshSettings || { opacity1: 40, opacity2: 30, blur: 80 }
    const noiseSettings = config.noiseSettings || { intensity: 20, scale: 'medium' }
    const orbsSettings = config.orbsSettings || { blur: 120, opacity: 15, speed: 'normal' }

    const previewConfig = {
        clientName,
        logoUrl: displayLogo,
        ...defaultColors,
        backgroundStyle: currentStyle,
        glowBorderColor: glowColor,
        gradientSettings,
        radialSettings,
        animatedSettings,
        meshSettings,
        noiseSettings,
        orbsSettings,
        title: config.title,
        description: config.description,
        showTitle: config.showTitle ?? false, // Default: hidden
        askName, nameRequired, namePlaceholder: 'Max Mustermann',
        askBirthday, birthdayRequired,
        askEmail, emailRequired, emailPlaceholder: 'max@beispiel.de',
        askPhone, phoneRequired, phonePlaceholder: '+49 123 456789',
        platform: previewPlatform,
    }

    return (
        <div className="space-y-4">
            {/* Content Fields */}
            <div className="space-y-3">
                {/* Show Title Toggle */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-white">Seitentitel anzeigen</span>
                    </div>
                    <button
                        onClick={() => onChange({ ...config, showTitle: !(config.showTitle ?? false) })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${(config.showTitle ?? false) ? 'bg-violet-500' : 'bg-white/20'
                            }`}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(config.showTitle ?? false) ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                    </button>
                </div>

                {/* Title Input - only show if showTitle is true */}
                {(config.showTitle ?? false) && (
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
                    </div>
                )}

                {/* Description - always visible */}
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

                <div className="grid grid-cols-6 gap-1.5 mb-3">
                    {BACKGROUND_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onChange({ ...config, backgroundStyle: style.id })}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center",
                                currentStyle === style.id
                                    ? "bg-violet-500/20 ring-1 ring-violet-500 text-white"
                                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                            )}
                        >
                            <span className="text-lg">{style.icon}</span>
                            <span className="text-[9px] font-medium">{style.label}</span>
                        </button>
                    ))}
                </div>

                {/* Effect-specific options */}
                <AnimatePresence mode="wait">
                    {currentStyleInfo?.hasOptions && (
                        <motion.div
                            key={currentStyle}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 mt-3 border-t border-white/10 space-y-3">
                                {/* GRADIENT OPTIONS */}
                                {currentStyle === 'gradient' && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] text-white/50">Richtung</Label>
                                            <div className="flex gap-1">
                                                {[
                                                    { id: 'to-bottom', icon: '↓' },
                                                    { id: 'to-top', icon: '↑' },
                                                    { id: 'to-right', icon: '→' },
                                                    { id: 'to-left', icon: '←' },
                                                    { id: 'diagonal', icon: '↘' },
                                                ].map(d => (
                                                    <button
                                                        key={d.id}
                                                        onClick={() => onChange({ ...config, gradientSettings: { ...gradientSettings, direction: d.id as any } })}
                                                        className={cn(
                                                            "w-7 h-7 rounded text-sm transition-all",
                                                            gradientSettings.direction === d.id
                                                                ? "bg-violet-500 text-white"
                                                                : "bg-white/5 text-white/50 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {d.icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-[10px] text-white/50">Intensität</Label>
                                                <span className="text-[10px] text-white/40">{gradientSettings.intensity}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={10}
                                                max={100}
                                                value={gradientSettings.intensity}
                                                onChange={(e) => onChange({ ...config, gradientSettings: { ...gradientSettings, intensity: parseInt(e.target.value) } })}
                                                className="w-full accent-violet-500"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Label className="text-[10px] text-white/50">Zweite Farbe</Label>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded border border-white/20 cursor-pointer relative overflow-hidden"
                                                    style={{ backgroundColor: gradientSettings.secondaryColor || adjustColor(defaultColors.bgColor, -30) }}
                                                >
                                                    <input
                                                        type="color"
                                                        value={gradientSettings.secondaryColor || adjustColor(defaultColors.bgColor, -30)}
                                                        onChange={(e) => onChange({ ...config, gradientSettings: { ...gradientSettings, secondaryColor: e.target.value } })}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                                <span className="text-[10px] text-white/40 font-mono">{gradientSettings.secondaryColor || 'auto'}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* RADIAL OPTIONS */}
                                {currentStyle === 'radial' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-[10px] text-white/50">Zentrum X</Label>
                                                    <span className="text-[10px] text-white/40">{radialSettings.centerX}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={radialSettings.centerX}
                                                    onChange={(e) => onChange({ ...config, radialSettings: { ...radialSettings, centerX: parseInt(e.target.value) } })}
                                                    className="w-full accent-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-[10px] text-white/50">Zentrum Y</Label>
                                                    <span className="text-[10px] text-white/40">{radialSettings.centerY}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={radialSettings.centerY}
                                                    onChange={(e) => onChange({ ...config, radialSettings: { ...radialSettings, centerY: parseInt(e.target.value) } })}
                                                    className="w-full accent-violet-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-[10px] text-white/50">Intensität</Label>
                                                <span className="text-[10px] text-white/40">{radialSettings.intensity}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={10}
                                                max={100}
                                                value={radialSettings.intensity}
                                                onChange={(e) => onChange({ ...config, radialSettings: { ...radialSettings, intensity: parseInt(e.target.value) } })}
                                                className="w-full accent-violet-500"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* ANIMATED OPTIONS */}
                                {currentStyle === 'animated' && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] text-white/50">Geschwindigkeit</Label>
                                            <div className="flex gap-1">
                                                {['slow', 'normal', 'fast'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => onChange({ ...config, animatedSettings: { ...animatedSettings, speed: s as any } })}
                                                        className={cn(
                                                            "px-3 py-1 rounded text-[10px] font-medium transition-all",
                                                            animatedSettings.speed === s
                                                                ? "bg-violet-500 text-white"
                                                                : "bg-white/5 text-white/50 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {s === 'slow' ? 'Langsam' : s === 'normal' ? 'Normal' : 'Schnell'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Label className="text-[10px] text-white/50">Farben</Label>
                                            <div className="flex gap-2">
                                                {[0, 1].map(i => (
                                                    <div
                                                        key={i}
                                                        className="w-8 h-8 rounded border border-white/20 cursor-pointer relative overflow-hidden"
                                                        style={{ backgroundColor: animatedSettings.colors[i] || defaultColors.accentColor }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={animatedSettings.colors[i] || defaultColors.accentColor}
                                                            onChange={(e) => {
                                                                const newColors = [...animatedSettings.colors]
                                                                newColors[i] = e.target.value
                                                                onChange({ ...config, animatedSettings: { ...animatedSettings, colors: newColors } })
                                                            }}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* MESH OPTIONS */}
                                {currentStyle === 'mesh' && (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <Label className="text-[10px] text-white/50">Blob-Farben</Label>
                                            <div className="flex gap-2">
                                                <div
                                                    className="w-8 h-8 rounded border border-white/20 cursor-pointer relative overflow-hidden"
                                                    style={{ backgroundColor: meshSettings.color1 || defaultColors.accentColor }}
                                                >
                                                    <input
                                                        type="color"
                                                        value={meshSettings.color1 || defaultColors.accentColor}
                                                        onChange={(e) => onChange({ ...config, meshSettings: { ...meshSettings, color1: e.target.value } })}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                                <div
                                                    className="w-8 h-8 rounded border border-white/20 cursor-pointer relative overflow-hidden"
                                                    style={{ backgroundColor: meshSettings.color2 || adjustColor(defaultColors.accentColor, 40) }}
                                                >
                                                    <input
                                                        type="color"
                                                        value={meshSettings.color2 || adjustColor(defaultColors.accentColor, 40)}
                                                        onChange={(e) => onChange({ ...config, meshSettings: { ...meshSettings, color2: e.target.value } })}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-[10px] text-white/50">Deckkraft 1</Label>
                                                    <span className="text-[10px] text-white/40">{meshSettings.opacity1}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={10}
                                                    max={80}
                                                    value={meshSettings.opacity1}
                                                    onChange={(e) => onChange({ ...config, meshSettings: { ...meshSettings, opacity1: parseInt(e.target.value) } })}
                                                    className="w-full accent-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label className="text-[10px] text-white/50">Deckkraft 2</Label>
                                                    <span className="text-[10px] text-white/40">{meshSettings.opacity2}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={10}
                                                    max={80}
                                                    value={meshSettings.opacity2}
                                                    onChange={(e) => onChange({ ...config, meshSettings: { ...meshSettings, opacity2: parseInt(e.target.value) } })}
                                                    className="w-full accent-violet-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-[10px] text-white/50">Weichheit</Label>
                                                <span className="text-[10px] text-white/40">{meshSettings.blur}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={20}
                                                max={150}
                                                value={meshSettings.blur}
                                                onChange={(e) => onChange({ ...config, meshSettings: { ...meshSettings, blur: parseInt(e.target.value) } })}
                                                className="w-full accent-violet-500"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* NOISE OPTIONS */}
                                {currentStyle === 'noise' && (
                                    <>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <Label className="text-[10px] text-white/50">Intensität</Label>
                                                <span className="text-[10px] text-white/40">{noiseSettings.intensity}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={5}
                                                max={50}
                                                value={noiseSettings.intensity}
                                                onChange={(e) => onChange({ ...config, noiseSettings: { ...noiseSettings, intensity: parseInt(e.target.value) } })}
                                                className="w-full accent-violet-500"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] text-white/50">Körnung</Label>
                                            <div className="flex gap-1">
                                                {[
                                                    { id: 'fine', label: 'Fein' },
                                                    { id: 'medium', label: 'Mittel' },
                                                    { id: 'coarse', label: 'Grob' },
                                                ].map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => onChange({ ...config, noiseSettings: { ...noiseSettings, scale: s.id as any } })}
                                                        className={cn(
                                                            "px-3 py-1 rounded text-[10px] font-medium transition-all",
                                                            noiseSettings.scale === s.id
                                                                ? "bg-violet-500 text-white"
                                                                : "bg-white/5 text-white/50 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ORBS OPTIONS */}
                                {currentStyle === 'orbs' && (
                                    <>
                                        {/* Presets Dropdown */}
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] text-white/50">Farbschema</Label>
                                            <select
                                                value={getOrbsPresetName(orbsSettings)}
                                                onChange={(e) => {
                                                    const preset = ORBS_PRESETS.find(p => p.name === e.target.value)
                                                    if (preset) {
                                                        onChange({ ...config, orbsSettings: { ...orbsSettings, ...preset.colors } })
                                                    }
                                                }}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white/80 cursor-pointer"
                                            >
                                                {ORBS_PRESETS.map(p => (
                                                    <option key={p.name} value={p.name}>{p.label}</option>
                                                ))}
                                                <option value="custom">Eigene</option>
                                            </select>
                                        </div>

                                        {/* Color Preview (clickable for custom) */}
                                        <div className="flex items-center gap-3">
                                            <Label className="text-[10px] text-white/50">Farben</Label>
                                            <div className="flex gap-2">
                                                {[
                                                    { key: 'color1', default: '#6366F1' },
                                                    { key: 'color2', default: '#D946EF' },
                                                    { key: 'color3', default: '#06B6D4' },
                                                ].map(({ key, default: def }) => (
                                                    <div
                                                        key={key}
                                                        className="w-6 h-6 rounded border border-white/20 cursor-pointer relative overflow-hidden"
                                                        style={{ backgroundColor: (orbsSettings as any)[key] || def }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={(orbsSettings as any)[key] || def}
                                                            onChange={(e) => onChange({ ...config, orbsSettings: { ...orbsSettings, [key]: e.target.value } })}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Compact sliders row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <Label className="text-[9px] text-white/40 block mb-1">Weichheit</Label>
                                                <input
                                                    type="range"
                                                    min={60}
                                                    max={200}
                                                    value={orbsSettings.blur}
                                                    onChange={(e) => onChange({ ...config, orbsSettings: { ...orbsSettings, blur: parseInt(e.target.value) } })}
                                                    className="w-full accent-violet-500 h-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[9px] text-white/40 block mb-1">Deckkraft</Label>
                                                <input
                                                    type="range"
                                                    min={5}
                                                    max={40}
                                                    value={orbsSettings.opacity}
                                                    onChange={(e) => onChange({ ...config, orbsSettings: { ...orbsSettings, opacity: parseInt(e.target.value) } })}
                                                    className="w-full accent-violet-500 h-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[9px] text-white/40 block mb-1">Speed</Label>
                                                <select
                                                    value={orbsSettings.speed}
                                                    onChange={(e) => onChange({ ...config, orbsSettings: { ...orbsSettings, speed: e.target.value as any } })}
                                                    className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[9px] text-white/70"
                                                >
                                                    <option value="slow">Langsam</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="fast">Schnell</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-xs text-white/60">Wird hochgeladen...</span>
                                                </div>
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

            {/* Glow Border Section */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="p-3 bg-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-white">Glow-Rahmen separat</span>
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

                    <AnimatePresence>
                        {config.useSeparateGlowColor && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex items-center gap-3 pt-3 mt-3 border-t border-white/10">
                                    <div
                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer relative overflow-hidden"
                                        style={{ backgroundColor: config.glowBorderColor || defaultColors.accentColor }}
                                    >
                                        <input
                                            type="color"
                                            value={config.glowBorderColor || defaultColors.accentColor}
                                            onChange={(e) => onChange({ ...config, glowBorderColor: e.target.value })}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
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
        </div>
    )
}

// Helper function
function adjustColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
}
