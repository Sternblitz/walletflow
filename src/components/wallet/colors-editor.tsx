'use client'

import { WalletPassDraft } from '@/lib/wallet/types'

interface ColorsEditorProps {
    draft: WalletPassDraft
    onChange: (draft: WalletPassDraft) => void
}

const COLOR_FIELDS: { key: keyof WalletPassDraft['colors']; label: string; description: string }[] = [
    { key: 'backgroundColor', label: 'Hintergrund', description: 'Hauptfarbe der Karte' },
    { key: 'foregroundColor', label: 'Text', description: 'Farbe für Werte' },
    { key: 'labelColor', label: 'Labels', description: 'Farbe für Überschriften' }
]

export function ColorsEditor({ draft, onChange }: ColorsEditorProps) {
    const updateColor = (key: keyof WalletPassDraft['colors'], value: string) => {
        onChange({
            ...draft,
            colors: {
                ...draft.colors,
                [key]: value
            }
        })
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Feinabstimmung</h3>

            <div className="space-y-3">
                {COLOR_FIELDS.map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div>
                            <span className="block text-sm font-medium text-white">{label}</span>
                            <span className="text-xs text-zinc-500">{description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div
                                    className="w-10 h-10 rounded-lg border border-white/20 shadow-sm"
                                    style={{ backgroundColor: draft.colors[key] }}
                                />
                                <input
                                    type="color"
                                    value={draft.colors[key]}
                                    onChange={e => updateColor(key, e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={draft.colors[key]}
                                onChange={e => updateColor(key, e.target.value)}
                                className="w-24 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-zinc-300 focus:text-white focus:border-white/30 transition-colors"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
