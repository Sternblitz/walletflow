'use client'

import { WalletPassDraft } from '@/lib/wallet/types'
import { Check, Sparkles } from 'lucide-react'

interface ThemePickerProps {
    draft: WalletPassDraft
    onChange: (colors: WalletPassDraft['colors']) => void
}

// Premium Themes Configuration
const THEMES = [
    // DARK MODE ==========================================
    {
        id: 'midnight',
        name: 'Midnight Pro',
        category: 'Dark Mode',
        colors: { backgroundColor: '#09090b', foregroundColor: '#FFFFFF', labelColor: '#a1a1aa' }
    },
    {
        id: 'obsidian',
        name: 'Obsidian',
        category: 'Dark Mode',
        colors: { backgroundColor: '#000000', foregroundColor: '#FFFFFF', labelColor: '#71717a' }
    },
    {
        id: 'slate',
        name: 'Slate Digital',
        category: 'Dark Mode',
        colors: { backgroundColor: '#1e293b', foregroundColor: '#f8fafc', labelColor: '#94a3b8' }
    },
    {
        id: 'navy',
        name: 'Corporate Navy',
        category: 'Dark Mode',
        colors: { backgroundColor: '#0f172a', foregroundColor: '#f1f5f9', labelColor: '#94a3b8' }
    },
    {
        id: 'knight',
        name: 'Dark Knight',
        category: 'Dark Mode',
        colors: { backgroundColor: '#18181b', foregroundColor: '#facc15', labelColor: '#a1a1aa' }
    },

    // VIBRANT COLORS =====================================
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
        colors: { backgroundColor: '#831843', foregroundColor: '#fbcfe8', labelColor: '#f9a8d4' }
    },
    {
        id: 'cyber',
        name: 'Cyber Neon',
        category: 'Vibrant',
        colors: { backgroundColor: '#2e1065', foregroundColor: '#22d3ee', labelColor: '#d8b4fe' }
    },

    // LIGHT & CLEAN ======================================
    {
        id: 'cloud',
        name: 'Cloud White',
        category: 'Light & Clean',
        colors: { backgroundColor: '#ffffff', foregroundColor: '#000000', labelColor: '#525252' }
    },
    {
        id: 'paper',
        name: 'Soft Paper',
        category: 'Light & Clean',
        colors: { backgroundColor: '#f5f5f4', foregroundColor: '#1c1917', labelColor: '#78716c' }
    },
    {
        id: 'lavender',
        name: 'Lavender Mist',
        category: 'Light & Clean',
        colors: { backgroundColor: '#f3e8ff', foregroundColor: '#581c87', labelColor: '#a855f7' }
    },
    {
        id: 'mint',
        name: 'Mint Fresh',
        category: 'Light & Clean',
        colors: { backgroundColor: '#ecfdf5', foregroundColor: '#064e3b', labelColor: '#34d399' }
    },

    // PREMIUM & SPECIAL ==================================
    {
        id: 'gold',
        name: 'Gold Luxury',
        category: 'Premium',
        colors: { backgroundColor: '#1c1917', foregroundColor: '#fbbf24', labelColor: '#a8a29e' }
    },
    {
        id: 'sunset',
        name: 'Sunset Glow',
        category: 'Premium',
        colors: { backgroundColor: '#7c2d12', foregroundColor: '#ffedd5', labelColor: '#fb923c' }
    },
    {
        id: 'ocean',
        name: 'Deep Ocean',
        category: 'Premium',
        colors: { backgroundColor: '#0c4a6e', foregroundColor: '#e0f2fe', labelColor: '#7dd3fc' }
    },
    {
        id: 'coffee',
        name: 'Coffee Roast',
        category: 'Premium',
        colors: { backgroundColor: '#451a03', foregroundColor: '#fef3c7', labelColor: '#d6d3d1' }
    },
    {
        id: 'forest',
        name: 'Forest Elite',
        category: 'Premium',
        colors: { backgroundColor: '#14532d', foregroundColor: '#dcfce7', labelColor: '#86efac' }
    }
]

export function ThemePicker({ draft, onChange }: ThemePickerProps) {
    const currentBg = draft.colors.backgroundColor

    // Group themes by category
    const categories = Array.from(new Set(THEMES.map(t => t.category)))

    return (
        <div className="space-y-8">
            {categories.map((category) => (
                <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{category}</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {THEMES.filter(t => t.category === category).map((theme) => {
                            const isActive = currentBg === theme.colors.backgroundColor
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => onChange(theme.colors)}
                                    className={`group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${isActive
                                            ? 'bg-white/10 border-white/50 ring-1 ring-white/50'
                                            : 'bg-zinc-900/30 border-white/5 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                >
                                    {/* Color Preview */}
                                    <div
                                        className="w-10 h-10 rounded-lg shadow-lg border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden"
                                        style={{ background: theme.colors.backgroundColor }}
                                    >
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 opacity-50" style={{ background: theme.colors.foregroundColor }} />
                                        {isActive && <Check className="w-5 h-5 text-white mix-blend-difference relative z-10" />}
                                    </div>

                                    {/* Info */}
                                    <div className="text-left overflow-hidden">
                                        <div className="font-medium text-xs text-zinc-300 truncate group-hover:text-white transition-colors">
                                            {theme.name}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
