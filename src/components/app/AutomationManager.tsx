'use client'

import { useState, useEffect } from 'react'
import { Clock, Send, Plus, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface PushRequest {
    id: string
    message: string
    scheduled_at: string | null
    status: 'pending' | 'approved' | 'rejected' | 'sent' | 'failed'
    created_at: string
    rejection_reason?: string
}

interface AutomationManagerProps {
    slug: string
}

export function AutomationManager({ slug }: AutomationManagerProps) {
    const [requests, setRequests] = useState<PushRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newMessage, setNewMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (slug) fetchRequests()
    }, [slug])

    const fetchRequests = async () => {
        try {
            const res = await fetch(`/api/app/push-request?slug=${slug}`)
            if (res.ok) {
                const data = await res.json()
                setRequests(data.requests || [])
            }
        } catch (e) {
            console.error('Failed to fetch requests:', e)
        } finally {
            setLoading(false)
        }
    }

    const createRequest = async () => {
        if (!newMessage.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/app/push-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    message: newMessage,
                    scheduledAt: null // Immediate for now
                })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success('Anfrage gesendet!')
                setNewMessage('')
                setIsCreating(false)
                fetchRequests() // Refresh list
            } else {
                toast.error(data.error || 'Fehler beim Senden')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md border border-amber-500/20 flex items-center gap-1"><Clock size={12} /> Warten auf Genehmigung</span>
            case 'approved':
                return <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 size={12} /> Genehmigt</span>
            case 'sent':
                return <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md border border-blue-500/20 flex items-center gap-1"><Send size={12} /> Gesendet</span>
            case 'rejected':
                return <span className="text-xs font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded-md border border-red-500/20 flex items-center gap-1"><XCircle size={12} /> Abgelehnt</span>
            default:
                return <span className="text-xs font-bold bg-zinc-700 text-zinc-400 px-2 py-1 rounded-md">{status}</span>
        }
    }

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-400" />
                        Push-Nachrichten
                    </h3>
                    <p className="text-xs text-zinc-400">Updates an alle Kunden senden</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <AnimatePresence>
                        {requests.map(req => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-mono">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </span>
                                        {getStatusBadge(req.status)}
                                    </div>
                                    <p className="text-sm text-zinc-200">{req.message}</p>

                                    {req.rejection_reason && (
                                        <div className="mt-2 text-xs bg-red-500/5 text-red-400 p-2 rounded-lg border border-red-500/10 flex gap-2">
                                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                            <span>Grund: {req.rejection_reason}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {requests.length === 0 && (
                            <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-white/10 rounded-2xl">
                                Keine Nachrichten bisher
                            </div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Creation Modal */}
            {isCreating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-3xl">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-900 border border-white/10 w-full max-w-sm p-6 rounded-3xl space-y-4 shadow-2xl"
                    >
                        <h4 className="font-bold text-lg">Neue Nachricht beantragen</h4>
                        <p className="text-xs text-zinc-400">
                            Deine Nachricht wird zur Überprüfung eingereicht. Nach Genehmigung wird sie an alle Kunden gesendet.
                        </p>

                        <div>
                            <textarea
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Deine Nachricht hier..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none h-32 resize-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium text-zinc-400 hover:text-white"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={createRequest}
                                disabled={submitting || !newMessage.trim()}
                                className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Beantragen'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
