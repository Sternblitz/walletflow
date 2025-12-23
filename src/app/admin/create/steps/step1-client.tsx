import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues
const LocationPicker = dynamic(
    () => import('@/components/ui/location-picker').then(mod => mod.LocationPicker),
    {
        ssr: false,
        loading: () => <div className="h-64 bg-zinc-900 rounded-xl animate-pulse" />
    }
)

export function Step1Client({ data, update }: any) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Who is this for?</h2>
                <p className="text-muted-foreground">Define the client identity.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Client Business Name</Label>
                    <Input
                        value={data.clientName}
                        onChange={(e) => update({ clientName: e.target.value })}
                        placeholder="e.g. Burger King Berlin"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Unique Slug (passify.io/...)</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">passify.io/</span>
                        <Input
                            value={data.slug}
                            onChange={(e) => update({ slug: e.target.value })}
                            placeholder="burger-king-berlin"
                        />
                    </div>
                </div>

                {/* Geolocation Section with Interactive Map */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <Label>Standorte (für Lockscreen-Benachrichtigungen)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Der Pass erscheint auf dem Lockscreen wenn Kunden in der Nähe eines deiner Standorte sind. Bis zu 10 Standorte möglich!
                    </p>
                    <LocationPicker
                        locations={data.locations || []}
                        onChange={(locations) => update({ locations })}
                        maxLocations={10}
                    />
                </div>
            </div>
        </div>
    )
}


