'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, ExternalLink } from "lucide-react"
import { getPOSURL } from "@/lib/domain-urls"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from 'sonner'

interface ClientActionsProps {
    clientId: string
    clientName: string
    slug: string
}

export function ClientActions({ clientId, clientName, slug }: ClientActionsProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/clients/${clientId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success(`${clientName} wurde gelöscht`)
                router.refresh()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Fehler beim Löschen')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        } finally {
            setDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-white">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-300">
                    <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                    <DropdownMenuItem
                        className="focus:bg-white/10 focus:text-white cursor-pointer"
                        onClick={() => window.open(getPOSURL(slug), '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        POS öffnen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                        className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Löschen
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Client löschen?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Möchtest du <strong>{clientName}</strong> wirklich löschen?
                            Alle Kampagnen und Pässe werden ebenfalls gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-white/10 text-white hover:bg-zinc-700">
                            Abbrechen
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? 'Löscht...' : 'Endgültig löschen'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
