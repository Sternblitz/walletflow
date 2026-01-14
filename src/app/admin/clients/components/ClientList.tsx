import { useState } from "react"
import { Search, Building2, ChevronRight, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteClient } from "../actions"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Client {
    id: string
    name: string
    slug: string
    campaigns: { id: string; is_active: boolean }[]
}

interface ClientListProps {
    clients: Client[]
    selectedClientId: string | null
    onSelectClient: (id: string) => void
    loading?: boolean
    onRefresh?: () => void
}

export function ClientList({ clients, selectedClientId, onSelectClient, loading, onRefresh }: ClientListProps) {
    const [query, setQuery] = useState("")
    const [clientToDelete, setClientToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.slug.toLowerCase().includes(query.toLowerCase())
    )

    const handleDelete = async () => {
        if (!clientToDelete) return

        setIsDeleting(true)
        try {
            const result = await deleteClient(clientToDelete)
            if (result.success) {
                toast.success("Kunde erfolgreich gelöscht")
                if (selectedClientId === clientToDelete) {
                    onSelectClient("") // Deselect if deleted
                }
                onRefresh?.()
            } else {
                toast.error("Fehler beim Löschen")
            }
        } catch (error) {
            toast.error("Ein unerwarteter Fehler ist aufgetreten")
        } finally {
            setIsDeleting(false)
            setClientToDelete(null)
        }
    }

    return (
        <div className="flex flex-col h-full bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white">Kunden</h2>
                    <span className="text-xs bg-white/10 text-zinc-400 px-2 py-0.5 rounded-full">{clients.length}</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Suchen..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="pl-9 bg-zinc-950/50 border-white/5 focus-visible:ring-indigo-500/50 h-9"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-zinc-500 text-sm animate-pulse">Lade Kunden...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-zinc-500 text-sm mb-4">Keine Kunden gefunden.</p>
                        <Link href="/admin/create">
                            <Button size="sm" variant="outline" className="border-white/10">
                                <Plus className="w-4 h-4 mr-2" /> Neu anlegen
                            </Button>
                        </Link>
                    </div>
                ) : (
                    filtered.map(client => {
                        const isSelected = selectedClientId === client.id
                        const isActive = client.campaigns.some(c => c.is_active)

                        return (
                            <div
                                key={client.id}
                                className={`
                                    group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border relative pr-10
                                    ${isSelected
                                        ? 'bg-indigo-600/10 border-indigo-500/30'
                                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                                    }
                                `}
                                onClick={() => onSelectClient(client.id)}
                            >
                                <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center border transition-colors
                                    ${isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                        : 'bg-zinc-800 text-zinc-400 border-white/5 group-hover:bg-zinc-700 group-hover:text-white'
                                    }
                                `}>
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className={`font-medium truncate text-sm ${isSelected ? 'text-indigo-100' : 'text-zinc-200 group-hover:text-white'}`}>
                                            {client.name}
                                        </h3>
                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                                    </div>
                                    <p className={`text-xs truncate ${isSelected ? 'text-indigo-300' : 'text-zinc-500'}`}>
                                        @{client.slug}
                                    </p>
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setClientToDelete(client.id)
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    {!isSelected && <ChevronRight className="w-4 h-4 text-zinc-600" />}
                                </div>

                                {isSelected && <ChevronRight className="w-4 h-4 text-indigo-400 absolute right-3 group-hover:opacity-0 transition-opacity" />}
                            </div>
                        )
                    })
                )}
            </div>

            <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <AlertDialogContent className="bg-zinc-950 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Kunden wirklich löschen?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten, Kampagnen und verknüpften Wallets dieses Kunden werden unwiderruflich gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-900 border-white/10 text-white hover:bg-zinc-800 hover:text-white">Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isDeleting ? 'Lösche...' : 'Endgültig löschen'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
