import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApplePassPreview } from "@/components/wallet/apple-pass-preview"
import { Upload, Sparkles, Wand2, Stamp, Coins, Crown } from "lucide-react"

// Helper to generate stamp strings
const generateStampString = (total: number, active: number, icon: string) => {
    // ☕️ ☕️ ⚪️ ⚪️ ⚪️
    // Use a hollow circle for empty spots
    const emptyIcon = "⚪️"
    return Array(active).fill(icon).join(' ') + ' ' + Array(Math.max(0, total - active)).fill(emptyIcon).join(' ')
}

// Smart Mock AI to simulate "Infinite" variety
const generateSmartDesign = (query: string) => {
    const q = query.toLowerCase()

    // Default: Generic Tech Blue
    let theme = {
        bg: '#000000', fg: '#FFFFFF', label: '#8E8E93',
        icon: '🏢',
        header: 'GUTHABEN', primary: 'PUNKTE',
        primaryVal: '0', sec1: 'MITGLIED', sec2: 'INFO'
    }

    if (q.includes('döner') || q.includes('kebab') || q.includes('imbiss')) {
        theme = { bg: '#E31C25', fg: '#FFFFFF', label: '#FFC72C', icon: '🥙', header: 'GUTHABEN', primary: 'STAMMKUNDE', primaryVal: '🥙 🥙 ⚪️ ⚪️ ⚪️', sec1: 'STATUS', sec2: 'GRATIS DÖNER' }
    } else if (q.includes('sushi') || q.includes('asia')) {
        theme = { bg: '#1A1A1A', fg: '#FF4500', label: '#808080', icon: '🍣', header: 'VISITS', primary: 'MEMBERSHIP', primaryVal: 'GOLD', sec1: 'SINCE', sec2: 'REWARDS' }
    } else if (q.includes('barber') || q.includes('friseur') || q.includes('hair')) {
        theme = { bg: '#000000', fg: '#FFFFFF', label: '#C0C0C0', icon: '💈', header: 'TERMIN', primary: 'STYLE CLUB', primaryVal: 'VIP', sec1: 'KUNDE SEIT', sec2: 'NEXT CUT' }
    } else if (q.includes('gym') || q.includes('fitness') || q.includes('sport')) {
        theme = { bg: '#1E293B', fg: '#38BDF8', label: '#94A3B8', icon: '💪', header: 'CHECK-INS', primary: 'WORKOUTS', primaryVal: '12 / 20', sec1: 'LEVEL', sec2: 'BEAST MODE' }
    }

    return theme
}

export function Step3Design({ data, update }: any) {
    const [prompt, setPrompt] = useState("")
    const [uploading, setUploading] = useState(false)

    const concept = data.concept || 'STAMP_CARD'

    // Local state for stamp logic
    const [stampConfig, setStampConfig] = useState({
        total: 10,
        current: 2, // Default for preview
        icon: '☕️'
    })

    // Advanced Config State
    const [config, setConfig] = useState({
        backgroundColor: data.designConfig?.backgroundColor || "#1c1c1e",
        labelColor: data.designConfig?.labelColor || "#8e8e93",
        foregroundColor: data.designConfig?.foregroundColor || "#ffffff",
        logoText: data.designConfig?.logoText || (data.clientName || "Store Card"),
        iconUrl: data.designConfig?.iconUrl || "",
        stripImageUrl: data.designConfig?.stripImageUrl || "",
        headerLabel: data.designConfig?.headerLabel || (concept === 'STAMP_CARD' ? 'BONUSKARTE' : 'GUTHABEN'),
        headerValue: data.designConfig?.headerValue || (concept === 'STAMP_CARD' ? '#8392' : '50'),
        primaryLabel: data.designConfig?.primaryLabel || (concept === 'STAMP_CARD' ? 'DEINE STEMPEL' : 'PUNKTE'), // Restored per user request
        primaryValue: data.designConfig?.primaryValue || (concept === 'STAMP_CARD' ? '2 / 10' : '50 P'),
        secLabel1: data.designConfig?.secLabel1 || (concept === 'STAMP_CARD' ? "NÄCHSTE PRÄMIE" : "MITGLIED"),
        secValue1: data.designConfig?.secValue1 || (concept === 'STAMP_CARD' ? "Gratis Produkt" : "GOLD"),
        secLabel2: data.designConfig?.secLabel2 || "", // Cleared (Gültig bis removed)
        secValue2: data.designConfig?.secValue2 || "",
        auxLabel1: data.designConfig?.auxLabel1 || "POWERED BY",
        auxValue1: data.designConfig?.auxValue1 || "QARD",
        stampIcon: data.designConfig?.stampIcon || "🎁", // Engaging default icon
    })

    // Sync to parent
    useEffect(() => {
        update({
            designConfig: { ...data.designConfig, ...config }
        })
    }, [config, update])

    // Update Stamps when stamp config changes
    useEffect(() => {
        if (concept === 'STAMP_CARD') {
            const countStr = `${stampConfig.current} / ${stampConfig.total}`

            // Text is just the count (Clean)
            // Visuals are in the Strip Image (Overlay)
            setConfig(prev => ({
                ...prev,
                primaryValue: countStr,
                stampIcon: stampConfig.icon // <--- SYNC
            }))
        }
    }, [stampConfig, concept])

    const handleChange = (key: string, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }))
    }

    const runMagic = () => {
        if (!prompt) return
        const theme = generateSmartDesign(prompt)

        setConfig(prev => ({
            ...prev,
            backgroundColor: theme.bg,
            foregroundColor: theme.fg,
            labelColor: theme.label,
            headerLabel: theme.header,
            primaryLabel: theme.primary,
            primaryValue: theme.primaryVal,
            secLabel1: theme.sec1,
            secLabel2: theme.sec2,
            logoText: data.clientName || prompt.charAt(0).toUpperCase() + prompt.slice(1) + " Shop"
        }))
    }

    // Supabase Upload Handler - RESILIENT VERSION
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const localUrl = URL.createObjectURL(file)
        handleChange(key, localUrl)

        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `design/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('pass-assets')
                .upload(filePath, file)

            if (uploadError) {
                console.error("Upload failed:", uploadError)
                alert(`Upload Warning: Bild wird lokal angezeigt, aber Upload fehlgeschlagen (${uploadError.message}).`)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('pass-assets')
                .getPublicUrl(filePath)

            handleChange(key, publicUrl)

        } catch (err) {
            console.error("Upload process failed:", err)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in fade-in">

            {/* LEFT: Editor Panel */}
            <div className="lg:col-span-7 space-y-8">

                {/* 1. Nano Banana AI */}
                <div className="bg-gradient-to-br from-yellow-400/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🍌</span>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            Nano Banana Design AI
                        </h2>
                    </div>
                    <div className="space-y-2">
                        <Label>Was für ein Business ist es?</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="z.B. Sushi Bar, Fitnessstudio, Barber Shop, Döner..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && runMagic()}
                                className="text-lg bg-black/20"
                            />
                            <button
                                onClick={runMagic}
                                className="px-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-md hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                Zaubern
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Fine Tuning Tabs */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {concept === 'STAMP_CARD' && <Stamp className="w-4 h-4 text-primary" />}
                            {concept === 'POINTS_CARD' && <Coins className="w-4 h-4 text-blue-500" />}
                            {concept === 'VIP_CLUB' && <Crown className="w-4 h-4 text-amber-500" />}
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                                {concept === 'STAMP_CARD' ? 'Stempelkarte' : concept === 'POINTS_CARD' ? 'Punktekarte' : 'VIP Club'} Editor
                            </h3>
                        </div>
                        <span className="text-xs text-emerald-500 flex items-center gap-1"><Sparkles className="w-3 h-3" /> 100% Anpassbar</span>
                    </div>

                    <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="content">📝 Inhalt</TabsTrigger>
                            <TabsTrigger value="style">🎨 Style</TabsTrigger>
                            <TabsTrigger value="assets">🖼️ Bilder</TabsTrigger>
                        </TabsList>

                        {/* TAB: CONTENT (Adaptive) */}
                        <TabsContent value="content" className="space-y-6 mt-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Logo Text (Oben Links)</Label>
                                        <Input value={config.logoText} onChange={(e) => handleChange('logoText', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Header (Oben Rechts)</Label>
                                        <div className="flex gap-2">
                                            <Input value={config.headerLabel} onChange={(e) => handleChange('headerLabel', e.target.value)} placeholder="KARTE" className="w-1/2" />
                                            <Input value={config.headerValue} onChange={(e) => handleChange('headerValue', e.target.value)} placeholder="123" className="w-1/2" />
                                        </div>
                                    </div>
                                </div>

                                {/* ADAPTIVE SECTION */}
                                <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        {concept === 'STAMP_CARD' && <Stamp className="w-24 h-24" />}
                                        {concept === 'POINTS_CARD' && <Coins className="w-24 h-24" />}
                                        {concept === 'VIP_CLUB' && <Crown className="w-24 h-24" />}
                                    </div>

                                    {/* STAMP CARD SPECIFIC */}
                                    {concept === 'STAMP_CARD' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Anzahl Stempel</Label>
                                                    <Input
                                                        type="number"
                                                        value={stampConfig.total}
                                                        onChange={(e) => setStampConfig({ ...stampConfig, total: parseInt(e.target.value) || 10 })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Stempel Icon (Emoji)</Label>
                                                    <Input
                                                        value={stampConfig.icon}
                                                        onChange={(e) => setStampConfig({ ...stampConfig, icon: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <Label className="text-xs text-muted-foreground">Vorschau Wert (Automatisch):</Label>
                                                <div className="text-lg bg-black/20 p-2 rounded mt-1 font-mono tracking-widest truncate">
                                                    {config.primaryValue}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* POINTS CARD SPECIFIC */}
                                    {concept === 'POINTS_CARD' && (
                                        <div className="space-y-2">
                                            <Label>Währung (z.B. 'Punkte', 'Coins')</Label>
                                            <div className="flex gap-2">
                                                <Input value={config.primaryLabel} onChange={(e) => handleChange('primaryLabel', e.target.value)} placeholder="PUNKTE" />
                                                <Input value={config.primaryValue} onChange={(e) => handleChange('primaryValue', e.target.value)} placeholder="Startwert" className="w-24" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Dies ist der große Wert in der Mitte.</p>
                                        </div>
                                    )}

                                    {/* VIP CLUB SPECIFIC */}
                                    {concept === 'VIP_CLUB' && (
                                        <div className="space-y-2">
                                            <Label>Status Bezeichnung</Label>
                                            <div className="flex gap-2">
                                                <Input value={config.primaryLabel} onChange={(e) => handleChange('primaryLabel', e.target.value)} placeholder="STATUS" />
                                                <Input value={config.primaryValue} onChange={(e) => handleChange('primaryValue', e.target.value)} placeholder="GOLD MEMBER" className="font-bold text-amber-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SECONDARY FIELDS */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-muted-foreground">Info 1 (Links Unten)</Label>
                                        <Input value={config.secLabel1} onChange={(e) => handleChange('secLabel1', e.target.value)} placeholder="Label" />
                                        <Input value={config.secValue1} onChange={(e) => handleChange('secValue1', e.target.value)} placeholder="Wert" className="mt-1" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-muted-foreground">Info 2 (Rechts Unten)</Label>
                                        <Input value={config.secLabel2} onChange={(e) => handleChange('secLabel2', e.target.value)} placeholder="Label" />
                                        <Input value={config.secValue2} onChange={(e) => handleChange('secValue2', e.target.value)} placeholder="Wert" className="mt-1" />
                                    </div>
                                </div>

                                {/* AUXILIARY FIELDS (Branding) */}
                                <div className="pt-4 border-t border-white/10">
                                    <Label className="text-xs uppercase text-muted-foreground pb-2 block">Branding (Karte Unten)</Label>
                                    <div className="flex gap-2">
                                        <Input value={config.auxLabel1} onChange={(e) => handleChange('auxLabel1', e.target.value)} placeholder="POWERED BY" className="text-xs" />
                                        <Input value={config.auxValue1} onChange={(e) => handleChange('auxValue1', e.target.value)} placeholder="QARD" className="text-xs font-bold" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: STYLE (Colors) */}
                        <TabsContent value="style" className="space-y-6 mt-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Hintergrund</Label>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0 shadow-lg" style={{ backgroundColor: config.backgroundColor }}>
                                            <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={config.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                                        </div>
                                        <Input value={config.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} className="font-mono bg-white/5" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Text (Vordergrund)</Label>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0 shadow-lg" style={{ backgroundColor: config.foregroundColor }}>
                                            <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={config.foregroundColor} onChange={(e) => handleChange('foregroundColor', e.target.value)} />
                                        </div>
                                        <Input value={config.foregroundColor} onChange={(e) => handleChange('foregroundColor', e.target.value)} className="font-mono bg-white/5" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Labels (Grau)</Label>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0 shadow-lg" style={{ backgroundColor: config.labelColor }}>
                                            <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={config.labelColor} onChange={(e) => handleChange('labelColor', e.target.value)} />
                                        </div>
                                        <Input value={config.labelColor} onChange={(e) => handleChange('labelColor', e.target.value)} className="font-mono bg-white/5" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: ASSETS (Images) */}
                        <TabsContent value="assets" className="space-y-6 mt-6">
                            <div className="space-y-6">

                                {/* Icon Upload */}
                                <div className="space-y-2">
                                    <Label>Icon (Logo)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-md flex items-center justify-center border border-white/10 overflow-hidden relative">
                                            {config.iconUrl ? (
                                                <img src={config.iconUrl} className="w-full h-full object-contain p-1" />
                                            ) : <Upload className="w-6 h-6 text-muted-foreground" />}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'iconUrl')} />
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Logo (PNG, Transparent).<br />
                                            {uploading && <span className="text-yellow-500 animate-pulse font-bold">Lade hoch...</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Strip Upload */}
                                <div className="space-y-2">
                                    <Label>Strip Image (Hero)</Label>
                                    <div className="w-full h-32 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden relative group hover:border-white/30 transition-colors">
                                        {config.stripImageUrl ? (
                                            <img src={config.stripImageUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Upload className="w-8 h-8" />
                                                <span className="text-xs uppercase tracking-widest">Bild hochladen</span>
                                            </div>
                                        )}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'stripImageUrl')} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Empfohlen: <strong>1125 x 432 px</strong> (Standard Strip Format).
                                        <br />
                                        <span className="text-red-400">Achtung:</span> Der rechte Bereich (ca. 10%) ist für "Safe Zones" reserviert.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* RIGHT: Live Preview (Sticky) */}
            <div className="lg:col-span-5 relative">
                <div className="sticky top-8">
                    <div className="bg-zinc-950/50 rounded-2xl border border-white/5 p-8 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                        <div className="scale-100 sm:scale-110 lg:scale-100 transition-all duration-500">
                            <ApplePassPreview
                                {...config}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
