"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TemplatePreview } from "./template-preview"
import {
    Printer,
    Download,
    LayoutTemplate,
    Type,
    Palette,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface MarketingDesignerProps {
    campaign: {
        id: string
        name: string
        slug: string
        color: string
    }
}

export function MarketingDesigner({ campaign }: MarketingDesignerProps) {
    const [template, setTemplate] = useState<'table-tent' | 'sticker-square' | 'sticker-round' | 'flyer-a4'>('table-tent')
    const [headline, setHeadline] = useState("Punkt sammeln & Prämie sichern!")
    const [subline, setSubline] = useState("Einfach QR-Code scannen und Karte hinzufügen.")
    const [accentColor, setAccentColor] = useState(campaign.color || "#09090b") // Default to black or campaign color

    const qrUrl = `https://walletflow-blush.vercel.app/start/${campaign.slug}`

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="flex h-full">
            {/* Sidebar Controls */}
            <div className="w-[400px] border-r border-white/10 bg-zinc-900/50 p-6 flex flex-col gap-8 overflow-y-auto print:hidden">
                <div className="space-y-2">
                    <Link href={`/admin/campaign/${campaign.id}`} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 mb-4">
                        <ArrowLeft className="w-3 h-3" />
                        Zurück zum Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold">Marketing Center</h1>
                    <p className="text-sm text-zinc-400">Erstelle druckfertige Aufsteller für deinen Laden.</p>
                </div>

                {/* Templates */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <LayoutTemplate className="w-4 h-4 text-violet-400" />
                        Vorlage wählen
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setTemplate('table-tent')}
                            className={`p-3 rounded-xl border text-left text-sm transition-all ${template === 'table-tent' ? 'bg-violet-500/20 border-violet-500/50 text-white' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                        >
                            <span className="block font-medium">Tischaufsteller</span>
                            <span className="text-xs opacity-60">A5 / A6 Geklappt</span>
                        </button>
                        <button
                            onClick={() => setTemplate('flyer-a4')}
                            className={`p-3 rounded-xl border text-left text-sm transition-all ${template === 'flyer-a4' ? 'bg-violet-500/20 border-violet-500/50 text-white' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                        >
                            <span className="block font-medium">Poster / Flyer</span>
                            <span className="text-xs opacity-60">DIN A4</span>
                        </button>
                        <button
                            onClick={() => setTemplate('sticker-square')}
                            className={`p-3 rounded-xl border text-left text-sm transition-all ${template === 'sticker-square' ? 'bg-violet-500/20 border-violet-500/50 text-white' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                        >
                            <span className="block font-medium">Sticker Eckig</span>
                            <span className="text-xs opacity-60">Quadratisch</span>
                        </button>
                        <button
                            onClick={() => setTemplate('sticker-round')}
                            className={`p-3 rounded-xl border text-left text-sm transition-all ${template === 'sticker-round' ? 'bg-violet-500/20 border-violet-500/50 text-white' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'}`}
                        >
                            <span className="block font-medium">Sticker Rund</span>
                            <span className="text-xs opacity-60">Kreisrund</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Type className="w-4 h-4 text-violet-400" />
                        Inhalt anpassen
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-400">Überschrift</Label>
                            <Input
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-zinc-400">Untertitel</Label>
                            <Input
                                value={subline}
                                onChange={(e) => setSubline(e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Palette className="w-4 h-4 text-violet-400" />
                        Akzentfarbe
                    </div>
                    <div className="flex gap-2">
                        {[campaign.color, '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map((c, i) => (
                            <button
                                key={i}
                                onClick={() => setAccentColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${accentColor === c ? 'border-white scale-110' : 'border-transparent hover:border-white/50'}`}
                                style={{ background: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <Button onClick={handlePrint} className="w-full bg-white text-black hover:bg-zinc-200">
                        <Printer className="w-4 h-4 mr-2" />
                        Drucken / PDF speichern
                    </Button>
                    <p className="text-xs text-zinc-500 text-center mt-3">
                        Tipp: Wähle im Druckdialog "Als PDF speichern" und deaktiviere "Kopf- und Fußzeilen".
                    </p>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-zinc-950 p-12 flex items-center justify-center overflow-auto relative print:p-0 print:bg-white print:block">

                {/* Visualizer Background (Pattern) - Hidden on Print */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950 pointer-events-none print:hidden" />

                {/* Scale wrapper to fit view */}
                <div className="relative z-10 w-full max-w-[600px] shadow-2xl print:shadow-none print:w-full print:max-w-none">
                    <TemplatePreview
                        template={template}
                        data={{ headline, subline, accentColor, qrUrl }}
                    />
                </div>
            </div>
        </div>
    )
}
