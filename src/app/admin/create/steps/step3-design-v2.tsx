"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WalletSimulator } from "@/components/wallet/wallet-simulator"
import { generateFullDesign, type FullDesignProposal } from "@/lib/ai-design"
import {
    Palette,
    Type,
    Image as ImageIcon,
    Sparkles,
    Wand2,
    Eye,
    EyeOff,
    Stamp,
    Settings2,
    ChevronRight,
    Upload,
    CheckCircle2,
    Loader2,
    Zap,
    Crown,
    Coffee,
    Gift,
    Star,
    Heart,
    Flame,
    Diamond,
    Target,
    Pizza,
    Utensils,
    Scissors,
    Dumbbell,
    Music,
    Camera,
    ShoppingBag,
    Car,
    Plane,
    RefreshCw
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface Step3DesignProps {
    data: any
    update: (data: any) => void
}

// Ultra Premium Color Themes - BRIGHT & VIBRANT
const DESIGN_THEMES = [
    {
        id: "aurora",
        name: "Aurora",
        bg: "#1A1033",
        fg: "#FFFFFF",
        label: "#C4B5FD",
        preview: "linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)"
    },
    {
        id: "sunset",
        name: "Sunset Glow",
        bg: "#1A1014",
        fg: "#FFFFFF",
        label: "#FFA07A",
        preview: "linear-gradient(135deg, #FF6B6B 0%, #FFA07A 50%, #FFD93D 100%)"
    },
    {
        id: "ocean",
        name: "Ocean Wave",
        bg: "#0A1628",
        fg: "#FFFFFF",
        label: "#00D4FF",
        preview: "linear-gradient(135deg, #00D4FF 0%, #0099CC 50%, #7DF9FF 100%)"
    },
    {
        id: "neon",
        name: "Neon Night",
        bg: "#0A0A1A",
        fg: "#FFFFFF",
        label: "#00FFD1",
        preview: "linear-gradient(135deg, #00FFD1 0%, #00E5FF 50%, #76FF03 100%)"
    },
    {
        id: "rose",
        name: "Rose Gold",
        bg: "#1A0A14",
        fg: "#FFFFFF",
        label: "#FF69B4",
        preview: "linear-gradient(135deg, #FF69B4 0%, #FF1493 50%, #FFB6C1 100%)"
    },
    {
        id: "royal",
        name: "Royal Purple",
        bg: "#10002B",
        fg: "#FFFFFF",
        label: "#E0AAFF",
        preview: "linear-gradient(135deg, #9D4EDD 0%, #7B2CBF 50%, #C77DFF 100%)"
    },
    {
        id: "emerald",
        name: "Emerald",
        bg: "#0A1A14",
        fg: "#FFFFFF",
        label: "#00FF87",
        preview: "linear-gradient(135deg, #00FF87 0%, #00CC6A 50%, #7DFF9D 100%)"
    },
    {
        id: "gold",
        name: "Black Gold",
        bg: "#1A1A2E",
        fg: "#FFFFFF",
        label: "#FFD700",
        preview: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFE55C 100%)"
    },
    {
        id: "fire",
        name: "Fire Storm",
        bg: "#1A0F0A",
        fg: "#FFFFFF",
        label: "#FF6B35",
        preview: "linear-gradient(135deg, #FF6B35 0%, #F7418F 50%, #FFB347 100%)"
    },
    {
        id: "arctic",
        name: "Arctic Ice",
        bg: "#0D1117",
        fg: "#FFFFFF",
        label: "#7DD3FC",
        preview: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 50%, #BAE6FD 100%)"
    },
]

// Business Type Presets - BRIGHTER COLORS
const BUSINESS_PRESETS = [
    { icon: Coffee, label: "Café", emoji: "☕️", colors: { bg: "#2C1810", fg: "#FFF8F0", label: "#D4A574" } },
    { icon: Pizza, label: "Restaurant", emoji: "🍕", colors: { bg: "#1A1A2E", fg: "#FFFFFF", label: "#FFD700" } },
    { icon: Utensils, label: "Sushi", emoji: "🍣", colors: { bg: "#1A0A14", fg: "#FFFFFF", label: "#FF69B4" } },
    { icon: Scissors, label: "Barber", emoji: "💈", colors: { bg: "#1A1A1A", fg: "#FFFFFF", label: "#D4AF37" } },
    { icon: Dumbbell, label: "Gym", emoji: "💪", colors: { bg: "#0A1A14", fg: "#FFFFFF", label: "#00FF87" } },
    { icon: ShoppingBag, label: "Retail", emoji: "🛍️", colors: { bg: "#1A0A10", fg: "#FFFFFF", label: "#FF80AB" } },
    { icon: Camera, label: "Studio", emoji: "📸", colors: { bg: "#10002B", fg: "#FFFFFF", label: "#E0AAFF" } },
    { icon: Music, label: "Club", emoji: "🎵", colors: { bg: "#0A0A1A", fg: "#FFFFFF", label: "#00FFD1" } },
]

// Stamp Icon Categories
const STAMP_ICONS = {
    food: ["☕️", "🍕", "🍔", "🍣", "🍜", "🥗", "🌮", "🥐", "🍰", "🧁"],
    rewards: ["🎁", "⭐️", "💎", "👑", "🏆", "🎯", "✨", "💫", "🌟", "🔥"],
    lifestyle: ["❤️", "💪", "🎵", "📸", "✂️", "🚗", "✈️", "🏠", "🌸", "🍀"],
}

export function Step3DesignV2({ data, update }: Step3DesignProps) {
    const concept = data.concept || 'STAMP_CARD'

    // Design State
    const [config, setConfig] = useState({
        backgroundColor: data.designConfig?.backgroundColor || "#0A0A0B",
        labelColor: data.designConfig?.labelColor || "#71717A",
        foregroundColor: data.designConfig?.foregroundColor || "#FFFFFF",
        logoText: data.designConfig?.logoText || (data.clientName || "Store"),
        iconUrl: data.designConfig?.iconUrl || "",
        stripImageUrl: data.designConfig?.stripImageUrl || "",
        headerLabel: data.designConfig?.headerLabel || "BONUSKARTE",
        headerValue: data.designConfig?.headerValue || "#" + Math.floor(Math.random() * 9000 + 1000),
        primaryLabel: data.designConfig?.primaryLabel || "DEINE STEMPEL",
        primaryValue: data.designConfig?.primaryValue || "2 / 10",
        secLabel1: data.designConfig?.secLabel1 || "NÄCHSTE PRÄMIE",
        secValue1: data.designConfig?.secValue1 || "Gratis Produkt",
        secLabel2: data.designConfig?.secLabel2 || "",
        secValue2: data.designConfig?.secValue2 || "",
        auxLabel1: data.designConfig?.auxLabel1 || "POWERED BY",
        auxValue1: data.designConfig?.auxValue1 || "PASSIFY",
        stampIcon: data.designConfig?.stampIcon || "☕️",
    })

    // Stamp Config - Extended with layout options
    const [stampConfig, setStampConfig] = useState({
        total: 10,
        current: 2,
        icon: config.stampIcon,
        // Layout - auto sizing for perfect fit
        layout: 'bottom-spread' as 'bottom-spread' | 'bottom-centered' | 'right',
        stampSize: 'auto' as 'small' | 'medium' | 'large' | 'auto',
        spacing: 'auto' as 'tight' | 'normal' | 'loose' | 'auto',
        // Style - pure canvas graphics
        stampStyle: 'check' as 'filled' | 'glow' | 'ring' | 'check',
        emptyStyle: 'subtle' as 'dashed' | 'solid' | 'faded' | 'subtle',
        // Content (Apple handles text rendering)
        showLabel: true,
        showCount: true,
    })

    // UI State
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
    const [showSafeZones, setShowSafeZones] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [iconCategory, setIconCategory] = useState<keyof typeof STAMP_ICONS>("food")

    // AI State
    const [aiPrompt, setAiPrompt] = useState("")
    const [aiLoading, setAiLoading] = useState(false)
    const [aiDesign, setAiDesign] = useState<FullDesignProposal | null>(null)
    const [showAiResults, setShowAiResults] = useState(false)

    // Sync to parent - include stamp config
    useEffect(() => {
        update({
            designConfig: {
                ...config,
                // Stamp layout options
                stampLayout: stampConfig.layout,
                stampSize: stampConfig.stampSize,
                stampSpacing: stampConfig.spacing,
                stampStyle: stampConfig.stampStyle,
                emptyStyle: stampConfig.emptyStyle,
                showStampLabel: stampConfig.showLabel,
                showStampCount: stampConfig.showCount,
            }
        })
    }, [config, stampConfig, update])

    // Update primary value when stamps change
    useEffect(() => {
        if (concept === 'STAMP_CARD') {
            setConfig(prev => ({
                ...prev,
                primaryValue: `${stampConfig.current} / ${stampConfig.total}`,
                stampIcon: stampConfig.icon,
                accentColor: prev.labelColor, // Use label color for glow
            }))
        }
    }, [stampConfig, concept])

    // Dynamic strip image URL for stamp cards
    const dynamicStripUrl = useMemo(() => {
        if (concept !== 'STAMP_CARD') return config.stripImageUrl

        const params = new URLSearchParams({
            total: stampConfig.total.toString(),
            current: stampConfig.current.toString(),
            icon: stampConfig.icon,
            layout: stampConfig.layout,
            stampSize: stampConfig.stampSize,
            spacing: stampConfig.spacing,
            stampStyle: stampConfig.stampStyle,
            emptyStyle: stampConfig.emptyStyle,
            showLabel: stampConfig.showLabel.toString(),
            showCount: stampConfig.showCount.toString(),
            bgColor: config.backgroundColor,
            accentColor: config.labelColor,
        })
        return `/api/preview/strip?${params.toString()}`
    }, [concept, stampConfig, config.stripImageUrl, config.backgroundColor, config.labelColor])

    const handleChange = useCallback((key: string, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }))
    }, [])

    const applyTheme = useCallback((theme: typeof DESIGN_THEMES[0]) => {
        setSelectedTheme(theme.id)
        setConfig(prev => ({
            ...prev,
            backgroundColor: theme.bg,
            foregroundColor: theme.fg,
            labelColor: theme.label
        }))
    }, [])

    const applyBusinessPreset = useCallback((preset: typeof BUSINESS_PRESETS[0]) => {
        setConfig(prev => ({
            ...prev,
            backgroundColor: preset.colors.bg,
            foregroundColor: preset.colors.fg,
            labelColor: preset.colors.label,
        }))
        setStampConfig(prev => ({ ...prev, icon: preset.emoji }))
    }, [])

    // AI Design Generation - Always generates icon
    const runAiDesign = async () => {
        if (!aiPrompt.trim()) return
        setAiLoading(true)
        setShowAiResults(true)
        setAiDesign(null)

        try {
            // Always generate with icon by default
            const design = await generateFullDesign(aiPrompt, config.logoText, concept, true)
            if (design) {
                setAiDesign(design)
            }
        } catch (e) {
            console.error("AI Design failed:", e)
        } finally {
            setAiLoading(false)
        }
    }

    const applyAiDesign = () => {
        if (!aiDesign) return

        // Apply EVERYTHING from the AI design
        setConfig(prev => ({
            ...prev,
            // Colors
            backgroundColor: aiDesign.colors.background,
            foregroundColor: aiDesign.colors.text,
            labelColor: aiDesign.colors.label,
            accentColor: aiDesign.colors.accent,
            // Content
            logoText: aiDesign.content.logoText,
            headerLabel: aiDesign.content.headerLabel,
            headerValue: aiDesign.content.headerValue,
            primaryLabel: aiDesign.content.primaryLabel,
            secLabel1: aiDesign.content.secLabel1,
            secValue1: aiDesign.content.secValue1,
            auxLabel1: aiDesign.content.auxLabel1,
            auxValue1: aiDesign.content.auxValue1,
            // AI-generated stamp icon URL
            stampIconUrl: aiDesign.stampIconUrl,
        }))
        // Update stamp emoji (fallback)
        setStampConfig(prev => ({ ...prev, icon: aiDesign.stampIcon }))
        setShowAiResults(false)
        setSelectedTheme(null)
    }

    // File Upload Handler
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
            const fileName = `${crypto.randomUUID()}.${fileExt}`
            const filePath = `design/${fileName}`

            const { error } = await supabase.storage
                .from('pass-assets')
                .upload(filePath, file)

            if (!error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('pass-assets')
                    .getPublicUrl(filePath)
                handleChange(key, publicUrl)
            }
        } catch (err) {
            console.error("Upload error:", err)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 min-h-[600px]">

            {/* === LEFT: EDITOR PANELS === */}
            <div className="xl:col-span-7 space-y-6">

                {/* === AI DESIGN SECTION === */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl"
                >
                    {/* Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 opacity-50" />
                    <div className="absolute inset-[1px] bg-zinc-950 rounded-2xl" />

                    <div className="relative p-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/25">
                                    <Wand2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        Nano Banana AI
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium">
                                            MAGIC
                                        </span>
                                    </h3>
                                    <p className="text-xs text-white/40">Beschreibe dein Business – wir zaubern das Design</p>
                                </div>
                            </div>
                            <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                        </div>

                        {/* Input */}
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && runAiDesign()}
                                    placeholder="z.B. Hipster Café in Berlin, Premium Sushi Bar, Luxury Barber Shop..."
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10 h-12 text-sm"
                                />
                                <Zap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fuchsia-400/50" />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={runAiDesign}
                                disabled={aiLoading || !aiPrompt.trim()}
                                className={cn(
                                    "px-6 h-12 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
                                    "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500",
                                    "hover:shadow-lg hover:shadow-fuchsia-500/25",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {aiLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {aiLoading ? "Designing..." : "Generate"}
                            </motion.button>
                        </div>

                        {/* AI Icon Generation Info */}
                        <div className="flex items-center gap-2 pt-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                            <Crown className="w-4 h-4 text-violet-400" />
                            <span className="text-xs text-violet-300">
                                AI generiert automatisch ein passendes Premium-Icon
                            </span>
                        </div>

                        {/* AI Results */}
                        <AnimatePresence>
                            {showAiResults && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4 border-t border-white/10">
                                        {aiLoading ? (
                                            <div className="flex items-center justify-center py-8 gap-3">
                                                <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        ) : aiDesign ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-4"
                                            >
                                                {/* AI Generated Design Preview */}
                                                <div className="p-4 rounded-xl bg-gradient-to-br from-fuchsia-500/10 to-violet-500/10 border border-fuchsia-500/20">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-white flex items-center gap-2">
                                                                {aiDesign.stampIcon} {aiDesign.name}
                                                            </h4>
                                                            <p className="text-xs text-white/50">{aiDesign.style}</p>
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={applyAiDesign}
                                                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white text-sm font-bold shadow-lg shadow-fuchsia-500/25"
                                                        >
                                                            ✨ Anwenden
                                                        </motion.button>
                                                    </div>

                                                    {/* Color Preview */}
                                                    <div className="flex gap-2 mb-3">
                                                        <div
                                                            className="w-10 h-10 rounded-lg border border-white/20"
                                                            style={{ backgroundColor: aiDesign.colors.background }}
                                                            title="Hintergrund"
                                                        />
                                                        <div
                                                            className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center text-xs font-bold"
                                                            style={{ backgroundColor: aiDesign.colors.background, color: aiDesign.colors.text }}
                                                            title="Text"
                                                        >
                                                            Aa
                                                        </div>
                                                        <div
                                                            className="w-10 h-10 rounded-lg border border-white/20"
                                                            style={{ backgroundColor: aiDesign.colors.label }}
                                                            title="Label"
                                                        />
                                                    </div>

                                                    {/* Content Preview */}
                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                        <div className="bg-black/20 rounded px-2 py-1">
                                                            <span className="text-white/40">Name:</span>{' '}
                                                            <span className="text-white/80">{aiDesign.content.logoText}</span>
                                                        </div>
                                                        <div className="bg-black/20 rounded px-2 py-1">
                                                            <span className="text-white/40">Prämie:</span>{' '}
                                                            <span className="text-white/80">{aiDesign.content.secValue1}</span>
                                                        </div>
                                                    </div>

                                                    {aiDesign.stampIconUrl && (
                                                        <div className="mt-3 text-[10px] text-emerald-400">
                                                            ✓ AI-Icon generiert
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="text-center py-6 text-white/30 text-sm">
                                                Kein Design generiert
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick Business Presets */}
                        <div className="pt-2">
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Schnellstart</p>
                            <div className="flex flex-wrap gap-2">
                                {BUSINESS_PRESETS.map((preset) => (
                                    <motion.button
                                        key={preset.label}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => applyBusinessPreset(preset)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
                                    >
                                        <preset.icon className="w-3.5 h-3.5 text-white/60" />
                                        <span className="text-xs text-white/80">{preset.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* === THEME SELECTOR === */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Palette className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Color Theme</h3>
                                <p className="text-[10px] text-white/40">Wähle dein Farbschema</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        {DESIGN_THEMES.map((theme) => (
                            <motion.button
                                key={theme.id}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => applyTheme(theme)}
                                className={cn(
                                    "relative group aspect-square rounded-xl overflow-hidden transition-all",
                                    "ring-2 ring-offset-2 ring-offset-zinc-950",
                                    selectedTheme === theme.id
                                        ? "ring-white"
                                        : "ring-transparent hover:ring-white/30"
                                )}
                            >
                                <div
                                    className="absolute inset-0"
                                    style={{ background: theme.preview }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <span className="text-[9px] text-white font-medium">{theme.name}</span>
                                </div>
                                {selectedTheme === theme.id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Manual Color Inputs */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        {[
                            { key: 'backgroundColor', label: 'Hintergrund', icon: '🎨' },
                            { key: 'foregroundColor', label: 'Text', icon: '✏️' },
                            { key: 'labelColor', label: 'Labels', icon: '🏷️' }
                        ].map(({ key, label, icon }) => (
                            <div key={key} className="space-y-2">
                                <Label className="text-[10px] text-white/40 flex items-center gap-1">
                                    <span>{icon}</span> {label}
                                </Label>
                                <div className="flex gap-2">
                                    <div
                                        className="w-9 h-9 rounded-lg border border-white/20 overflow-hidden shrink-0 cursor-pointer shadow-lg"
                                        style={{ backgroundColor: config[key as keyof typeof config] as string }}
                                    >
                                        <input
                                            type="color"
                                            value={config[key as keyof typeof config] as string}
                                            onChange={(e) => {
                                                handleChange(key, e.target.value)
                                                setSelectedTheme(null)
                                            }}
                                            className="w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        value={config[key as keyof typeof config] as string}
                                        onChange={(e) => {
                                            handleChange(key, e.target.value)
                                            setSelectedTheme(null)
                                        }}
                                        className="bg-white/5 border-white/10 text-[11px] h-9 font-mono"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* === STAMP CONFIG (Only for Stamp Cards) === */}
                {concept === 'STAMP_CARD' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                <Stamp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Stempel Konfiguration</h3>
                                <p className="text-[10px] text-white/40">Anzahl & Icon deiner Stempel</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40">Anzahl Stempel</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={stampConfig.total}
                                    onChange={(e) => setStampConfig(prev => ({ ...prev, total: parseInt(e.target.value) || 10 }))}
                                    className="bg-white/5 border-white/10 h-10 text-center text-lg font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40">Bereits gesammelt</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={stampConfig.total}
                                    value={stampConfig.current}
                                    onChange={(e) => setStampConfig(prev => ({ ...prev, current: Math.min(parseInt(e.target.value) || 0, prev.total) }))}
                                    className="bg-white/5 border-white/10 h-10 text-center text-lg font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40">Aktuelles Icon</Label>
                                <div className="h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                                    {stampConfig.icon}
                                </div>
                            </div>
                        </div>

                        {/* Icon Picker */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                {(Object.keys(STAMP_ICONS) as Array<keyof typeof STAMP_ICONS>).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setIconCategory(cat)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                            iconCategory === cat
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-white/5 text-white/50 border border-transparent hover:border-white/10"
                                        )}
                                    >
                                        {cat === 'food' ? '🍽️ Food' : cat === 'rewards' ? '🎁 Rewards' : '💫 Lifestyle'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {STAMP_ICONS[iconCategory].map((icon) => (
                                    <motion.button
                                        key={icon}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setStampConfig(prev => ({ ...prev, icon }))}
                                        className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all",
                                            stampConfig.icon === icon
                                                ? "bg-emerald-500/20 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20"
                                                : "bg-white/5 hover:bg-white/10 border border-white/10"
                                        )}
                                    >
                                        {icon}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* === LAYOUT CONTROLS === */}
                        <div className="pt-4 border-t border-white/10 space-y-4">
                            <p className="text-[10px] text-white/30 uppercase tracking-widest">Position & Style</p>

                            {/* Layout Picker - New safe-zone aware options */}
                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40">Stempel-Position</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'bottom-spread', icon: '↔', label: 'Verteilt', desc: 'Volle Breite' },
                                        { id: 'bottom-centered', icon: '→←', label: 'Zentriert', desc: 'Mitte' },
                                        { id: 'right', icon: '→', label: 'Rechts', desc: 'Neben Text' },
                                    ].map((l) => (
                                        <button
                                            key={l.id}
                                            onClick={() => setStampConfig(prev => ({ ...prev, layout: l.id as any }))}
                                            className={cn(
                                                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                                                stampConfig.layout === l.id
                                                    ? "bg-violet-500/20 ring-2 ring-violet-500 text-violet-300"
                                                    : "bg-white/5 text-white/50 hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-xl">{l.icon}</span>
                                            <span className="text-xs font-medium">{l.label}</span>
                                            <span className="text-[9px] text-white/30">{l.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size & Spacing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-white/40">Stempel-Größe</Label>
                                    <div className="flex gap-2">
                                        {(['auto', 'small', 'medium', 'large'] as const).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setStampConfig(prev => ({ ...prev, stampSize: size }))}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                                                    stampConfig.stampSize === size
                                                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500"
                                                        : "bg-white/5 text-white/50 hover:bg-white/10"
                                                )}
                                            >
                                                {size === 'auto' ? 'Auto' : size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-white/40">Abstand</Label>
                                    <div className="flex gap-2">
                                        {(['auto', 'tight', 'normal', 'loose'] as const).map((sp) => (
                                            <button
                                                key={sp}
                                                onClick={() => setStampConfig(prev => ({ ...prev, spacing: sp }))}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                                                    stampConfig.spacing === sp
                                                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500"
                                                        : "bg-white/5 text-white/50 hover:bg-white/10"
                                                )}
                                            >
                                                {sp === 'auto' ? 'Auto' : sp === 'tight' ? 'Eng' : sp === 'normal' ? 'Normal' : 'Weit'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stamp Style */}
                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40">Stempel-Stil</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'filled', label: '●', desc: 'Gefüllt' },
                                        { id: 'glow', label: '◉', desc: 'Leuchtend' },
                                        { id: 'ring', label: '◎', desc: 'Ring' },
                                        { id: 'check', label: '✓', desc: 'Check' },
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setStampConfig(prev => ({ ...prev, stampStyle: s.id as any }))}
                                            className={cn(
                                                "flex flex-col items-center gap-0.5 p-2 rounded-xl text-center transition-all",
                                                stampConfig.stampStyle === s.id
                                                    ? "bg-fuchsia-500/20 ring-1 ring-fuchsia-500 text-fuchsia-300"
                                                    : "bg-white/5 text-white/50 hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-lg">{s.label}</span>
                                            <span className="text-[9px] text-white/40">{s.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Empty Style */}
                            <div className="space-y-2">
                                <Label className="text-[10px] text-white/40">Leere Stempel</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'dashed', label: 'Gestrichelt' },
                                        { id: 'solid', label: 'Durchgehend' },
                                        { id: 'faded', label: 'Verblasst' },
                                    ].map((e) => (
                                        <button
                                            key={e.id}
                                            onClick={() => setStampConfig(prev => ({ ...prev, emptyStyle: e.id as any }))}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                                                stampConfig.emptyStyle === e.id
                                                    ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500"
                                                    : "bg-white/5 text-white/50 hover:bg-white/10"
                                            )}
                                        >
                                            {e.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Toggles */}
                            <div className="flex gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={stampConfig.showLabel}
                                        onChange={(e) => setStampConfig(prev => ({ ...prev, showLabel: e.target.checked }))}
                                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-violet-500 focus:ring-violet-500"
                                    />
                                    <span className="text-xs text-white/60">Label zeigen</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={stampConfig.showCount}
                                        onChange={(e) => setStampConfig(prev => ({ ...prev, showCount: e.target.checked }))}
                                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-violet-500 focus:ring-violet-500"
                                    />
                                    <span className="text-xs text-white/60">Zähler zeigen</span>
                                </label>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* === CONTENT & TEXT === */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                            <Type className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-sm">Inhalt & Text</h3>
                            <p className="text-[10px] text-white/40">Alle Texte auf deiner Karte</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-white/40">🏪 Shop Name</Label>
                            <Input
                                value={config.logoText}
                                onChange={(e) => handleChange('logoText', e.target.value)}
                                className="bg-white/5 border-white/10 h-10"
                                placeholder="Dein Shop"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-white/40">🔢 Karten-Nr.</Label>
                            <Input
                                value={config.headerValue}
                                onChange={(e) => handleChange('headerValue', e.target.value)}
                                className="bg-white/5 border-white/10 h-10 font-mono"
                                placeholder="#1234"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-white/40">🎯 Info Feld 1</Label>
                            <Input
                                value={config.secLabel1}
                                onChange={(e) => handleChange('secLabel1', e.target.value)}
                                className="bg-white/5 border-white/10 h-9 text-xs"
                                placeholder="Label"
                            />
                            <Input
                                value={config.secValue1}
                                onChange={(e) => handleChange('secValue1', e.target.value)}
                                className="bg-white/5 border-white/10 h-9 text-xs"
                                placeholder="Wert"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-white/40">📋 Info Feld 2 (Optional)</Label>
                            <Input
                                value={config.secLabel2}
                                onChange={(e) => handleChange('secLabel2', e.target.value)}
                                className="bg-white/5 border-white/10 h-9 text-xs"
                                placeholder="Label"
                            />
                            <Input
                                value={config.secValue2}
                                onChange={(e) => handleChange('secValue2', e.target.value)}
                                className="bg-white/5 border-white/10 h-9 text-xs"
                                placeholder="Wert"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* === IMAGES === */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-sm">Bilder</h3>
                            <p className="text-[10px] text-white/40">Logo & Hintergrundbild</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Icon Upload */}
                        <div className="space-y-2">
                            <Label className="text-[10px] text-white/40">Logo / Icon</Label>
                            <div className="relative w-full aspect-square max-w-[100px] rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-white/30 transition-all">
                                {config.iconUrl ? (
                                    <img src={config.iconUrl} className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-white/20">
                                        <Upload className="w-6 h-6" />
                                        <span className="text-[9px]">87×87 px</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'iconUrl')}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Strip Upload */}
                        <div className="space-y-2 col-span-1">
                            <Label className="text-[10px] text-white/40">Strip Hintergrund (Optional)</Label>
                            <div className="relative w-full h-20 rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-white/30 transition-all">
                                {config.stripImageUrl && !config.stripImageUrl.startsWith('/api') ? (
                                    <img src={config.stripImageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-white/20">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-[9px]">1125×432 px</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'stripImageUrl')}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* === RIGHT: LIVE PREVIEW === */}
            <div className="xl:col-span-5">
                <div className="sticky top-6 space-y-4">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-white/40" />
                            <span className="text-xs text-white/40 font-medium">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSafeZones(!showSafeZones)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                                    showSafeZones
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                                )}
                            >
                                {showSafeZones ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                Safe Zones
                            </button>
                        </div>
                    </div>

                    {/* Preview Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative flex items-center justify-center p-10 rounded-3xl bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-black border border-white/5 min-h-[540px]"
                    >
                        {/* Decorative Grid */}
                        <div
                            className="absolute inset-0 opacity-[0.02] rounded-3xl"
                            style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                                backgroundSize: '24px 24px'
                            }}
                        />

                        {/* Glow Effect */}
                        <div
                            className="absolute inset-0 opacity-30 blur-3xl"
                            style={{
                                background: `radial-gradient(ellipse at center, ${config.backgroundColor}40, transparent 70%)`
                            }}
                        />

                        <WalletSimulator
                            passType="storeCard"
                            backgroundColor={config.backgroundColor}
                            labelColor={config.labelColor}
                            foregroundColor={config.foregroundColor}
                            logoText={config.logoText}
                            iconUrl={config.iconUrl}
                            stripImageUrl={concept === 'STAMP_CARD' ? dynamicStripUrl : config.stripImageUrl}
                            headerLabel={config.headerLabel}
                            headerValue={config.headerValue}
                            primaryLabel={config.primaryLabel}
                            primaryValue={config.primaryValue}
                            secLabel1={config.secLabel1}
                            secValue1={config.secValue1}
                            secLabel2={config.secLabel2}
                            secValue2={config.secValue2}
                            auxLabel1={config.auxLabel1}
                            auxValue1={config.auxValue1}
                            showSafeZones={showSafeZones}
                        />
                    </motion.div>

                    {/* Info */}
                    <div className="flex items-center justify-center gap-6 text-[10px] text-white/30">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                            <span>Sichtbarer Bereich</span>
                        </div>
                        {showSafeZones && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                <span>Nicht schneiden (Safe Zone)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
