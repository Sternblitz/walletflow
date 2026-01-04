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
import { LocationsEditor } from '@/components/wallet/locations-editor'
import { Location } from '@/components/ui/location-picker'
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
    AlertCircle,
    MapPin
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
    // Locations state (separate from draft, part of config)
    const [locations, setLocations] = useState<Location[]>([])

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
                    // Load locations from config
                    if (data.campaign.config?.locations) {
                        setLocations(data.campaign.config.locations)
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

    // Handle locations change
    const handleLocationsChange = useCallback((newLocations: Location[]) => {
        setLocations(newLocations)
        setSaveResult(null)
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
                        locations: locations, // Save locations
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
                        locations: locations, // Save locations
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
        <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">

            {/* 1. Command Bar (Top Navigation) */}
            <div className="h-16 shrink-0 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-6">
                    <Link
                        href="/admin"
                        className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                        title="Zurück zum Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Editor</span>
                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Live Draft
                            </span>
                        </div>
                        <h1 className="text-lg font-bold text-white">{campaign?.name || 'Lade Kampagne...'}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving}
                        onClick={handleSave}
                        className="text-zinc-400 hover:text-white"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Speichern
                    </Button>
                    <Button
                        size="sm"
                        disabled={pushing || !draft}
                        onClick={handleSaveAndPush}
                        className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-full px-6"
                    >
                        {pushing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Push Update
                    </Button>
                </div>
            </div>

            {/* 2. Workspace (Split Screen) */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Panel: Settings (Scrollable) */}
                <div className="w-[500px] border-r border-white/5 bg-zinc-900/30 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="p-6 md:p-8 space-y-12 pb-32">

                        {/* Section: Themes */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Smart Themes</h2>
                                    <p className="text-xs text-zinc-500">Wähle einen professionellen Stil.</p>
                                </div>
                            </div>
                            <ThemePicker
                                draft={draft!}
                                onChange={handleColorChange}
                            />
                        </section>

                        <div className="h-px bg-white/5" />

                        {/* Section: Branding */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Feinabstimmung</h2>
                                    <p className="text-xs text-zinc-500">Farben und Branding anpassen.</p>
                                </div>
                            </div>
                            <ColorsEditor
                                draft={draft!}
                                onChange={handleDraftChange}
                            />
                            <div className="pt-4">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Logos & Icons</p>
                                <ImagesEditor
                                    draft={draft!}
                                    onChange={handleDraftChange}
                                />
                            </div>
                        </section>

                        <div className="h-px bg-white/5" />

                        {/* Section: Content */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <LayoutTemplate className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Inhalt & Felder</h2>
                                    <p className="text-xs text-zinc-500">Was steht auf der Karte?</p>
                                </div>
                            </div>
                            <FieldsEditor
                                draft={draft!}
                                onChange={handleDraftChange}
                            />
                        </section>

                        <div className="h-px bg-white/5" />

                        {/* Section: Locations */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Standorte</h2>
                                    <p className="text-xs text-zinc-500">Geofencing & Lockscreen.</p>
                                </div>
                            </div>
                            <LocationsEditor
                                locations={locations}
                                onChange={handleLocationsChange}
                            />
                        </section>

                    </div>
                </div>

                {/* Right Panel: Preview (Sticky Stage) */}
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-dot-white/[0.1]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                    <div className="relative z-10 scale-[0.85] xl:scale-100 transition-all duration-500">
                        <div className="mb-6 flex justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs text-zinc-400">
                                <Smartphone className="w-3 h-3" />
                                <span>Live Vorschau (Apple Wallet)</span>
                            </div>
                        </div>
                        <PassPreview draft={draft!} />
                    </div>
                </div>

            </div>
        </div>
    )
}
