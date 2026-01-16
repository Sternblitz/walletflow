'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'

interface ColorConfig {
    bgColor: string
    fgColor: string
    accentColor: string
    formBgColor: string
    formTextColor: string
    buttonBgColor: string
    buttonTextColor: string
}

interface OnboardingColorEditorProps {
    colors: ColorConfig
    onChange: (colors: ColorConfig) => void
}

const COLOR_FIELDS = [
    { key: 'bgColor', label: 'Seiten-Hintergrund', icon: '🌙', description: 'Hintergrund der ganzen Seite' },
    { key: 'fgColor', label: 'Haupt-Text', icon: '✏️', description: 'Titel, Überschriften' },
    { key: 'accentColor', label: 'Akzent-Farbe', icon: '✨', description: 'Beschreibung, Links, Ränder' },
    { key: 'formBgColor', label: 'Formular-Hintergrund', icon: '📋', description: 'Hintergrund der Eingabe-Box' },
    { key: 'formTextColor', label: 'Formular-Text', icon: '📝', description: 'Labels und Eingaben' },
    { key: 'buttonBgColor', label: 'Button-Hintergrund', icon: '🔘', description: 'Wallet Button (Apple/Google)' },
    { key: 'buttonTextColor', label: 'Button-Text', icon: '🏷️', description: 'Text auf Button (falls custom)' },
] as const

// Preset Themes
const THEMES = [
    {
        name: 'Dark Purple',
        colors: { bgColor: '#0A0A0A', fgColor: '#FFFFFF', accentColor: '#8B5CF6', formBgColor: '#FFFFFF', formTextColor: '#1F2937', buttonBgColor: '#000000', buttonTextColor: '#FFFFFF' }
    },
    {
        name: 'Ocean Blue',
        colors: { bgColor: '#0A1628', fgColor: '#FFFFFF', accentColor: '#00D4FF', formBgColor: '#FFFFFF', formTextColor: '#0F172A', buttonBgColor: '#0284C7', buttonTextColor: '#FFFFFF' }
    },
    {
        name: 'Forest Green',
        colors: { bgColor: '#0A1A14', fgColor: '#FFFFFF', accentColor: '#10B981', formBgColor: '#F0FDF4', formTextColor: '#166534', buttonBgColor: '#059669', buttonTextColor: '#FFFFFF' }
    },
    {
        name: 'Sunset Rose',
        colors: { bgColor: '#1A0A14', fgColor: '#FFFFFF', accentColor: '#FB7185', formBgColor: '#FFF1F2', formTextColor: '#9F1239', buttonBgColor: '#E11D48', buttonTextColor: '#FFFFFF' }
    },
    {
        name: 'Gold Luxury',
        colors: { bgColor: '#1A1A2E', fgColor: '#FFFFFF', accentColor: '#F59E0B', formBgColor: '#FFFBEB', formTextColor: '#78350F', buttonBgColor: '#D97706', buttonTextColor: '#FFFFFF' }
    },
    {
        name: 'Clean White',
        colors: { bgColor: '#F8FAFC', fgColor: '#0F172A', accentColor: '#6366F1', formBgColor: '#FFFFFF', formTextColor: '#374151', buttonBgColor: '#4F46E5', buttonTextColor: '#FFFFFF' }
    },
]

export function OnboardingColorEditor({ colors, onChange }: OnboardingColorEditorProps) {
    const updateColor = (key: keyof ColorConfig, value: string) => {
        onChange({ ...colors, [key]: value })
    }

    const applyTheme = (theme: typeof THEMES[0]) => {
        onChange(theme.colors)
    }

    return (
        <div className="space-y-6">
            {/* Theme Presets */}
            <div className="space-y-2">
                <Label className="text-[10px] text-white/40 uppercase tracking-widest">Schnellauswahl</Label>
                <div className="grid grid-cols-3 gap-2">
                    {THEMES.map((theme) => (
                        <motion.button
                            key={theme.name}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyTheme(theme)}
                            className="relative p-2 rounded-lg border border-white/10 hover:border-white/20 transition-all overflow-hidden group"
                        >
                            {/* Preview */}
                            <div className="flex gap-1 mb-1.5">
                                <div
                                    className="w-4 h-4 rounded-full border border-white/20"
                                    style={{ backgroundColor: theme.colors.bgColor }}
                                />
                                <div
                                    className="w-4 h-4 rounded-full border border-white/20"
                                    style={{ backgroundColor: theme.colors.accentColor }}
                                />
                                <div
                                    className="w-4 h-4 rounded-full border border-white/20"
                                    style={{ backgroundColor: theme.colors.formBgColor }}
                                />
                            </div>
                            <span className="text-[9px] text-white/60 group-hover:text-white/80 transition-colors">
                                {theme.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Individual Colors */}
            <div className="space-y-3">
                <Label className="text-[10px] text-white/40 uppercase tracking-widest">Einzelne Farben</Label>

                <div className="grid grid-cols-2 gap-3">
                    {COLOR_FIELDS.map(({ key, label, icon, description }) => (
                        <div key={key} className="space-y-1.5">
                            <Label className="text-[10px] text-white/50 flex items-center gap-1.5">
                                <span>{icon}</span>
                                {label}
                            </Label>
                            <div className="flex gap-2">
                                {/* Color Picker */}
                                <div
                                    className="w-9 h-9 rounded-lg border border-white/20 overflow-hidden shrink-0 cursor-pointer shadow-lg relative"
                                    style={{ backgroundColor: colors[key] }}
                                >
                                    <input
                                        type="color"
                                        value={colors[key]}
                                        onChange={(e) => updateColor(key, e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                {/* Hex Input */}
                                <Input
                                    value={colors[key]}
                                    onChange={(e) => updateColor(key, e.target.value)}
                                    className="bg-white/5 border-white/10 text-[10px] h-9 font-mono uppercase"
                                    placeholder="#000000"
                                />
                            </div>
                            <p className="text-[9px] text-white/30">{description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
