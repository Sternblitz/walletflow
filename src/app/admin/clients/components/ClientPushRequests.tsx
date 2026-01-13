"use client"

import { Send, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ClientPushRequestsProps {
    clientId: string | null
    clientName?: string
}

// Mock Data
const MOCK_PUSHES = [
    { id: '1', title: 'Willkommens-Nachricht', message: 'Willkommen im Club! Hier ist dein erster Stempel.', status: 'SENT', date: 'Vor 2 Tagen', stats: { sent: 124, opened: 89 } },
    { id: '2', title: 'Happy Hour Alarm', message: 'Nur heute: Doppelte Punkte ab 18 Uhr!', status: 'SENT', date: 'Vor 5 Tagen', stats: { sent: 120, opened: 45 } },
    { id: '3', title: 'Monats-Update', message: 'Deine Statistik für Oktober ist da.', status: 'FAILED', date: 'Vor 1 Woche', stats: { sent: 124, opened: 0 } },
]

export function ClientPushRequests({ clientId, clientName }: ClientPushRequestsProps) {
    if (!clientId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-900/30 border border-white/5 rounded-3xl border-dashed">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                    <Send className="w-6 h-6" />
                </div>
                <h3 className="text-zinc-400 font-medium">Kein Kunde ausgewählt</h3>
                <p className="text-zinc-600 text-sm mt-1">Wähle einen Kunden aus, um Push Requests zu sehen.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-white">Push Historie</h2>
                    <p className="text-xs text-zinc-500">Für {clientName}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Send className="w-4 h-4 text-zinc-400" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {MOCK_PUSHES.map(push => (
                    <div key={push.id} className="bg-zinc-900/80 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-white text-sm">{push.title}</h3>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${push.status === 'SENT' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {push.status}
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{push.message}</p>

                        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-white/5 pt-3">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Send className="w-3 h-3" /> {push.stats.sent}
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> {push.stats.opened}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {push.date}
                            </div>
                        </div>
                    </div>
                ))}

                <Button variant="outline" className="w-full border-dashed border-white/10 text-zinc-400 hover:text-white hover:bg-white/5">
                    Neuen Push erstellen
                </Button>
            </div>
        </div>
    )
}
