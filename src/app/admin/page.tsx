import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dein Cockpit</h1>
                    <p className="text-zinc-400">Verwalte deine Kampagnen und Pässe.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/editor">
                        <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
                            ✨ Neuer Editor
                        </Button>
                    </Link>
                    <Link href="/admin/create">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-5 w-5" />
                            Kampagne starten
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Empty State / List Placeholder */}
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-white/10 mb-4">
                        <Plus className="h-10 w-10 text-zinc-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Bereit für den Start?</h3>
                    <p className="mb-4 mt-2 text-sm text-zinc-400">
                        Erstelle deine erste Wallet-Kampagne für einen Kunden.
                    </p>
                    <Link href="/admin/create">
                        <Button variant="secondary">Jetzt erste Kampagne erstellen</Button>
                    </Link>
                </div>
            </div>

        </div>
    )
}
