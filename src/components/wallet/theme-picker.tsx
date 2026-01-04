'use client'

import { WalletPassDraft } from '@/lib/wallet/types'
import { Check, Sparkles } from 'lucide-react'

interface ThemePickerProps {
    draft: WalletPassDraft
    onChange: (colors: WalletPassDraft['colors']) => void
}

// Premium Themes Configuration
const THEMES = [
    {
        id: 'midnight',
        name: 'Midnight Pro',
        category: 'Dark',
        colors: { backgroundColor: '#09090b', foregroundColor: '#FFFFFF', labelColor: '#a1a1aa' }
    },
    {
        id: 'obsidian',
        name: 'Obsidian',
        category: 'Dark',
        colors: { backgroundColor: '#000000', foregroundColor: '#FFFFFF', labelColor: '#71717a' }
    },
    {
        id: 'slate',
        name: 'Slate Digital',
        category: 'Dark',
        colors: { backgroundColor: '#1e293b', foregroundColor: '#f8fafc', labelColor: '#94a3b8' }
    },
    {
        id: 'clean',
        name: 'Clean White',
        category: 'Light',
        colors: { backgroundColor: '#ffffff', foregroundColor: '#09090b', labelColor: '#52525b' }
    },
    {
        id: 'soft',
        name: 'Soft Paper',
        category: 'Light',
        colors: { backgroundColor: '#f4f4f5', foregroundColor: '#18181b', labelColor: '#71717a' }
    },
    {
        id: 'luxury-gold',
        name: 'Gold Luxury',
        category: 'Premium',
        colors: { backgroundColor: '#1c1917', foregroundColor: '#fbbf24', labelColor: '#a8a29e' }
    },
    {
        id: 'ocean',
        name: 'Deep Ocean',
        category: 'Colorful',
        colors: { backgroundColor: '#0f172a', foregroundColor: '#38bdf8', labelColor: '#94a3b8' }
    },
    {
        id: 'forest',
        name: 'Forest Elite',
        category: 'Colorful',
        colors: { backgroundColor: '#022c22', foregroundColor: '#34d399', labelColor: '#6ee7b7' }
    },
    {
        id: 'berry',
        name: 'Berry Punch',
        category: 'Vibrant',
        colors: { backgroundColor: '#4c0519', foregroundColor: '#fda4af', labelColor: '#fb7185' }
    },
    {
        id: 'royal',
        name: 'Royal Purple',
        category: 'Vibrant',
        colors: { backgroundColor: '#2e1065', foregroundColor: '#e9d5ff', labelColor: '#a78bfa' }
    }
]

export function ThemePicker({ draft, onChange }: ThemePickerProps) {
    const currentBg = draft.colors.backgroundColor

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Smart Themes</h3>
                <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-full">
                    {THEMES.length} Presets
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {THEMES.map((theme) => {
                    const isActive = currentBg === theme.colors.backgroundColor

                    return (
                        <button
                            key={theme.id}
                            onClick={() => onChange(theme.colors)}
                            className={`
                                group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                                ${isActive
                                    ? 'border-green-500 scale-[1.02] ring-2 ring-green-500/20'
                                    : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                                }
                            `}
                            style={{ backgroundColor: theme.colors.backgroundColor }}
                        >
                            {/* Color Preview Content */}
                            <div className="flex flex-col items-center gap-1 mb-2">
                                <span
                                    className="text-[10px] uppercase tracking-wider font-semibold"
                                    style={{ color: theme.colors.labelColor }}
                                >
                                    Label
                                </span>
                                <span
                                    className="text-lg font-bold"
                                    style={{ color: theme.colors.foregroundColor }}
                                >
                                    Value
                                </span>
                            </div>

                            {/* Theme Name Badge */}
                            <div className={`
                                absolute bottom-2 left-2 right-2 text-center py-1 rounded-md text-[10px] font-medium backdrop-blur-md
                                ${theme.category === 'Light' ? 'bg-black/10 text-black' : 'bg-white/10 text-white'}
                            `}>
                                {theme.name}
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
