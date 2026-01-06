import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Building2, Link as LinkIcon } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues
const LocationPicker = dynamic(
    () => import('@/components/ui/location-picker').then(mod => mod.LocationPicker),
    {
        ssr: false,
        loading: () => <div className="h-64 bg-zinc-900/50 border border-white/10 rounded-xl animate-pulse" />
    }
)

export function Step1Client({ data, update }: any) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Wer ist der Kunde?</h2>
                <p className="text-zinc-400">Grundlegende Informationen für die Kampagne.</p>
            </div>

            <div className="space-y-6">
                {/* Visual Grouping: Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest group-focus-within:text-white transition-colors">Business Name</Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <Input
                                value={data.clientName}
                                onChange={(e) => update({ clientName: e.target.value })}
                                placeholder="z.B. Burger King Berlin"
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 focus-visible:ring-1 focus-visible:ring-white/20 transition-all h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest group-focus-within:text-white transition-colors">URL Slug</Label>
                        <div className="relative flex items-center">
                            <div className="absolute left-3 top-3 z-10">
                                <LinkIcon className="h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <span className="absolute left-9 text-sm text-zinc-500 font-mono">qard.io/</span>
                            <Input
                                value={data.slug}
                                onChange={(e) => update({ slug: e.target.value })}
                                placeholder="my-business"
                                className="pl-[6.5rem] bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 focus-visible:ring-1 focus-visible:ring-white/20 transition-all font-mono text-sm h-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Geolocation Section with Premium Map Container */}
                <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <Label className="text-base font-medium text-white block">Standorte</Label>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Lock-Screen Nachricht wenn Kunden in der Nähe sind.
                            </p>
                        </div>
                    </div>

                    <div className="bg-black/20 rounded-xl border border-white/5 p-1 backdrop-blur-sm">
                        <LocationPicker
                            locations={data.locations || []}
                            onChange={(locations: any) => update({ locations })}
                            maxLocations={10}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}


