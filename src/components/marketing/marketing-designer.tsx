"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { TemplatePreview } from "./template-preview"
import { getStartURL, getDynamicQRURL } from "@/lib/domain-urls"
import html2canvas from "html2canvas"
import {
    Printer,
    Download,
    LayoutTemplate,
    Type,
    Palette,
    ArrowLeft,
    Upload,
    Image,
    Sparkles,
    Square,
    Circle,
    Gift,
    QrCode,
    Loader2
} from "lucide-react"
import Link from "next/link"

interface MarketingDesignerProps {
    campaign: {
        id: string
        name: string
        slug: string
        color: string
        logoUrl?: string
        maxStamps?: number
        reward?: string
    }
}

// Background effect presets
const BACKGROUND_EFFECTS = [
    { id: 'solid', name: 'Einfarbig', icon: '🎨' },
    { id: 'gradient', name: 'Verlauf', icon: '🌈' },
    { id: 'orbs', name: 'Orbs', icon: '🔮' },
    { id: 'glow', name: 'Glow', icon: '✨' },
    { id: 'dots', name: 'Punkte', icon: '⚫' },
]

// QR Frame styles
const QR_FRAMES = [
    { id: 'none', name: 'Ohne', preview: '□' },
    { id: 'rounded', name: 'Abgerundet', preview: '▢' },
    { id: 'shadow', name: 'Schatten', preview: '▣' },
    { id: 'glow', name: 'Leuchtend', preview: '◈' },
    { id: 'badge', name: 'Badge', preview: '⬡' },
    { id: 'corner', name: 'Ecken', preview: '⌜' },
]

// Template sizes
const TEMPLATE_SIZES = [
    { id: 'a4', name: 'A4 Poster', aspect: '210/297', desc: '210×297mm' },
    { id: 'a5', name: 'A5 Aufsteller', aspect: '148/210', desc: '148×210mm' },
    { id: 'a6', name: 'A6 Flyer', aspect: '105/148', desc: '105×148mm' },
    { id: 'square', name: 'Quadrat', aspect: '1/1', desc: '200×200mm' },
    { id: 'story', name: 'Story', aspect: '9/16', desc: 'Instagram' },
]

export function MarketingDesigner({ campaign }: MarketingDesignerProps) {
    const previewRef = useRef<HTMLDivElement>(null)

    // Template state
    const [templateSize, setTemplateSize] = useState<string>('a5')

    // Logo state
    const [logoUrl, setLogoUrl] = useState<string>(campaign.logoUrl || '')
    const [logoSize, setLogoSize] = useState<number>(80)
    const [customLogo, setCustomLogo] = useState<string | null>(null)

    // Background state
    const [bgEffect, setBgEffect] = useState<string>('gradient')
    const [bgColor1, setBgColor1] = useState<string>(campaign.color || '#000000')
    const [bgColor2, setBgColor2] = useState<string>('#1a1a2e')

    // QR state
    const [qrFrame, setQrFrame] = useState<string>('shadow')
    const [dynamicQRCode, setDynamicQRCode] = useState<string | null>(null)
    const [loadingQR, setLoadingQR] = useState(true)

    // Content state
    const [headline, setHeadline] = useState("Punkte sammeln & Prämie sichern!")
    const [subline, setSubline] = useState("Scanne den QR-Code und füge deine Karte hinzu.")
    const [showSteps, setShowSteps] = useState(true)
    const [stampCount, setStampCount] = useState(campaign.maxStamps || 10)
    const [rewardText, setRewardText] = useState(campaign.reward || "1x Gratis")

    // Export state
    const [exporting, setExporting] = useState(false)

    // Fetch dynamic QR code
    useEffect(() => {
        fetchDynamicQR()
    }, [campaign.id])

    const fetchDynamicQR = async () => {
        setLoadingQR(true)
        try {
            // Get client ID from campaign
            const res = await fetch(`/api/campaign/${campaign.id}`)
            const data = await res.json()
            const clientId = data.campaign?.client?.id

            if (clientId) {
                const routeRes = await fetch(`/api/dynamic-routes?clientId=${clientId}`)
                const routeData = await routeRes.json()
                if (routeData.route?.code) {
                    setDynamicQRCode(getDynamicQRURL(routeData.route.code))
                }
            }
        } catch (e) {
            console.error('Failed to fetch dynamic QR:', e)
        } finally {
            setLoadingQR(false)
        }
    }

    const qrUrl = dynamicQRCode || getStartURL(campaign.slug)

    // Handle logo upload
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setCustomLogo(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Export as PNG
    const handleExportPNG = async () => {
        if (!previewRef.current) return
        setExporting(true)

        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 3, // High resolution for print
                useCORS: true,
                backgroundColor: null,
            })

            const link = document.createElement('a')
            link.download = `${campaign.name.replace(/\s+/g, '-')}-flyer.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (e) {
            console.error('Export failed:', e)
        } finally {
            setExporting(false)
        }
    }

    // Download QR only
    const handleDownloadQR = () => {
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrUrl)}`
        const link = document.createElement('a')
        link.download = `${campaign.name.replace(/\s+/g, '-')}-qr-code.png`
        link.href = qrImage
        link.target = '_blank'
        link.click()
    }

    const handlePrint = () => {
        window.print()
    }

    const activeTemplate = TEMPLATE_SIZES.find(t => t.id === templateSize) || TEMPLATE_SIZES[1]

    return (
        <div className="flex h-full">
            {/* Sidebar Controls */}
            <div className="w-[420px] border-r border-white/10 bg-zinc-900/50 flex flex-col overflow-hidden print:hidden">
                <div className="p-6 border-b border-white/5">
                    <Link href={`/admin/campaign/${campaign.id}`} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 mb-4">
                        <ArrowLeft className="w-3 h-3" />
                        Zurück zum Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold">Marketing Center</h1>
                    <p className="text-sm text-zinc-400">Erstelle professionelle Print-Designs</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Template Size */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <LayoutTemplate className="w-4 h-4 text-violet-400" />
                            Format wählen
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {TEMPLATE_SIZES.map(size => (
                                <button
                                    key={size.id}
                                    onClick={() => setTemplateSize(size.id)}
                                    className={`p-2 rounded-lg border text-left text-xs transition-all ${templateSize === size.id
                                            ? 'bg-violet-500/20 border-violet-500/50 text-white'
                                            : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="block font-medium">{size.name}</span>
                                    <span className="opacity-60">{size.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Logo */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <Image className="w-4 h-4 text-violet-400" />
                            Logo
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-white/10 text-zinc-400 hover:bg-white/5 cursor-pointer text-sm">
                                        <Upload className="w-4 h-4" />
                                        {customLogo ? 'Logo ändern' : 'Logo hochladen'}
                                    </div>
                                </label>
                                {customLogo && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCustomLogo(null)}
                                        className="text-red-400"
                                    >
                                        Entfernen
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>Logo-Größe</span>
                                    <span>{logoSize}px</span>
                                </div>
                                <Slider
                                    value={[logoSize]}
                                    onValueChange={(v) => setLogoSize(v[0])}
                                    min={40}
                                    max={150}
                                    step={5}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Background Effects */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            Hintergrund-Effekt
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {BACKGROUND_EFFECTS.map(effect => (
                                <button
                                    key={effect.id}
                                    onClick={() => setBgEffect(effect.id)}
                                    className={`p-2 rounded-lg border text-center transition-all ${bgEffect === effect.id
                                            ? 'bg-violet-500/20 border-violet-500/50'
                                            : 'bg-black/20 border-white/5 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-lg">{effect.icon}</span>
                                    <span className="block text-[10px] text-zinc-400 mt-1">{effect.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-zinc-500">Farbe 1</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={bgColor1}
                                        onChange={(e) => setBgColor1(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer"
                                    />
                                    <Input
                                        value={bgColor1}
                                        onChange={(e) => setBgColor1(e.target.value)}
                                        className="bg-black/20 border-white/10 font-mono text-sm"
                                    />
                                </div>
                            </div>
                            {bgEffect !== 'solid' && (
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs text-zinc-500">Farbe 2</Label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={bgColor2}
                                            onChange={(e) => setBgColor2(e.target.value)}
                                            className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer"
                                        />
                                        <Input
                                            value={bgColor2}
                                            onChange={(e) => setBgColor2(e.target.value)}
                                            className="bg-black/20 border-white/10 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QR Frame */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <QrCode className="w-4 h-4 text-violet-400" />
                            QR-Code Rahmen
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {QR_FRAMES.map(frame => (
                                <button
                                    key={frame.id}
                                    onClick={() => setQrFrame(frame.id)}
                                    className={`p-2 rounded-lg border text-center transition-all ${qrFrame === frame.id
                                            ? 'bg-violet-500/20 border-violet-500/50'
                                            : 'bg-black/20 border-white/5 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-lg">{frame.preview}</span>
                                    <span className="block text-[9px] text-zinc-400 mt-1">{frame.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <Type className="w-4 h-4 text-violet-400" />
                            Texte anpassen
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

                    {/* Reward Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <Gift className="w-4 h-4 text-violet-400" />
                            Prämien-Info
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-zinc-400">Stempel bis Prämie</Label>
                                <Input
                                    type="number"
                                    value={stampCount}
                                    onChange={(e) => setStampCount(parseInt(e.target.value) || 10)}
                                    min={1}
                                    max={20}
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-zinc-400">Prämie</Label>
                                <Input
                                    value={rewardText}
                                    onChange={(e) => setRewardText(e.target.value)}
                                    placeholder="z.B. 1x Gratis"
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showSteps}
                                onChange={(e) => setShowSteps(e.target.checked)}
                                className="rounded border-white/20"
                            />
                            <span className="text-sm text-zinc-400">Emoji-Anleitung anzeigen</span>
                        </label>
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="p-6 border-t border-white/10 space-y-3">
                    <Button
                        onClick={handleExportPNG}
                        disabled={exporting}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Als PNG herunterladen
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={handlePrint} className="border-white/10">
                            <Printer className="w-4 h-4 mr-2" />
                            Drucken
                        </Button>
                        <Button variant="outline" onClick={handleDownloadQR} className="border-white/10">
                            <QrCode className="w-4 h-4 mr-2" />
                            Nur QR
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-zinc-950 p-8 flex items-center justify-center overflow-auto relative print:p-0 print:bg-white print:block">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950 pointer-events-none print:hidden" />

                {/* Dynamic QR Loading Indicator */}
                {loadingQR && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-full print:hidden">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Lade dynamischen QR-Code...
                    </div>
                )}

                {/* Preview Container */}
                <div
                    ref={previewRef}
                    className="relative z-10 shadow-2xl print:shadow-none print:w-full"
                    style={{
                        width: templateSize === 'square' || templateSize === 'story' ? '400px' : '500px',
                        maxWidth: '100%'
                    }}
                >
                    <TemplatePreview
                        size={templateSize}
                        data={{
                            headline,
                            subline,
                            qrUrl,
                            logoUrl: customLogo || logoUrl || campaign.logoUrl,
                            logoSize,
                            bgEffect,
                            bgColor1,
                            bgColor2,
                            qrFrame,
                            showSteps,
                            stampCount,
                            rewardText,
                            campaignName: campaign.name
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
