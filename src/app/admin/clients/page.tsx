import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Plus, Search, Building2, Calendar } from "lucide-react"
import Link from "next/link"
import { ClientActions } from "@/components/admin/ClientActions"

export const dynamic = 'force-dynamic'

async function getClients() {
    const supabase = await createClient()

    // Fetch clients with campaign count
    const { data: clients, error } = await supabase
        .from('clients')
        .select(`
            *,
            campaigns(count)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clients:', error)
        return []
    }

    return clients
}

export default async function ClientsPage() {
    const clients = await getClients()

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-8 pt-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Clients</h1>
                    <p className="text-zinc-400">Verwalte deine Kunden und deren Kampagnen.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Suche..."
                            className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-white/20 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/30 overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-white/5">
                            <TableHead className="text-zinc-400">Name</TableHead>
                            <TableHead className="text-zinc-400">Slug</TableHead>
                            <TableHead className="text-zinc-400">Kampagnen</TableHead>
                            <TableHead className="text-zinc-400">Erstellt am</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                                    Keine Clients gefunden.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="font-medium text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5">
                                                <Building2 className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                                            </div>
                                            {client.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-zinc-400 font-mono text-xs">{client.slug}</TableCell>
                                    <TableCell>
                                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs font-medium text-zinc-300">
                                            {client.campaigns?.[0]?.count || 0} Kampagnen
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(client.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <ClientActions
                                            clientId={client.id}
                                            clientName={client.name}
                                            slug={client.slug}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
