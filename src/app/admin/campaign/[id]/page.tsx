"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
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
    Save
} from "lucide-react"

interface PosCredential {
    id?: string
    role: 'staff' | 'chef'
    label: string
    pin_code: string
}

interface Pass {
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
}

interface Campaign {
    id: string
    name: string
    concept: string
    is_active: boolean
    created_at: string
    client: {
        name: string
        slug: string
    }
    passes: Pass[]
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null)
    const [campaignId, setCampaignId] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // POS Credentials State
    const [posCredentials, setPosCredentials] = useState<PosCredential[]>([])
    const [loadingCredentials, setLoadingCredentials] = useState(false)
    const [showPins, setShowPins] = useState<Record<string, boolean>>({})
    const [savingPins, setSavingPins] = useState(false)

    useEffect(() => {
        params.then(p => setCampaignId(p.id))
    }, [params])

    useEffect(() => {
        if (campaignId) {
            fetchCampaign()
            fetchPosCredentials()
        }
    }, [campaignId])

    const fetchPosCredentials = async () => {
        if (!campaignId) return
        setLoadingCredentials(true)
        try {
            const res = await fetch(`/api/campaign/${campaignId}/pos-credentials`)
            const data = await res.json()
            if (data.credentials) {
                // Ensure we have at least defaults if empty (though api doesn't create them on get, migration does)
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

    const savePosCredentials = async () => {
        if (!campaignId) return
        setSavingPins(true)
        try {
            const res = await fetch(`/api/campaign/${campaignId}/pos-credentials`, {
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

        setSending(true)
        setSendResult(null)

        try {
            const response = await fetch(`/api/campaign/${campaignId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.trim() })
            })

            const result = await response.json()
            setSendResult({ sent: result.sent || 0, total: result.total || 0 })
            setMessage("")

            // Refresh campaign data
            fetchCampaign()
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
                // Redirect to admin page
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
            <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <p className="text-zinc-400">Kampagne nicht gefunden.</p>
                <Link href="/admin">
                    <Button variant="outline" className="mt-4">Zurück</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{campaign.client?.name || campaign.name}</h1>
                        <p className="text-sm text-zinc-400">
                            {campaign.passes?.length || 0} Kunden • Erstellt am {new Date(campaign.created_at).toLocaleDateString('de-DE')}
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md mx-4 space-y-4">
                        <h3 className="text-xl font-bold text-red-400">⚠️ Kampagne löschen?</h3>
                        <p className="text-zinc-300">
                            Bist du sicher, dass du <strong>"{campaign.client?.name || campaign.name}"</strong> dauerhaft löschen möchtest?
                        </p>
                        <p className="text-sm text-zinc-500">
                            Dies löscht auch alle {campaign.passes?.length || 0} Kundenkarten. Diese Aktion kann nicht rückgängig gemacht werden.
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
            )}

            {/* Distribution Card & Message Card Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Dein Kampagnen-Link</h2>
                            <p className="text-xs text-zinc-400">Teile diesen Link oder QR-Code mit deinen Kunden</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-black/50 border border-white/5 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-zinc-900 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 font-mono truncate">
                                https://qard.io/start/{campaign.client?.slug}
                            </div>
                            <Button
                                size="icon"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://qard.io/start/${campaign.client?.slug}`)
                                    alert('Link kopiert!')
                                }}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Link href={`/start/${campaign.client?.slug}`} target="_blank">
                                <Button size="icon" variant="outline" className="shrink-0">
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="flex justify-center pt-2">
                            <div className="p-2 bg-white rounded-xl">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://qard.io/start/${campaign.client?.slug}`}
                                    alt="QR Code"
                                    className="w-32 h-32"
                                />
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Link href={`/admin/campaign/${campaignId}/marketing`}>
                                <Button variant="secondary" size="sm" className="w-full">
                                    <Printer className="w-3 h-3 mr-2" />
                                    Aufsteller & Flyer drucken
                                </Button>
                            </Link>
                        </div>

                        <p className="text-center text-xs text-zinc-500">
                            Scan mich, um den Pass zu installieren
                        </p>
                    </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Nachricht an alle Kunden</h2>
                            <p className="text-xs text-white/60">Schicke eine Push-Benachrichtigung an alle {campaign.passes?.length || 0} Kunden</p>
                        </div>
                    </div>

                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="🎉 Heute 2x Stempel auf alle Getränke!"
                        className="bg-black/30 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                    />

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-white/40">
                            {message.length} / 100 Zeichen empfohlen
                        </div>
                        <Button
                            onClick={sendMessage}
                            disabled={!message.trim() || sending}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                        >
                            {sending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Jetzt senden
                        </Button>
                    </div>

                    {sendResult && (
                        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-lg px-4 py-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Nachricht an {sendResult.total} {sendResult.total === 1 ? 'Kunden' : 'Kunden'} gesendet!
                        </div>
                    )}
                </div>
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
                    {/* Link to POS */}
                    {campaign.client?.slug && (
                        <Link href={`/pos/${campaign.client.slug}`} target="_blank">
                            <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Scanner öffnen
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Access Data */}
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

                    {/* Info Section */}
                    <div className="text-sm text-zinc-400 space-y-4 bg-zinc-900 rounded-xl p-4 border border-white/5">
                        <h4 className="font-medium text-white">So funktioniert's:</h4>
                        <ul className="space-y-2 list-disc list-inside">
                            <li><strong className="text-emerald-400">Mitarbeiter (Staff)</strong>: Können nur Scannen und Punkte vergeben.</li>
                            <li><strong className="text-purple-400">Chef</strong>: Hat Zugriff auf das Dashboard und kann Push-Nachrichten beantragen.</li>
                            <li>Der QR-Code für den Scanner ist derselbe, nur der PIN entscheidet über die Rechte.</li>
                            <li>PINs können jederzeit geändert werden.</li>
                        </ul>
                    </div>
                </div>
            </div>


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

                {campaign.passes?.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                        <p className="text-zinc-400">Noch keine Kunden. Teile deinen Link!</p>
                        <p className="text-sm text-violet-400 mt-2">
                            qard.io/{campaign.client?.slug}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr className="text-left text-xs text-zinc-400">
                                    <th className="px-4 py-3 font-medium">Kunde</th>
                                    <th className="px-4 py-3 font-medium">Kontakt</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Letzte Aktivität</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {campaign.passes?.map((pass) => (
                                    <tr key={pass.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {/* Platform Icon */}
                                                {(pass.wallet_type === 'google' || (pass.is_installed_on_android && !pass.is_installed_on_ios)) ? (
                                                    <span title="Google Wallet" className="text-lg">🤖</span>
                                                ) : (
                                                    <span title="Apple Wallet" className="text-lg">🍎</span>
                                                )}
                                                <div>
                                                    <span className="font-medium text-white block">
                                                        {pass.customer_name || `Kunde #${pass.current_state?.customer_number || pass.serial_number.slice(0, 6)}`}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        #{pass.current_state?.customer_number || pass.serial_number.slice(0, 8)}
                                                    </span>
                                                </div>
                                                {/* Verification Badge */}
                                                {(pass.verification_status === 'verified' || pass.is_installed_on_ios || pass.is_installed_on_android) ? (
                                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        ✓
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        ?
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1 text-xs text-zinc-400">
                                                {pass.customer_email && (
                                                    <div className="flex items-center gap-1.5">
                                                        📧 {pass.customer_email}
                                                    </div>
                                                )}
                                                {pass.customer_phone && (
                                                    <div className="flex items-center gap-1.5">
                                                        📱 {pass.customer_phone}
                                                    </div>
                                                )}
                                                {pass.customer_birthday && (
                                                    <div className="flex items-center gap-1.5">
                                                        🎂 {new Date(pass.customer_birthday).toLocaleDateString('de-DE')}
                                                    </div>
                                                )}
                                                {!pass.customer_email && !pass.customer_phone && !pass.customer_birthday && (
                                                    <span className="text-zinc-500">–</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {campaign.concept.includes('STAMP') ? (
                                                <div className="flex items-center gap-2">
                                                    <Stamp className="w-4 h-4 text-violet-400" />
                                                    <span className="text-sm">
                                                        {pass.current_state?.stamps || 0} / {pass.current_state?.max_stamps || 10}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-zinc-400">
                                                    {pass.current_state?.points || 0} Punkte
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(pass.last_updated_at).toLocaleDateString('de-DE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div >
    )
}
