'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Plus, Search, Building2, Calendar, Trash2, Send,
    ExternalLink, Loader2, CheckCircle2, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { ClientActions } from "@/components/admin/ClientActions"
import { toast } from 'sonner'

interface Client {
    id: string
    name: string
    slug: string
    created_at: string
    campaigns: { id: string; name: string; is_active: boolean }[]
    _passCount?: number
}

export default function KundenPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkDeleting, setBulkDeleting] = useState(false)

    // Fetch clients with campaigns
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

    // Filter clients by search
    const filteredClients = useMemo(() => {
        if (!searchQuery) return clients
        const q = searchQuery.toLowerCase()
        return clients.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q)
        )
    }, [clients, searchQuery])

    // Select all toggle
    const allSelected = filteredClients.length > 0 && filteredClients.every(c => selectedIds.has(c.id))
    const someSelected = filteredClients.some(c => selectedIds.has(c.id))

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredClients.map(c => c.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return
        if (!confirm(`${selectedIds.size} Kunden wirklich löschen? Alle Pässe werden ebenfalls gelöscht.`)) return

        setBulkDeleting(true)
        let deleted = 0
        for (const id of selectedIds) {
            try {
                const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
                if (res.ok) deleted++
            } catch (e) {
                console.error('Delete failed for', id)
            }
        }

        toast.success(`${deleted} Kunden gelöscht`)
        setSelectedIds(new Set())
        fetchClients()
        setBulkDeleting(false)
    }

    // Get campaign link for client
    const getCampaignLink = (client: Client) => {
        if (client.campaigns && client.campaigns.length > 0) {
            return `/admin/campaign/${client.campaigns[0].id}`
        }
        return null
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-8 pt-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Kunden</h1>
                    <p className="text-zinc-400">Verwalte deine Kunden und deren Wallet-Karten.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Kunde suchen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-white/20 rounded-full h-11"
                        />
                    </div>
                    <Link href="/admin/create">
                        <Button className="bg-white text-black hover:bg-zinc-200 h-11 px-6 rounded-full font-medium">
                            <Plus className="mr-2 h-4 w-4" /> Neuer Kunde
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">{selectedIds.size} ausgewählt</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                            className="border-white/10 text-zinc-400 hover:text-white"
                        >
                            Auswahl aufheben
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={bulkDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {bulkDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Löschen
                        </Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/30 overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-white/5">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={toggleSelectAll}
                                    className="border-zinc-600 data-[state=checked]:bg-white data-[state=checked]:border-white"
                                />
                            </TableHead>
                            <TableHead className="text-zinc-400">Kunde</TableHead>
                            <TableHead className="text-zinc-400">Slug</TableHead>
                            <TableHead className="text-zinc-400">Status</TableHead>
                            <TableHead className="text-zinc-400">Erstellt</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                                </TableCell>
                            </TableRow>
                        ) : filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                                    {searchQuery ? 'Keine Kunden gefunden.' : 'Noch keine Kunden vorhanden.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => {
                                const campaignLink = getCampaignLink(client)
                                const isActive = client.campaigns?.[0]?.is_active ?? false

                                return (
                                    <TableRow
                                        key={client.id}
                                        className="border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => campaignLink && window.location.assign(campaignLink)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.has(client.id)}
                                                onCheckedChange={() => toggleSelect(client.id)}
                                                className="border-zinc-600 data-[state=checked]:bg-white data-[state=checked]:border-white"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10 shadow-lg">
                                                    <Building2 className="w-5 h-5 text-zinc-300" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold group-hover:text-green-400 transition-colors">{client.name}</div>
                                                    <div className="text-xs text-zinc-500">{client.campaigns?.length || 0} Karte(n)</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-zinc-400 font-mono text-xs">{client.slug}</TableCell>
                                        <TableCell>
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : 'bg-zinc-800 text-zinc-400 border border-white/5'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-zinc-600'}`} />
                                                {isActive ? 'Aktiv' : 'Inaktiv'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 text-sm">
                                            {new Date(client.created_at).toLocaleDateString('de-DE')}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <ClientActions
                                                clientId={client.id}
                                                clientName={client.name}
                                                slug={client.slug}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary */}
            {!loading && clients.length > 0 && (
                <div className="text-sm text-zinc-500 text-center">
                    {filteredClients.length} von {clients.length} Kunden
                </div>
            )}
        </div>
    )
}
