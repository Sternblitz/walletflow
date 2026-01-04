'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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
    LayoutTemplate,
    Sparkles,
    Smartphone,
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
    const [locations, setLocations] = useState<Location[]>([])

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [pushing, setPushing] = useState(false)
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)

    useEffect(() => {
        params.then(p => setCampaignId(p.id))
    }, [params])

    useEffect(() => {
        if (!campaignId) return

        const fetchCampaign = async () => {
            try {
                const res = await fetch(`/api/campaign/${campaignId}`)
                const data = await res.json()

                if (data.campaign) {
                    setCampaign(data.campaign)
                    if (data.campaign.design_assets) {
                        setDraft(data.campaign.design_assets)
                    }
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

    const handleDraftChange = useCallback((newDraft: WalletPassDraft) => {
        setDraft(newDraft)
        setSaveResult(null)
    }, [])

    const handleLocationsChange = useCallback((newLocations: Location[]) => {
        setLocations(newLocations)
        setSaveResult(null)
    }, [])

    const handleColorChange = useCallback((newColors: WalletPassDraft['colors']) => {
        if (!draft) return
        handleDraftChange({
            ...draft,
            colors: newColors
        })
    }, [draft, handleDraftChange])

    const handleSave = async () => {
        if (!campaignId || !draft) return
        setSaving(true)
        try {
            const res = await fetch(`/api/campaign/${campaignId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    design_assets: draft,
                    config: {
                        ...campaign?.config,
                        locations: locations,
                        stampEmoji: draft.stampConfig?.icon || '☕',
                        maxStamps: draft.stampConfig?.total || 10
                    }
                })
            })
            const result = await res.json()
            if (result.success) {
                setSaveResult({ success: true, message: 'Design gespeichert!' })
                setTimeout(() => setSaveResult(null), 3000)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveAndPush = async () => {
        if (!campaignId || !draft) return
        setPushing(true)
        try {
            const saveRes = await fetch(`/api/campaign/${campaignId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    design_assets: draft,
                    config: {
                        ...campaign?.config,
                        locations: locations,
                        stampEmoji: draft.stampConfig?.icon || '☕',
                        maxStamps: draft.stampConfig?.total || 10
                    }
                })
            })

            if (!saveRes.ok) return

            const pushRes = await fetch(`/api/campaign/${campaignId}/push-update`, {
                method: 'POST'
            })
            const pushResult = await pushRes.json()

            if (pushResult.success) {
                toast.success(`Gespeichert & an ${pushResult.count} Kunden gesendet!`)
                // Redirect to dashboard to show link and passes
                router.push(`/admin/campaign/${campaignId}`)
            } else {
                toast.error("Push Fehler: " + (pushResult.error || 'Unbekannt'))
            }
        } catch (error) {
            console.error(error)
            toast.error("Fehler beim Starten der Kampagne")
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
        <div className="flex flex-col h-full bg-black/95 items-center justify-center p-4">

            {/* CENTRAL WORKSPACE ISLAND */}
            <div className="w-full max-w-[1700px] h-[calc(100vh-3rem)] bg-zinc-950 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">

                {/* 1. Command Bar */}
                <div className="h-18 shrink-0 border-b border-white/5 bg-zinc-900/60 backdrop-blur-xl flex items-center justify-between px-8 z-50">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/admin"
                            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                            title="Zurück"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <div className="h-8 w-px bg-white/10" />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Draft Mode</span>
                                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Unsaved Changes
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{campaign?.name || 'Neuer Entwurf'}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 rounded-full"
                            onClick={() => router.push('/admin')}
                        >
                            Verwerfen
                        </Button>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <Button
                            variant="ghost"
                            size="lg"
                            disabled={saving}
                            onClick={handleSave}
                            className="text-zinc-400 hover:text-white rounded-full px-6"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Speichern
                        </Button>
                        <Button
                            size="lg"
                            disabled={pushing || !draft}
                            onClick={handleSaveAndPush}
                            className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-full px-8 font-medium"
                        >
                            {pushing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Kampagne Starten
                        </Button>
                    </div>
                </div>

                {/* 2. Workspace (Split Screen) */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Panel: Settings */}
                    <div className="w-[500px] border-r border-white/5 bg-zinc-900/30 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="p-6 md:p-8 space-y-12 pb-32">

                            {/* Themes */}
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

                            {/* Branding */}
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

                            {/* Content */}
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

                            {/* Locations */}
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

                    {/* Right Panel: Preview */}
                    <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
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
        </div>
    )
}
