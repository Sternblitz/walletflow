"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { getPOSURL } from "@/lib/domain-urls"
import { DynamicRouteManager } from "@/components/admin/DynamicRouteManager"
import {
    ArrowLeft,
    Users,
    Send,
    Loader2,
    CheckCircle2,
    Clock,
    Stamp,
    MessageSquare,
    RefreshCw,
    Trash2,
    Copy,
    ExternalLink,
    QrCode,
    Printer,
    Smartphone,
    Shield,
    Eye,
    EyeOff,
    Save,
    UserMinus,
    UserCheck,
    Zap,
    ChevronDown,
    ChevronUp,
    History,
    Check,
    X,
    Calendar
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getReviewStats, ReviewStats } from "@/lib/reviews"
import { ReviewWidget } from "@/components/analytics/ReviewWidget"
import { AdminCustomerList } from "@/components/admin/AdminCustomerList"
import { CustomerDetailModal } from "@/components/app/CustomerDetailModal"
import { AnimatePresence } from "framer-motion"


export interface PosCredential {
    id?: string
    role: 'staff' | 'chef'
    label: string
    pin_code: string
}

export interface Pass {
    id: string
    serial_number: string
    current_state: {
        stamps?: number
        max_stamps?: number
        customer_number?: string
        points?: number
    }
    created_at: string
    last_updated_at: string
    wallet_type?: 'apple' | 'google'
    is_installed_on_ios?: boolean
    is_installed_on_android?: boolean
    verification_status?: 'pending' | 'verified'
    // Personalization fields
    customer_name?: string | null
    customer_birthday?: string | null
    customer_email?: string | null
    customer_phone?: string | null
    // Deletion tracking (Apple Wallet only)
    deleted_at?: string | null
    consent_marketing?: boolean
}

export interface Campaign {
    id: string
    name: string
    concept: string
    is_active: boolean
    created_at: string
    client: {
        id: string
        name: string
        slug: string
    }
    passes: Pass[]
    config?: {
        scanCooldown?: number
        [key: string]: any
    }
}

export interface AutomationRule {
    id: string
    name: string
    rule_type: 'birthday' | 'weekday_schedule' | 'inactivity' | 'custom'
    config: Record<string, any>
    message_template: string
    is_enabled: boolean
    created_at: string
    updated_at: string
}

export interface AutomationExecution {
    id: string
    rule_id: string
    pass_id: string
    executed_at: string
    status: 'sent' | 'failed' | 'skipped'
    sent_message?: string
}

export interface PushRequest {
    id: string
    message: string
    status: 'pending' | 'scheduled' | 'approved' | 'rejected' | 'sent' | 'failed'
    created_at: string
    scheduled_at: string | null
    sent_at: string | null
    recipients_count: number
    success_count: number
}

const RULE_TYPE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
    birthday: { icon: '🎂', label: 'Geburtstag', color: 'text-pink-400' },
    weekday_schedule: { icon: '📅', label: 'Wochentag', color: 'text-blue-400' },
    inactivity: { icon: '👋', label: 'Inaktivität', color: 'text-amber-400' },
    custom: { icon: '⚡', label: 'Benutzerdefiniert', color: 'text-purple-400' },
}

interface CampaignDashboardProps {
    campaignId: string | null
    showBackButton?: boolean
}

export function CampaignDashboard({ campaignId, showBackButton = true }: CampaignDashboardProps) {
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

    // POS Credentials State
    const [posCredentials, setPosCredentials] = useState<PosCredential[]>([])
    const [loadingCredentials, setLoadingCredentials] = useState(false)
    const [showPins, setShowPins] = useState<Record<string, boolean>>({})
    const [savingPins, setSavingPins] = useState(false)

    // Automation State
    const [automations, setAutomations] = useState<AutomationRule[]>([])
    const [loadingAutomations, setLoadingAutomations] = useState(false)
    const [expandedAutomation, setExpandedAutomation] = useState<string | null>(null)

    // Push History State
    const [pushHistory, setPushHistory] = useState<PushRequest[]>([])
    const [loadingPushHistory, setLoadingPushHistory] = useState(false)
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)

    // Enhanced Push State (like POS)
    const [pushMode, setPushMode] = useState<'now' | 'schedule'>('now')
    const [scheduleTime, setScheduleTime] = useState('')
    const [pushTarget, setPushTarget] = useState<'all' | 'inactive'>('all')
    const [inactivityDays, setInactivityDays] = useState<14 | 30 | 60 | 'custom'>(14)
    const [customInactivityDays, setCustomInactivityDays] = useState(30)
    // Redeem Flow
    const [redeemFlowEnabled, setRedeemFlowEnabled] = useState(false)
    const [redeemExpiresHours, setRedeemExpiresHours] = useState<number | null>(null)

    useEffect(() => {
        if (campaignId) {
            fetchCampaign()
            fetchPosCredentials()
            fetchAutomations()
            fetchPushHistory()
            fetchReviews()
        } else {
            setLoading(false)
        }
    }, [campaignId])

    const fetchPosCredentials = async () => {
        if (!campaignId) return
        setLoadingCredentials(true)
        try {
            const res = await fetch(`/api/campaign/${campaignId}/app-credentials`)
            const data = await res.json()
            if (data.credentials) {
                let creds = data.credentials
                if (creds.length === 0) {
                    creds = [
                        { role: 'staff', label: 'Mitarbeiter', pin_code: '1234' },
                        { role: 'chef', label: 'Chef', pin_code: '9999' }
                    ]
                }
                setPosCredentials(creds)
            }
        } catch (e) {
            console.error('Failed to fetch credentials:', e)
        } finally {
            setLoadingCredentials(false)
        }
    }

    const fetchAutomations = async () => {
        if (!campaignId) return
        setLoadingAutomations(true)
        try {
            const res = await fetch(`/api/automations?campaignId=${campaignId}`)
            const data = await res.json()
            if (data.rules) {
                setAutomations(data.rules)
            }
        } catch (e) {
            console.error('Failed to fetch automations:', e)
        } finally {
            setLoadingAutomations(false)
        }
    }

    const fetchPushHistory = async () => {
        if (!campaignId) return
        setLoadingPushHistory(true)
        try {
            const res = await fetch(`/api/admin/push-requests?campaignId=${campaignId}`)
            const data = await res.json()
            if (data.requests) {
                setPushHistory(data.requests.slice(0, 5)) // Last 5
            }
        } catch (e) {
            console.error('Failed to fetch push history:', e)
        } finally {
            setLoadingPushHistory(false)
        }
    }

    const fetchReviews = async () => {
        if (!campaignId) return
        try {
            const supabase = createClient()
            const stats = await getReviewStats(supabase, campaignId)
            setReviewStats(stats)
        } catch (e) {
            console.error('Failed to fetch review stats:', e)
        }
    }

    const toggleAutomation = async (rule: AutomationRule) => {
        try {
            const res = await fetch('/api/automations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: rule.id, isEnabled: !rule.is_enabled })
            })
            if (res.ok) {
                setAutomations(prev => prev.map(r =>
                    r.id === rule.id ? { ...r, is_enabled: !r.is_enabled } : r
                ))
            }
        } catch (e) {
            console.error('Failed to toggle automation:', e)
        }
    }

    const savePosCredentials = async () => {
        if (!campaignId) return
        setSavingPins(true)
        try {
            const res = await fetch(`/api/campaign/${campaignId}/app-credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credentials: posCredentials })
            })
            if (res.ok) {
                alert('PIN-Codes gespeichert!')
                fetchPosCredentials()
            } else {
                alert('Fehler beim Speichern')
            }
        } catch (e) {
            console.error('Failed to save credentials:', e)
            alert('Fehler beim Speichern')
        } finally {
            setSavingPins(false)
        }
    }

    const updateCredential = (index: number, field: keyof PosCredential, value: string) => {
        const newCreds = [...posCredentials]
        newCreds[index] = { ...newCreds[index], [field]: value }
        setPosCredentials(newCreds)
    }

    const fetchCampaign = async () => {
        if (!campaignId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/campaign/${campaignId}`)
            const data = await response.json()
            if (data.campaign) {
                setCampaign(data.campaign)
            }
        } catch (error) {
            console.error('Error fetching campaign:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async () => {
        if (!message.trim() || !campaignId) return
        if (pushMode === 'schedule' && !scheduleTime) return

        setSending(true)
        setSendResult(null)

        try {
            const inactiveDaysValue = pushTarget === 'inactive'
                ? (inactivityDays === 'custom' ? customInactivityDays : inactivityDays)
                : null

            const response = await fetch(`/api/campaign/${campaignId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message.trim(),
                    scheduleTime: pushMode === 'schedule' ? new Date(scheduleTime).toISOString() : null,
                    targetType: pushTarget,
                    inactiveDays: inactiveDaysValue,
                    // Redeem Flow
                    redeemFlowEnabled,
                    redeemExpiresHours: redeemFlowEnabled ? redeemExpiresHours : null
                })
            })

            const result = await response.json()
            setSendResult({ sent: result.sent || 0, total: result.total || 0 })
            setMessage("")
            setScheduleTime("")
            setPushMode('now')
            setPushTarget('all')
            setRedeemFlowEnabled(false)
            setRedeemExpiresHours(null)

            fetchCampaign()
            fetchPushHistory()
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    const handleDelete = async () => {
        if (!campaignId) return

        setDeleting(true)
        try {
            const response = await fetch(`/api/campaign/${campaignId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                window.location.href = '/admin'
            } else {
                alert('Fehler beim Löschen der Kampagne')
            }
        } catch (error) {
            console.error('Error deleting campaign:', error)
            alert('Fehler beim Löschen der Kampagne')
        } finally {
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p>Keine Kampagne ausgewählt oder gefunden.</p>
            </div>
        )
    }

    const activePasses = campaign.passes?.filter(p => !p.deleted_at).length || 0;
    const deletedPasses = campaign.passes?.filter(p => p.deleted_at).length || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBackButton && (
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{campaign.client?.name || campaign.name}</h1>
                        <p className="text-sm text-zinc-400">
                            Erstellt am {new Date(campaign.created_at).toLocaleDateString('de-DE')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/admin/campaign/${campaignId}/edit`}>
                        <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
                            ✏️ Design bearbeiten
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{campaign.passes?.length || 0}</p>
                            <p className="text-xs text-zinc-400">Gesamt Kunden</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-400">{activePasses}</p>
                            <p className="text-xs text-zinc-400">Aktive Karten</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                            <UserMinus className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-400">{deletedPasses}</p>
                            <p className="text-xs text-zinc-400">Gelöscht</p>
                        </div>
                    </div>
                </div>
                {reviewStats && (
                    <ReviewWidget stats={reviewStats} />
                )}
            </div>



            {/* Distribution Card & Message Card Grid */}
            <div className="grid lg:grid-cols-2 gap-4">
                {/* Dynamic QR Code Manager */}
                {campaign.client?.id && campaign.client?.slug && (
                    <DynamicRouteManager
                        clientId={campaign.client.id}
                        clientSlug={campaign.client.slug}
                        campaignId={campaignId || undefined}
                    />
                )}

                <div className="rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Push-Nachricht senden</h2>
                            <p className="text-xs text-white/60">Direkt senden oder planen • {campaign.passes?.length || 0} Kunden</p>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setPushMode('now')}
                            className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${pushMode === 'now' ? 'bg-emerald-500 text-white' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'}`}
                        >
                            <Zap className="w-4 h-4" /> Jetzt senden
                        </button>
                        <button
                            onClick={() => setPushMode('schedule')}
                            className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${pushMode === 'schedule' ? 'bg-blue-500 text-white' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'}`}
                        >
                            <Calendar className="w-4 h-4" /> Später planen
                        </button>
                    </div>

                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="🎉 Heute 2x Stempel auf alle Getränke!"
                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                    />

                    {/* Target Audience */}
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3 h-3" /> Zielgruppe
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPushTarget('all')}
                                className={`p-2 rounded-lg text-sm font-medium transition-all ${pushTarget === 'all' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                            >
                                Alle Kunden
                            </button>
                            <button
                                onClick={() => setPushTarget('inactive')}
                                className={`p-2 rounded-lg text-sm font-medium transition-all ${pushTarget === 'inactive' ? 'bg-orange-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                            >
                                Inaktive Kunden
                            </button>
                        </div>

                        {pushTarget === 'inactive' && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="text-xs text-zinc-500">Letzter Scan vor:</div>
                                <div className="flex flex-wrap gap-2">
                                    {([14, 30, 60, 'custom'] as const).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setInactivityDays(opt)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inactivityDays === opt ? 'bg-orange-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                        >
                                            {opt === 'custom' ? '✏️ Eigene' : `${opt} Tage`}
                                        </button>
                                    ))}
                                </div>
                                {inactivityDays === 'custom' && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={365}
                                            value={customInactivityDays}
                                            onChange={(e) => setCustomInactivityDays(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-20 bg-black/30 border-white/10 text-white text-sm"
                                        />
                                        <span className="text-xs text-zinc-500">Tage</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* REDEEM FLOW TOGGLE */}
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎁</span>
                                <span className="text-sm font-bold text-white">Redeem Flow aktiv</span>
                            </div>
                            <button
                                onClick={() => setRedeemFlowEnabled(!redeemFlowEnabled)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${redeemFlowEnabled ? 'bg-pink-500' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow transition-transform ${redeemFlowEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">
                            Erstellt ein einlösbares Geschenk, das beim Scannen angezeigt wird.
                        </p>

                        {redeemFlowEnabled && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="text-xs font-bold text-zinc-400">Gültigkeit</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 24, label: '24h' },
                                        { value: 72, label: '3 Tage' },
                                        { value: 168, label: '7 Tage' },
                                        { value: 336, label: '14 Tage' },
                                        { value: 720, label: '30 Tage' },
                                        { value: null, label: '∞ Ewig' }
                                    ].map(opt => (
                                        <button
                                            key={String(opt.value)}
                                            onClick={() => setRedeemExpiresHours(opt.value)}
                                            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${redeemExpiresHours === opt.value
                                                ? 'bg-pink-500 text-white'
                                                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Schedule Time */}
                    {pushMode === 'schedule' && (
                        <Input
                            type="datetime-local"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="bg-black/30 border-white/10 text-white"
                        />
                    )}

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-white/40">
                            {message.length} / 100 Zeichen empfohlen
                        </div>
                        <Button
                            onClick={sendMessage}
                            disabled={!message.trim() || sending || (pushMode === 'schedule' && !scheduleTime)}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                        >
                            {sending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : pushMode === 'schedule' ? (
                                <Calendar className="w-4 h-4 mr-2" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            {pushMode === 'schedule' ? 'Einplanen' : 'Jetzt senden'}
                        </Button>
                    </div>

                    {sendResult && (
                        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-lg px-4 py-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {pushMode === 'schedule' ? 'Nachricht eingeplant!' : `Nachricht an ${sendResult.total} Kunden gesendet!`}
                        </div>
                    )}
                </div>
            </div>

            {/* Push History Section */}
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Push Verlauf</h2>
                            <p className="text-xs text-zinc-400">Letzte Push-Nachrichten dieser Kampagne</p>
                        </div>
                    </div>
                    <Link href="/admin/push-requests">
                        <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                            <Send className="w-4 h-4 mr-2" />
                            Alle anzeigen
                        </Button>
                    </Link>
                </div>

                {loadingPushHistory ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                ) : pushHistory.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                        <Send className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm text-zinc-400">Noch keine Push-Nachrichten gesendet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pushHistory.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">"{req.message}"</p>
                                    <p className="text-xs text-zinc-500">
                                        {new Date(req.sent_at || req.created_at).toLocaleDateString('de-DE')}
                                        {req.status === 'sent' && req.recipients_count > 0 && (
                                            <span className="ml-2 text-emerald-400">• {req.success_count}/{req.recipients_count} Empfänger</span>
                                        )}
                                    </p>
                                </div>
                                <span className={`ml-3 px-2 py-1 text-xs font-medium rounded ${req.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                                    req.status === 'scheduled' ? 'bg-violet-500/20 text-violet-400' :
                                        req.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                            req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                'bg-zinc-700 text-zinc-400'
                                    }`}>
                                    {req.status === 'sent' ? 'Gesendet' :
                                        req.status === 'scheduled' ? 'Geplant' :
                                            req.status === 'pending' ? 'Wartend' :
                                                req.status === 'rejected' ? 'Abgelehnt' : req.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* POS System Section */}
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">POS Scanner System</h2>
                            <p className="text-xs text-zinc-400">Zugang für Mitarbeiter und Chef verwalten</p>
                        </div>
                    </div>
                    {campaign.client?.slug && (
                        <Link href={getPOSURL(campaign.client.slug)} target="_blank">
                            <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Scanner öffnen
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Zugangsdaten
                        </h3>

                        {loadingCredentials ? (
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        ) : (
                            <div className="space-y-4">
                                {posCredentials.map((cred, index) => (
                                    <div key={index} className="flex gap-4 items-end bg-black/20 p-4 rounded-xl border border-white/5">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider">{cred.role === 'chef' ? '👑 Chef-Zugang' : '👤 Mitarbeiter-Zugang'}</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={cred.label}
                                                    onChange={(e) => updateCredential(index, 'label', e.target.value)}
                                                    className="bg-black/50 border-white/10 text-white h-10 text-sm"
                                                    placeholder="Bezeichnung"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-32 space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider">PIN</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPins[index] ? "text" : "password"}
                                                    value={cred.pin_code}
                                                    maxLength={6}
                                                    onChange={(e) => updateCredential(index, 'pin_code', e.target.value.replace(/\D/g, ''))}
                                                    className="bg-black/50 border-white/10 text-white font-mono text-center h-10 tracking-widest"
                                                />
                                                <button
                                                    onClick={() => setShowPins(prev => ({ ...prev, [index]: !prev[index] }))}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                                >
                                                    {showPins[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    onClick={savePosCredentials}
                                    disabled={savingPins}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    {savingPins ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    PIN-Codes speichern
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-zinc-400 space-y-4 bg-zinc-900 rounded-xl p-4 border border-white/5">
                        <h4 className="font-medium text-white">So funktioniert's:</h4>
                        <ul className="space-y-2 list-disc list-inside">
                            <li><strong className="text-emerald-400">Mitarbeiter (Staff)</strong>: Können nur Scannen und Punkte vergeben.</li>
                            <li><strong className="text-purple-400">Chef</strong>: Hat Zugriff auf das Dashboard und kann Push-Nachrichten beantragen.</li>
                            <li>Der QR-Code für den Scanner ist derselbe, nur der PIN entscheidet über die Rechte.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Automations Section */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Automatisierungen</h2>
                            <p className="text-xs text-zinc-400">Automatische Push-Nachrichten</p>
                        </div>
                    </div>
                    <Link href={`/admin/automations?campaignId=${campaignId}`}>
                        <Button variant="outline" size="sm" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                            <Zap className="w-4 h-4 mr-2" />
                            Alle verwalten
                        </Button>
                    </Link>
                </div>

                {loadingAutomations ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                    </div>
                ) : automations.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                        <Zap className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                        <p className="text-zinc-400 text-sm">Noch keine Automatisierungen eingerichtet</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {automations.map(rule => {
                            const typeInfo = RULE_TYPE_LABELS[rule.rule_type] || RULE_TYPE_LABELS.custom
                            const isExpanded = expandedAutomation === rule.id

                            return (
                                <div
                                    key={rule.id}
                                    className={`rounded-xl border transition-all ${rule.is_enabled
                                        ? 'bg-zinc-900/50 border-white/10'
                                        : 'bg-zinc-900/30 border-white/5 opacity-60'
                                        }`}
                                >
                                    <div
                                        className="p-4 flex items-center gap-3 cursor-pointer"
                                        onClick={() => setExpandedAutomation(isExpanded ? null : rule.id)}
                                    >
                                        <span className="text-2xl">{typeInfo.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white truncate">{rule.name}</span>
                                                <span className={`text-xs ${typeInfo.color}`}>{typeInfo.label}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 truncate">{rule.message_template}</p>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleAutomation(rule) }}
                                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${rule.is_enabled ? 'bg-green-500' : 'bg-zinc-700'
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.is_enabled ? 'left-7' : 'left-1'
                                                }`} />
                                        </button>

                                        {isExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                                    </div>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                                            <div className="bg-black/30 rounded-lg p-3">
                                                <p className="text-xs text-zinc-500 mb-1">Konfiguration</p>
                                                <pre className="text-xs text-zinc-300 overflow-auto">
                                                    {JSON.stringify(rule.config, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Scan Settings Section */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white">Scan Einstellungen</h2>
                        <p className="text-xs text-zinc-400">Sicherheits- und Cooldown-Einstellungen</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-white">Scan Cooldown</h3>
                                <p className="text-xs text-zinc-400 mt-1">Verhindert doppeltes Scannen innerhalb kurzer Zeit.</p>
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-xs text-zinc-300 font-mono">
                                {campaign.config?.scanCooldown ? `${campaign.config.scanCooldown} Min` : 'Inaktiv'}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Cooldown Dauer</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Deaktiviert', value: 0 },
                                    { label: '1 Std', value: 60 },
                                    { label: '6 Std', value: 360 },
                                    { label: '12 Std', value: 720 },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={async () => {
                                            if (!campaignId) return;
                                            // Optimistic update
                                            setCampaign(prev => prev ? { ...prev, config: { ...prev.config, scanCooldown: opt.value } } : null);

                                            // API Call to save
                                            try {
                                                const res = await fetch(`/api/campaign/${campaignId}/update`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        config: { ...campaign.config, scanCooldown: opt.value }
                                                    })
                                                });
                                                if (!res.ok) alert('Fehler beim Speichern');
                                            } catch (e) { console.error(e); }
                                        }}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${(campaign.config?.scanCooldown || 0) === opt.value
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Input */}
                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                <span className="text-xs text-zinc-500">Oder manuell:</span>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Minuten"
                                        value={campaign.config?.scanCooldown || ''}
                                        onChange={async (e) => {
                                            if (!campaignId) return;
                                            const val = parseInt(e.target.value) || 0;
                                            // Optimistic
                                            setCampaign(prev => prev ? { ...prev, config: { ...prev.config, scanCooldown: val } } : null);
                                        }}
                                        onBlur={async (e) => {
                                            // Save on blur
                                            if (!campaignId) return;
                                            const val = parseInt(e.target.value) || 0;
                                            try {
                                                await fetch(`/api/campaign/${campaignId}/update`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        config: { ...campaign.config, scanCooldown: val }
                                                    })
                                                });
                                            } catch (e) { console.error(e); }
                                        }}
                                        className="w-24 h-8 bg-black/30 border-white/10 text-xs"
                                    />
                                    <span className="text-xs text-zinc-500">Minuten</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-200/80 leading-relaxed">
                            <strong className="text-yellow-400 block mb-1">Achtung:</strong>
                            Während des Cooldowns können Kunden keine Punkte sammeln. Der Chef kann den Cooldown mit seinem PIN überspringen.
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md mx-4 space-y-4">
                            <h3 className="text-xl font-bold text-red-400">⚠️ Kampagne löschen?</h3>
                            <p className="text-zinc-300">
                                Bist du sicher, dass du <strong>"{campaign.client?.name || campaign.name}"</strong> dauerhaft löschen möchtest?
                            </p>
                            <p className="text-sm text-zinc-500">
                                Dies löscht auch alle Kundenkarten. Diese Aktion kann nicht rückgängig gemacht werden.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                >
                                    Abbrechen
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 mr-2" />
                                    )}
                                    Endgültig löschen
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Customer List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-zinc-400" />
                        Kunden ({campaign.passes?.length || 0})
                    </h2>
                    <Button variant="ghost" size="sm" onClick={fetchCampaign}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Aktualisieren
                    </Button>
                </div>

                <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4">
                    <AdminCustomerList
                        customers={campaign.passes || []}
                        onSelectCustomer={setSelectedCustomer}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Customer Detail Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <CustomerDetailModal
                        customer={selectedCustomer}
                        slug={campaign.client?.slug || ''}
                        onClose={() => setSelectedCustomer(null)}
                    />
                )}
            </AnimatePresence>
        </div >
    )
}
