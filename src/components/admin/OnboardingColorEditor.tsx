'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Palette, Wand2 } from 'lucide-react'

interface ColorConfig {
    bgColor: string
    fgColor: string
    accentColor: string
    formBgColor: string
    formTextColor: string
}

interface WalletColors {
    backgroundColor: string
    foregroundColor: string
    labelColor: string
}

interface OnboardingColorEditorProps {
    colors: ColorConfig
    onChange: (colors: ColorConfig) => void
    walletColors?: WalletColors | null
}

// Helper: Calculate contrast color
function getLuminance(hex: string): number {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0.5
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

function getContrastColor(bg: string): string {
    const luminance = getLuminance(bg)
    return luminance > 0.5 ? '#1F2937' : '#FFFFFF'
}

const COLOR_FIELDS = [
    { key: 'bgColor', label: 'Seiten-Hintergrund', icon: '🌙', description: 'Hintergrund der ganzen Seite' },
    { key: 'fgColor', label: 'Haupt-Text', icon: '✏️', description: 'Titel, Überschriften' },
    { key: 'accentColor', label: 'Akzent-Farbe', icon: '✨', description: 'Beschreibung, Links' },
    { key: 'formBgColor', label: 'Formular-Hintergrund', icon: '📋', description: 'Hintergrund der Eingabe-Box' },
    { key: 'formTextColor', label: 'Formular-Text', icon: '📝', description: 'Labels und Eingaben' },
] as const

export function OnboardingColorEditor({ colors, onChange, walletColors }: OnboardingColorEditorProps) {
    const updateColor = (key: keyof ColorConfig, value: string) => {
        const newColors = { ...colors, [key]: value }

        // Auto-calculate text contrast when background changes
        if (key === 'bgColor') {
            newColors.fgColor = getContrastColor(value)
        }
        if (key === 'formBgColor') {
            newColors.formTextColor = getContrastColor(value)
        }

        onChange(newColors)
    }

    const applyWalletColors = () => {
        if (!walletColors) return

        const newColors: ColorConfig = {
            bgColor: walletColors.backgroundColor,
            fgColor: walletColors.foregroundColor,
            accentColor: walletColors.labelColor,
            formBgColor: '#FFFFFF', // Form stays white for readability
            formTextColor: '#1F2937', // Dark text for white form
        }
        onChange(newColors)
    }

    return (
        <div className="space-y-4">
            {/* Apply Wallet Colors Button */}
            {walletColors && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={applyWalletColors}
                    className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-all group"
                >
                    <div className="flex gap-1">
                        <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: walletColors.backgroundColor }}
                        />
                        <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: walletColors.foregroundColor }}
                        />
                        <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: walletColors.labelColor }}
                        />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white">
                        Farben von Wallet-Karte übernehmen
                    </span>
                    <Wand2 className="w-4 h-4 text-violet-400 group-hover:text-violet-300" />
                </motion.button>
            )}

            {/* Individual Colors */}
            <div className="space-y-3">
                <Label className="text-[10px] text-white/40 uppercase tracking-widest">Farben anpassen</Label>

                <div className="grid grid-cols-1 gap-3">
                    {COLOR_FIELDS.map(({ key, label, icon, description }) => (
                        <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            {/* Color Picker */}
                            <div
                                className="w-10 h-10 rounded-lg border border-white/20 overflow-hidden shrink-0 cursor-pointer shadow-lg relative"
                                style={{ backgroundColor: colors[key] }}
                            >
                                <input
                                    type="color"
                                    value={colors[key]}
                                    onChange={(e) => updateColor(key, e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{icon}</span>
                                    <span className="text-sm font-medium text-white/80">{label}</span>
                                </div>
                                <p className="text-[10px] text-white/40 truncate">{description}</p>
                            </div>

                            {/* Hex Input */}
                            <Input
                                value={colors[key]}
                                onChange={(e) => updateColor(key, e.target.value)}
                                className="w-24 bg-white/5 border-white/10 text-[10px] h-8 font-mono uppercase"
                                placeholder="#000000"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Smart Contrast Info */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-300">
                    Textfarben passen sich automatisch an den Hintergrund an
                </span>
            </div>
        </div>
    )
}
