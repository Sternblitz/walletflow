'use client'

import { WalletPassDraft } from '@/lib/wallet/types'
import { Check, Sparkles } from 'lucide-react'

interface ThemePickerProps {
    draft: WalletPassDraft
    onChange: (colors: WalletPassDraft['colors']) => void
}

// Premium Themes Configuration
const THEMES = [
    // Dark / Neutral
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

    // Vibrant / Brand
    {
        id: 'royal',
        name: 'Royal Blue',
        category: 'Vibrant',
        colors: { backgroundColor: '#1e3a8a', foregroundColor: '#ffffff', labelColor: '#bfdbfe' }
    },
    {
        id: 'crimson',
        name: 'Crimson Red',
        category: 'Vibrant',
        colors: { backgroundColor: '#7f1d1d', foregroundColor: '#ffffff', labelColor: '#fca5a5' }
    },
    {
        id: 'emerald',
        name: 'Emerald City',
        category: 'Vibrant',
        colors: { backgroundColor: '#064e3b', foregroundColor: '#ffffff', labelColor: '#6ee7b7' }
    },
    {
        id: 'violet',
        name: 'Violet Dream',
        category: 'Vibrant',
        colors: { backgroundColor: '#4c1d95', foregroundColor: '#ffffff', labelColor: '#c4b5fd' }
    },
    {
        id: 'berry',
        name: 'Berry Punch',
        category: 'Vibrant',
        colors: { backgroundColor: '#4c0519', foregroundColor: '#fda4af', labelColor: '#fb7185' }
    },

    // Light / Clean
    {
        id: 'cloud',
        name: 'Cloud White',
        category: 'Light',
        colors: { backgroundColor: '#ffffff', foregroundColor: '#000000', labelColor: '#525252' }
    },
    {
        id: 'paper',
        name: 'Soft Paper',
        category: 'Light',
        colors: { backgroundColor: '#f5f5f4', foregroundColor: '#1c1917', labelColor: '#78716c' }
    },
    {
        id: 'gold',
        name: 'Gold Luxury',
        category: 'Premium',
        colors: { backgroundColor: '#1c1917', foregroundColor: '#fbbf24', labelColor: '#a8a29e' }
    },

    // Gradients / Special (Simulated colors)
    {
        id: 'sunset',
        name: 'Sunset Glow',
        category: 'Special',
        colors: { backgroundColor: '#c2410c', foregroundColor: '#fff7ed', labelColor: '#fdba74' }
    },
    {
        id: 'ocean',
        name: 'Deep Ocean',
        category: 'Special',
        colors: { backgroundColor: '#0c4a6e', foregroundColor: '#f0f9ff', labelColor: '#7dd3fc' }
    },
    {
        id: 'coffee',
        name: 'Coffee Roast',
        category: 'Special',
        colors: { backgroundColor: '#451a03', foregroundColor: '#fffbeb', labelColor: '#d6d3d1' }
    },
    {
        id: 'forest',
        name: 'Forest Elite',
        category: 'Special',
        colors: { backgroundColor: '#022c22', foregroundColor: '#34d399', labelColor: '#6ee7b7' }
    }
]

export function ThemePicker({ draft, onChange }: ThemePickerProps) {
    const currentBg = draft.colors.backgroundColor

    return (
        <div className="grid grid-cols-2 gap-3">
            {THEMES.map((theme) => {
                const isActive = currentBg === theme.colors.backgroundColor
                return (
                    <button
                        key={theme.id}
                        onClick={() => onChange(theme.colors)}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${isActive
                                ? 'bg-white/10 border-white/50 ring-1 ring-white/50'
                                : 'bg-zinc-900/50 border-white/5 hover:border-white/20 hover:bg-white/5'
                            }`}
                    >
                        {/* Color Preview */}
                        <div
                            className="w-10 h-10 rounded-lg shadow-lg border border-white/10 flex items-center justify-center shrink-0"
                            style={{ background: theme.colors.backgroundColor }}
                        >
                            {isActive && <Check className="w-5 h-5 text-white mix-blend-difference" />}
                        </div>

                        {/* Info */}
                        <div className="text-left overflow-hidden">
                            <div className="font-medium text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                                {theme.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                {theme.category}
                            </div>
                        </div>

                        {/* Active Glow */}
                        {isActive && (
                            <div className="absolute inset-0 rounded-xl bg-white/5 pointer-events-none animate-pulse" />
                        )}
                    </button>
                )
            })}
        </div>
    )
}
