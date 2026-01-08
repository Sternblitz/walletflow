'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Send, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface PushRequest {
    id: string
    message: string
    status: 'pending' | 'approved' | 'rejected' | 'sent' | 'failed'
    created_at: string
    scheduled_at: string | null
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
            if (res.ok) {
                toast.success('Nachricht genehmigt und gesendet!')
                fetchRequests() // Refresh
            } else {
                toast.error('Fehler beim Genehmigen')
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

    // Filter into groups
    const pendingRequests = requests.filter(r => r.status === 'pending')
    const historyRequests = requests.filter(r => r.status !== 'pending')

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex items-center gap-4">
                    <Link href="/admin" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Push Requests</h1>
                        <p className="text-zinc-400">Genehmige oder lehne Nachrichten von Kunden ab.</p>
                    </div>
                </header>

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
                                    <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-bold uppercase">
                                                    {req.campaign?.client?.name || 'Unknown'}
                                                </span>
                                                <span className="text-zinc-500 text-xs">
                                                    {new Date(req.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-lg font-medium text-white p-4 bg-black/30 rounded-xl border border-white/5">
                                                "{req.message}"
                                            </p>
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
                                                onClick={() => handleApprove(req.id)}
                                                disabled={!!processingId}
                                                className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {processingId === req.id ? (
                                                    <span className="animate-spin text-xl">⟳</span>
                                                ) : (
                                                    <Check size={18} />
                                                )}
                                                Genehmigen & Senden
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

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
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {historyRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-white/5">
                                        <td className="p-4 whitespace-nowrap">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-white">
                                            {req.campaign?.client?.name}
                                        </td>
                                        <td className="p-4 max-w-xs truncate" title={req.message}>
                                            {req.message}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                                                    req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-zinc-700 text-zinc-400'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {historyRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-zinc-600">
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
            </div>
        </div>
    )
}
