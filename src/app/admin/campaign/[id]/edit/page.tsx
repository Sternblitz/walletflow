'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WalletPassDraft } from '@/lib/wallet/types'
import { PassPreview } from '@/components/wallet/pass-preview'
import { ColorsEditor } from '@/components/wallet/colors-editor'
import { ThemePicker } from '@/components/wallet/theme-picker'
import { FieldsEditor } from '@/components/wallet/fields-editor'
import { ImagesEditor } from '@/components/wallet/images-editor'
import {
    ArrowLeft,
    Loader2,
    Save,
    Send,
    Palette,
    Type,
    Image as ImageIcon,
    CheckCircle2,
    LayoutTemplate,
    Sparkles,
    Smartphone,
    AlertCircle
} from 'lucide-react'

interface Campaign {
    id: string
    name: string
    concept: string
    config: any
    design_assets: WalletPassDraft
    client: {
        name: string
        slug: string
    }
    passes: { id: string }[]
}

export default function CampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [campaignId, setCampaignId] = useState<string | null>(null)
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [draft, setDraft] = useState<WalletPassDraft | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [pushing, setPushing] = useState(false)
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    // Get campaign ID from params
    useEffect(() => {
        params.then(p => setCampaignId(p.id))
    }, [params])

    // Fetch campaign data
    useEffect(() => {
        if (!campaignId) return

        const fetchCampaign = async () => {
            try {
                const res = await fetch(`/api/campaign/${campaignId}`)
                const data = await res.json()

                if (data.campaign) {
                    setCampaign(data.campaign)
                    // Load design_assets as draft
                    if (data.campaign.design_assets) {
                        setDraft(data.campaign.design_assets)
                    }
                }
            } catch (error) {
                console.error('Error fetching campaign:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCampaign()
    }, [campaignId])

    // Handle draft changes
    const handleDraftChange = useCallback((newDraft: WalletPassDraft) => {
        setDraft(newDraft)
        setSaveResult(null) // Clear previous result
    }, [])

    // Update colors helper
    const handleColorChange = useCallback((newColors: WalletPassDraft['colors']) => {
        if (!draft) return
        handleDraftChange({
            ...draft,
            colors: newColors
        })
    }, [draft, handleDraftChange])

    // Save campaign (without push)
    const handleSave = async () => {
        if (!campaignId || !draft) return

        setSaving(true)
        setSaveResult(null)

        try {
            const res = await fetch(`/api/campaign/${campaignId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    design_assets: draft,
                    config: {
                        ...campaign?.config,
                        stampEmoji: draft.stampConfig?.icon || '☕',
                        maxStamps: draft.stampConfig?.total || 10
                    }
                })
            })

            const result = await res.json()

            if (result.success) {
                setSaveResult({ success: true, message: 'Design gespeichert!' })
                // Auto-hide success message
                setTimeout(() => setSaveResult(null), 3000)
            } else {
                setSaveResult({ success: false, message: result.error || 'Fehler beim Speichern' })
            }
        } catch (error) {
            setSaveResult({ success: false, message: 'Netzwerkfehler' })
        } finally {
            setSaving(false)
        }
    }

    // Save and push to all devices
    const handleSaveAndPush = async () => {
        if (!campaignId || !draft) return

        setPushing(true)
        setSaveResult(null)

        try {
            // First save
            const saveRes = await fetch(`/api/campaign/${campaignId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    design_assets: draft,
                    config: {
                        ...campaign?.config,
                        stampEmoji: draft.stampConfig?.icon || '☕',
                        maxStamps: draft.stampConfig?.total || 10
                    }
                })
            })

            if (!saveRes.ok) {
                setSaveResult({ success: false, message: 'Fehler beim Speichern' })
                return
            }

            // Then push updates to all devices
            const pushRes = await fetch(`/api/campaign/${campaignId}/push-update`, {
                method: 'POST'
            })
            const pushResult = await pushRes.json()

            if (pushResult.success) {
                setSaveResult({
                    success: true,
                    message: `Gespeichert & an ${pushResult.count} Kunden gesendet!`
                })
            } else {
                setSaveResult({ success: false, message: 'Gespeichert, aber Update fehlgeschlagen' })
            }
        } catch (error) {
            setSaveResult({ success: false, message: 'Netzwerkfehler' })
        } finally {
            setPushing(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )
    }

    if (!draft || !campaign) return null

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Top Bar */}
            <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/admin/campaign/${campaignId}`}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-sm font-medium text-zinc-400">Design Editor</h1>
                            <p className="font-semibold">{campaign.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {saveResult && (
                            <div className={`text-sm px-3 py-1.5 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${saveResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                {saveResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                {saveResult.message}
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            onClick={handleSave}
                            disabled={saving || pushing}
                            className="text-zinc-400 hover:text-white"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Speichern
                        </Button>

                        <Button
                            onClick={handleSaveAndPush}
                            disabled={saving || pushing}
                            className="bg-white text-black hover:bg-zinc-200"
                        >
                            {pushing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Push an Alle
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Editor Area - Split Screen */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Scrollable Editor Settings */}
                <div className="w-full lg:w-[45%] xl:w-[40%] overflow-y-auto border-r border-white/10 bg-zinc-900/30">
                    <div className="p-6 space-y-12 pb-32">

                        {/* Section 1: Themes & Colors */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Design & Theme</h2>
                                    <p className="text-sm text-zinc-400">Wähle einen Look für deine Karte</p>
                                </div>
                            </div>

                            <ThemePicker draft={draft} onChange={handleColorChange} />

                            <div className="pt-6 border-t border-white/5">
                                <ColorsEditor draft={draft} onChange={handleDraftChange} />
                            </div>
                        </section>

                        {/* Section 2: Branding & Appearance */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                                    <ImageIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Logo & Bilder</h2>
                                    <p className="text-sm text-zinc-400">Mach die Karte zu deiner Marke</p>
                                </div>
                            </div>

                            <ImagesEditor draft={draft} onChange={handleDraftChange} />
                        </section>

                        {/* Section 3: Content & Fields */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                                    <LayoutTemplate className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Inhalt & Felder</h2>
                                    <p className="text-sm text-zinc-400">Texte und Label anpassen</p>
                                </div>
                            </div>

                            <FieldsEditor draft={draft} onChange={handleDraftChange} />
                        </section>

                    </div>
                </div>

                {/* Right: Sticky Preview */}
                <div className="hidden lg:flex flex-1 bg-black items-center justify-center relative overflow-hidden">
                    {/* Ambient Background Glow based on pass color */}
                    <div
                        className="absolute inset-0 opacity-20 blur-[100px] transition-colors duration-700"
                        style={{ background: `radial-gradient(circle at center, ${draft.colors.backgroundColor}, transparent 70%)` }}
                    />

                    <div className="relative z-10 flex flex-col items-center gap-6 scale-90 xl:scale-100 transition-transform duration-300">
                        <div className="px-6 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-zinc-400 text-sm flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Live Vorschau (Apple Wallet)
                        </div>
                        <PassPreview draft={draft} />
                    </div>
                </div>
            </div>
        </div>
    )
}
