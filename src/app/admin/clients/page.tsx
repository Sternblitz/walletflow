'use client'

import { useState, useEffect } from 'react'
import { ClientList } from "./components/ClientList"
import { CampaignDashboard } from "@/components/admin/CampaignDashboard"
import { Users } from "lucide-react"

interface Client {
    id: string
    name: string
    slug: string
    created_at: string
    campaigns: { id: string; name: string; is_active: boolean }[]
}

export default function KundenPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/admin/clients')
            if (res.ok) {
                const data = await res.json()
                setClients(data.clients || [])
            }
        } catch (e) {
            console.error('Failed to fetch clients:', e)
        } finally {
            setLoading(false)
        }
    }

    const selectedClient = clients.find(c => c.id === selectedClientId)
    const selectedCampaignId = selectedClient?.campaigns?.[0]?.id || null

    return (
        <div className="h-full max-w-[1800px] mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Column 1: Client List (3 cols) */}
                <div className="lg:col-span-3 h-full min-w-[300px]">
                    <ClientList
                        clients={clients}
                        selectedClientId={selectedClientId}
                        onSelectClient={setSelectedClientId}
                        loading={loading}
                        onRefresh={fetchClients}
                    />
                </div>

                {/* Column 2: Campaign Dashboard (9 cols) - Master Detail View */}
                <div className="lg:col-span-9 h-full overflow-y-auto custom-scrollbar bg-zinc-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                    {selectedClientId ? (
                        selectedCampaignId ? (
                            <CampaignDashboard campaignId={selectedCampaignId} showBackButton={false} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                <Users className="w-12 h-12 mb-4 opacity-20" />
                                <p>Dieser Kunde hat keine aktive Kampagne.</p>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-white/5 opacity-50">
                                <Users className="w-8 h-8 opacity-40" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">Wähle einen Kunden aus</h3>
                            <p className="max-w-md text-center text-zinc-400">
                                Klicke auf einen Kunden in der Liste links, um das vollständige Dashboard mit Statistiken, Push-Verlauf und Automatisierungen zu sehen.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
