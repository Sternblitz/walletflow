'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WalletPassDraft } from '@/lib/wallet/types'
import { PassPreview } from '@/components/wallet/pass-preview'
import { ColorsEditor } from '@/components/wallet/colors-editor'
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
    AlertCircle
} from 'lucide-react'

type EditorTab = 'colors' | 'fields' | 'images'

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
    const [activeTab, setActiveTab] = useState<EditorTab>('colors')
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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const pushResult = await pushRes.json()

            setSaveResult({
                success: true,
                message: `Design gespeichert! Push an ${pushResult.sent || 0} Geräte gesendet.`
            })
        } catch (error) {
            setSaveResult({ success: false, message: 'Netzwerkfehler' })
        } finally {
            setPushing(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    if (!campaign || !draft) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <p className="text-zinc-400">Kampagne nicht gefunden.</p>
                <Link href="/admin">
                    <Button variant="outline" className="mt-4">Zurück</Button>
                </Link>
            </div>
        )
    }

    const tabs: { id: EditorTab; label: string; icon: typeof Palette }[] = [
        { id: 'colors', label: 'Farben', icon: Palette },
        { id: 'fields', label: 'Inhalte', icon: Type },
        { id: 'images', label: 'Bilder', icon: ImageIcon }
    ]

    const passCount = campaign.passes?.length || 0

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/admin/campaign/${campaignId}`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{campaign.client?.name || campaign.name}</h1>
                        <p className="text-sm text-zinc-400">Design bearbeiten • {passCount} aktive Karten</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={saving || pushing}
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Nur Speichern
                    </Button>
                    <Button
                        onClick={handleSaveAndPush}
                        disabled={saving || pushing}
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                    >
                        {pushing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Speichern & Pushen
                    </Button>
                </div>
            </div>

            {/* Result Message */}
            {saveResult && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${saveResult.success
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                    {saveResult.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {saveResult.message}
                </div>
            )}

            {/* Editor Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Preview */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex items-start justify-center">
                    <PassPreview draft={draft} scale={0.85} />
                </div>

                {/* Right: Editor */}
                <div className="space-y-4">
                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${isActive
                                            ? 'bg-zinc-800 text-white'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 max-h-[600px] overflow-y-auto">
                        {activeTab === 'colors' && (
                            <ColorsEditor draft={draft} onChange={handleDraftChange} />
                        )}
                        {activeTab === 'fields' && (
                            <FieldsEditor draft={draft} onChange={handleDraftChange} />
                        )}
                        {activeTab === 'images' && (
                            <ImagesEditor draft={draft} onChange={handleDraftChange} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
