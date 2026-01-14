'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Send, AlertTriangle, ArrowLeft, Calendar, Users, PlayCircle, Edit2, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface PushRequest {
    id: string
    message: string
    edited_message: string | null
    edited_at: string | null
    status: 'pending' | 'approved' | 'scheduled' | 'processing' | 'rejected' | 'sent' | 'failed'
    created_at: string
    scheduled_at: string | null
    sent_at: string | null
    recipients_count: number
    success_count: number
    failure_count: number
    last_error: string | null
    campaign: {
        name: string
        client: {
            name: string
        }
    }
}

export default function PushRequestsPage() {
    const [requests, setRequests] = useState<PushRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')

    // Edit Modal State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editMessage, setEditMessage] = useState('')
    const [originalMessage, setOriginalMessage] = useState('')

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/push-requests')
            if (res.ok) {
                const data = await res.json()
                setRequests(data.requests || [])
            }
        } catch (e) {
            console.error('Failed to fetch:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: string) => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/admin/push-requests/${id}/approve`, {
                method: 'POST'
            })
            const data = await res.json()
            if (res.ok) {
                if (data.scheduled) {
                    toast.success('Nachricht genehmigt und für später eingeplant!')
                } else {
                    toast.success(`Nachricht an ${data.sent || 0} Kunden gesendet!`)
                }
                fetchRequests()
            } else {
                toast.error('Fehler beim Genehmigen')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        } finally {
            setProcessingId(null)
        }
    }

    const handleSendNow = async (id: string) => {
        setProcessingId(id)
        try {
            const res = await fetch(`/api/admin/push-requests/${id}/send-now`, {
                method: 'POST'
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(`Nachricht an ${data.sent || 0} Kunden gesendet!`)
                fetchRequests()
            } else {
                toast.error('Fehler beim Senden')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async () => {
        if (!rejectingId) return
        setProcessingId(rejectingId)

        try {
            const res = await fetch(`/api/admin/push-requests/${rejectingId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason })
            })

            if (res.ok) {
                toast.success('Anfrage abgelehnt')
                setRejectingId(null)
                setRejectionReason('')
                fetchRequests()
            } else {
                toast.error('Fehler beim Ablehnen')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        } finally {
            setProcessingId(null)
        }
    }

    // Open edit modal
    const openEditModal = (req: PushRequest) => {
        setEditingId(req.id)
        setOriginalMessage(req.message)
        setEditMessage(req.edited_message || req.message)
    }

    // Save edit and optionally approve
    const handleSaveEdit = async (approve: boolean = false) => {
        if (!editingId) return
        setProcessingId(editingId)

        try {
            // Save edit
            const editRes = await fetch(`/api/admin/push-requests/${editingId}/edit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: editMessage })
            })

            if (!editRes.ok) {
                toast.error('Fehler beim Speichern')
                return
            }

            // Approve if requested
            if (approve) {
                const approveRes = await fetch(`/api/admin/push-requests/${editingId}/approve`, {
                    method: 'POST'
                })
                const data = await approveRes.json()

                if (approveRes.ok) {
                    if (data.scheduled) {
                        toast.success('Bearbeitet und für später eingeplant!')
                    } else {
                        toast.success(`Bearbeitet und an ${data.sent || 0} Kunden gesendet!`)
                    }
                } else {
                    toast.error('Genehmigung fehlgeschlagen')
                }
            } else {
                toast.success('Änderungen gespeichert')
            }

            setEditingId(null)
            setEditMessage('')
            setOriginalMessage('')
            fetchRequests()
        } catch (e) {
            toast.error('Netzwerkfehler')
        } finally {
            setProcessingId(null)
        }
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('de-DE')
    }

    // Filter into groups
    const pendingRequests = requests.filter(r => r.status === 'pending')
    const scheduledRequests = requests.filter(r => r.status === 'scheduled' || (r.status === 'approved' && r.scheduled_at && new Date(r.scheduled_at) > new Date()))
    const historyRequests = requests.filter(r => ['sent', 'rejected', 'failed'].includes(r.status))

    const getStatusBadge = (req: PushRequest) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            sent: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Gesendet' },
            rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Abgelehnt' },
            failed: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Fehlgeschlagen' },
            scheduled: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Geplant' },
            approved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Genehmigt' },
            pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Wartend' }
        }
        const config = statusConfig[req.status] || statusConfig.pending
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Push Requests</h1>
                <p className="text-zinc-400 text-sm mt-1">Genehmige oder lehne Nachrichten von Kunden ab.</p>
            </div>

            {/* Pending Section */}
            <section className="mb-12">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-amber-500" />
                    Warten auf Genehmigung ({pendingRequests.length})
                </h2>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-zinc-500">Lade...</div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
                            Keine ausstehenden Anfragen
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-bold uppercase">
                                                    {req.campaign?.client?.name || 'Unknown'}
                                                </span>
                                                <span className="text-zinc-500 text-xs">
                                                    {formatDateTime(req.created_at)}
                                                </span>
                                                {req.scheduled_at && (
                                                    <span className="bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        Geplant für {formatDateTime(req.scheduled_at)}
                                                    </span>
                                                )}
                                                {req.edited_at && (
                                                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                        <Edit2 size={12} />
                                                        Bearbeitet
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-lg font-medium text-white p-4 bg-black/30 rounded-xl border border-white/5">
                                                "{req.edited_message || req.message}"
                                            </p>
                                            {req.edited_message && req.edited_message !== req.message && (
                                                <p className="text-xs text-zinc-500 mt-2 line-through">
                                                    Original: "{req.message}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setRejectingId(req.id)}
                                                disabled={!!processingId}
                                                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl font-medium hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                Ablehnen
                                            </button>
                                            <button
                                                onClick={() => openEditModal(req)}
                                                disabled={!!processingId}
                                                className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl font-medium hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Edit2 size={16} />
                                                Bearbeiten
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                disabled={!!processingId}
                                                className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {processingId === req.id ? (
                                                    <span className="animate-spin text-xl">⟳</span>
                                                ) : (
                                                    <Check size={18} />
                                                )}
                                                {req.scheduled_at ? 'Genehmigen' : 'Genehmigen & Senden'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Scheduled Section */}
            {scheduledRequests.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Calendar className="text-violet-500" />
                        Geplant ({scheduledRequests.length})
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        {scheduledRequests.map(req => (
                            <div key={req.id} className="bg-zinc-900 border border-violet-500/20 rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-bold uppercase">
                                                {req.campaign?.client?.name || 'Unknown'}
                                            </span>
                                            {req.scheduled_at && (
                                                <span className="bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {formatDateTime(req.scheduled_at)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-lg font-medium text-white p-4 bg-black/30 rounded-xl border border-white/5">
                                            "{req.message}"
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleSendNow(req.id)}
                                        disabled={!!processingId}
                                        className="px-6 py-2 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors shadow-lg shadow-violet-900/20 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === req.id ? (
                                            <span className="animate-spin text-xl">⟳</span>
                                        ) : (
                                            <PlayCircle size={18} />
                                        )}
                                        Jetzt senden
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* History Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-zinc-500">Verlauf</h2>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-white/5 text-zinc-300 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Datum</th>
                                <th className="p-4">Kunde</th>
                                <th className="p-4">Nachricht</th>
                                <th className="p-4">Empfänger</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {historyRequests.map(req => (
                                <tr key={req.id} className="hover:bg-white/5">
                                    <td className="p-4 whitespace-nowrap">
                                        {formatDate(req.sent_at || req.created_at)}
                                    </td>
                                    <td className="p-4 font-medium text-white">
                                        {req.campaign?.client?.name}
                                    </td>
                                    <td className="p-4 max-w-xs truncate" title={req.message}>
                                        {req.message}
                                    </td>
                                    <td className="p-4">
                                        {req.status === 'sent' && req.recipients_count > 0 ? (
                                            <span className="flex items-center gap-1 text-emerald-400">
                                                <Users size={14} />
                                                {req.success_count}/{req.recipients_count}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(req)}
                                    </td>
                                </tr>
                            ))}
                            {historyRequests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-600">
                                        Keine Einträge im Verlauf
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Rejection Modal */}
            {rejectingId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4">
                        <h3 className="text-lg font-bold">Ablehnungsgrund</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Warum wird diese Nachricht abgelehnt?"
                            className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white min-h-[100px]"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRejectingId(null)}
                                className="flex-1 py-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 font-medium"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 py-3 bg-red-600 rounded-xl hover:bg-red-500 font-bold text-white"
                            >
                                Ablehnen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Edit2 className="text-blue-400" size={20} />
                            </div>
                            <h3 className="text-lg font-bold">Nachricht bearbeiten</h3>
                        </div>

                        {/* Original Message (readonly) */}
                        {originalMessage !== editMessage && (
                            <div className="space-y-2">
                                <label className="text-xs text-zinc-500 uppercase font-bold">Original</label>
                                <p className="text-sm text-zinc-400 p-3 bg-black/30 rounded-lg border border-white/5 line-through">
                                    {originalMessage}
                                </p>
                            </div>
                        )}

                        {/* Editable Message */}
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase font-bold">Bearbeitete Nachricht</label>
                            <textarea
                                value={editMessage}
                                onChange={e => setEditMessage(e.target.value)}
                                placeholder="Nachricht eingeben..."
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-4 text-white min-h-[120px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                autoFocus
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setEditingId(null)
                                    setEditMessage('')
                                    setOriginalMessage('')
                                }}
                                disabled={!!processingId}
                                className="flex-1 py-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 font-medium disabled:opacity-50"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={() => handleSaveEdit(false)}
                                disabled={!!processingId || !editMessage.trim()}
                                className="py-3 px-6 bg-blue-600 rounded-xl hover:bg-blue-500 font-medium text-white disabled:opacity-50 flex items-center gap-2"
                            >
                                {processingId === editingId ? (
                                    <span className="animate-spin">⟳</span>
                                ) : (
                                    <Save size={16} />
                                )}
                                Speichern
                            </button>
                            <button
                                onClick={() => handleSaveEdit(true)}
                                disabled={!!processingId || !editMessage.trim()}
                                className="py-3 px-6 bg-emerald-600 rounded-xl hover:bg-emerald-500 font-bold text-white disabled:opacity-50 flex items-center gap-2"
                            >
                                {processingId === editingId ? (
                                    <span className="animate-spin">⟳</span>
                                ) : (
                                    <Check size={16} />
                                )}
                                Speichern & Senden
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

