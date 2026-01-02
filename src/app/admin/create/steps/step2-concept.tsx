'use client'

import { Check, Stamp, Crown, Coins, Tag, Sparkles } from "lucide-react"

interface Step2ConceptProps {
    data: any
    update: (data: any) => void
}

const CARD_TYPES = [
    {
        id: 'STAMP_CARD',
        name: 'Stempelkarte',
        subtitle: '"10x kaufen = 1x Gratis"',
        description: 'Der Klassiker für Frequenz',
        icon: Stamp,
        color: '#22C55E',
        bgClass: 'bg-green-500'
    },
    {
        id: 'STAMP_CARD_V2',
        name: 'Stempelkarte 2.0',
        subtitle: '"Modernes Event-Design"',
        description: 'Mit Hintergrundbild',
        icon: Stamp,
        color: '#10B981', // Emerald green
        bgClass: 'bg-emerald-500'
    },
    {
        id: 'MEMBER_CARD',
        name: 'Mitgliedskarte',
        subtitle: '"VIP Status & Benefits"',
        description: 'Club & Treue-Mitglieder',
        icon: Crown,
        color: '#D4AF37',
        bgClass: 'bg-amber-500'
    },
    {
        id: 'POINTS_CARD',
        name: 'Punktekarte',
        subtitle: '"1€ = 1 Punkt"',
        description: 'High Frequency Loyalty',
        icon: Coins,
        color: '#3B82F6',
        bgClass: 'bg-blue-500'
    },
    {
        id: 'COUPON',
        name: 'Gutschein',
        subtitle: '"20% Rabatt"',
        description: 'Einmalige Aktionen',
        icon: Tag,
        color: '#EF4444',
        bgClass: 'bg-red-500'
    },
    {
        id: 'CUSTOM',
        name: 'Individuell',
        subtitle: '"Deine eigene Karte"',
        description: 'Komplett anpassbar',
        icon: Sparkles,
        color: '#8B5CF6',
        bgClass: 'bg-purple-500'
    }
]

export function Step2Concept({ data, update }: Step2ConceptProps) {
    const selected = data.concept

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Wähle deinen Kartentyp</h2>
                <p className="text-muted-foreground">Was möchtest du erstellen?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CARD_TYPES.map((card) => {
                    const Icon = card.icon
                    const isSelected = selected === card.id

                    return (
                        <div
                            key={card.id}
                            onClick={() => update({ concept: card.id })}
                            className={`
                                cursor-pointer border-2 rounded-xl p-5 flex flex-col gap-4 
                                transition-all duration-200 hover:scale-[1.02] hover:bg-white/5
                                ${isSelected
                                    ? 'border-current shadow-lg'
                                    : 'border-border opacity-70 hover:opacity-100'
                                }
                            `}
                            style={{
                                borderColor: isSelected ? card.color : undefined,
                                background: isSelected ? `${card.color}10` : undefined
                            }}
                        >
                            {/* Icon */}
                            <div
                                className={`w-14 h-14 rounded-xl flex items-center justify-center`}
                                style={{
                                    background: isSelected ? card.color : 'rgba(255,255,255,0.1)',
                                    color: isSelected ? '#000' : '#fff'
                                }}
                            >
                                <Icon className="w-7 h-7" />
                            </div>

                            {/* Text */}
                            <div>
                                <h3 className="font-bold text-lg">{card.name}</h3>
                                <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">{card.description}</p>
                            </div>

                            {/* Selected Badge */}
                            {isSelected && (
                                <div
                                    className="mt-auto self-start px-3 py-1 text-xs font-bold rounded-full uppercase flex items-center gap-1"
                                    style={{ background: card.color, color: '#000' }}
                                >
                                    <Check className="w-3 h-3" />
                                    Ausgewählt
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Quick Info based on selection */}
            {selected && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 animate-in fade-in">
                    <p className="text-sm text-muted-foreground">
                        {selected === 'STAMP_CARD' && '✅ Perfekt für Gastronomie, Cafés, Bäckereien'}
                        {selected === 'STAMP_CARD_V2' && '✅ Modernes Design mit Hintergrundbild für Events'}
                        {selected === 'MEMBER_CARD' && '✅ Ideal für Clubs, Fitnessstudios, VIP-Programme'}
                        {selected === 'POINTS_CARD' && '✅ Optimal für Einzelhandel mit hoher Kauffrequenz'}
                        {selected === 'COUPON' && '✅ Für zeitlich begrenzte Aktionen und Rabatte'}
                        {selected === 'CUSTOM' && '✅ Volle Kontrolle über alle Felder und das Design'}
                    </p>
                </div>
            )}

            {/* COUPON specific options */}
            {selected === 'COUPON' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-bottom-2 space-y-4">
                    <h3 className="font-semibold text-red-400 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Gutschein-Optionen
                    </h3>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={data.config?.singleUse || false}
                            onChange={(e) => update({
                                config: {
                                    ...data.config,
                                    singleUse: e.target.checked
                                }
                            })}
                            className="w-5 h-5 rounded border-2 border-red-500/50 bg-transparent checked:bg-red-500 checked:border-red-500 cursor-pointer"
                        />
                        <div>
                            <span className="font-medium group-hover:text-red-400 transition-colors">
                                Einmalig einlösbar
                            </span>
                            <p className="text-xs text-muted-foreground">
                                Gutschein wird nach dem ersten Scan entwertet
                            </p>
                        </div>
                    </label>
                </div>
            )}
        </div>
    )
}
