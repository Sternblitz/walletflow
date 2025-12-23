import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Bell } from "lucide-react"

export function Step4Geofence({ data, update }: any) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Location Magic 📍</h2>
                <p className="text-muted-foreground">Catch them when they walk by.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">

                {/* Address Input */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Store Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Eg. Alexanderplatz 1, 10178 Berlin"
                                value={data.address || ""}
                                onChange={(e) => update({ address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/20 rounded-lg border border-white/10 text-sm opacity-70">
                        <h4 className="font-bold mb-1">Preview:</h4>
                        <p>Latitude: 52.5200 (Auto-detected)</p>
                        <p>Longitude: 13.4050 (Auto-detected)</p>
                    </div>
                </div>

                {/* Notification Input */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Lockscreen Message</Label>
                        <div className="relative">
                            <Bell className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Hey! Grab a coffee while you're here! ☕️"
                                value={data.geofenceMessage || ""}
                                onChange={(e) => update({ geofenceMessage: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Mock Lockscreen Preview */}
                    <div className="relative h-[120px] bg-black rounded-xl overflow-hidden border border-white/10 p-4 flex flex-col justify-center items-center">
                        {/* Wallpaper Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />

                        <div className="relative z-10 w-full max-w-[250px] bg-gray-200/20 backdrop-blur-md rounded-lg p-3 text-xs text-white">
                            <div className="flex justify-between mb-1 opacity-70">
                                <span>PASSIFY</span>
                                <span>Now</span>
                            </div>
                            <p className="font-semibold">{data.geofenceMessage || "Your text here..."}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
