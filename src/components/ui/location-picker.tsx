'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Plus, Trash2 } from 'lucide-react'

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import('react-leaflet').then(mod => mod.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(
    () => import('react-leaflet').then(mod => mod.TileLayer),
    { ssr: false }
)
const Marker = dynamic(
    () => import('react-leaflet').then(mod => mod.Marker),
    { ssr: false }
)
const Popup = dynamic(
    () => import('react-leaflet').then(mod => mod.Popup),
    { ssr: false }
)

export interface Location {
    id: string
    lat: number
    lng: number
    message: string
    address?: string
}

interface LocationPickerProps {
    locations: Location[]
    onChange: (locations: Location[]) => void
    maxLocations?: number
}

// Click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    const { useMapEvents } = require('react-leaflet')
    useMapEvents({
        click: (e: any) => {
            onMapClick(e.latlng.lat, e.latlng.lng)
        }
    })
    return null
}

export function LocationPicker({ locations, onChange, maxLocations = 10 }: LocationPickerProps) {
    const [isClient, setIsClient] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [tempMessage, setTempMessage] = useState('')

    useEffect(() => {
        setIsClient(true)
        // Import Leaflet CSS dynamically
        if (typeof window !== 'undefined') {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }
    }, [])

    // Search for address
    const handleSearch = async () => {
        if (!searchQuery.trim() || locations.length >= maxLocations) return

        setSearching(true)
        try {
            const encoded = encodeURIComponent(searchQuery)
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
                { headers: { 'User-Agent': 'Passify/1.0' } }
            )
            const data = await res.json()

            if (data && data.length > 0) {
                const result = data[0]
                addLocation(
                    parseFloat(result.lat),
                    parseFloat(result.lon),
                    result.display_name
                )
                setSearchQuery('')
            }
        } catch (e) {
            console.error('Search failed:', e)
        }
        setSearching(false)
    }

    const addLocation = (lat: number, lng: number, address?: string) => {
        if (locations.length >= maxLocations) return

        const newLocation: Location = {
            id: `loc-${Date.now()}`,
            lat,
            lng,
            message: 'Du bist in der Nähe! 🎉',
            address
        }
        onChange([...locations, newLocation])
    }

    const removeLocation = (id: string) => {
        onChange(locations.filter(l => l.id !== id))
    }

    const updateMessage = (id: string, message: string) => {
        onChange(locations.map(l => l.id === id ? { ...l, message } : l))
    }

    const handleMapClick = (lat: number, lng: number) => {
        if (locations.length >= maxLocations) return
        addLocation(lat, lng)
    }

    if (!isClient) {
        return (
            <div className="h-64 bg-zinc-900 rounded-xl flex items-center justify-center">
                <span className="text-zinc-500">Karte wird geladen...</span>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Adresse suchen..."
                    className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500"
                    disabled={locations.length >= maxLocations}
                />
                <button
                    onClick={handleSearch}
                    disabled={searching || locations.length >= maxLocations}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                    {searching ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Plus size={18} />
                    )}
                    Hinzufügen
                </button>
            </div>

            {/* Map */}
            <div className="h-64 rounded-xl overflow-hidden border border-zinc-700">
                <MapContainer
                    center={locations[0] ? [locations[0].lat, locations[0].lng] : [52.52, 13.405]}
                    zoom={locations.length > 0 ? 12 : 6}
                    style={{ height: '100%', width: '100%' }}
                    // @ts-ignore
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        // @ts-ignore
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onMapClick={handleMapClick} />
                    {locations.map((loc) => (
                        <Marker
                            key={loc.id}
                            // @ts-ignore
                            position={[loc.lat, loc.lng]}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{loc.message}</p>
                                    {loc.address && <p className="text-xs text-gray-500 mt-1">{loc.address}</p>}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Hint */}
            <p className="text-xs text-zinc-500 flex items-center gap-1">
                <MapPin size={12} />
                Klicke auf die Karte oder suche eine Adresse. Max. {maxLocations} Standorte ({locations.length}/{maxLocations})
            </p>

            {/* Location List */}
            {locations.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-400">Standorte ({locations.length})</h4>
                    {locations.map((loc, idx) => (
                        <div
                            key={loc.id}
                            className="flex items-start gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg"
                        >
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                {editingId === loc.id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={tempMessage}
                                            onChange={(e) => setTempMessage(e.target.value)}
                                            className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-white"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                updateMessage(loc.id, tempMessage)
                                                setEditingId(null)
                                            }}
                                            className="px-2 py-1 bg-green-600 rounded text-xs"
                                        >
                                            ✓
                                        </button>
                                    </div>
                                ) : (
                                    <p
                                        className="text-sm text-white cursor-pointer hover:text-green-400"
                                        onClick={() => {
                                            setEditingId(loc.id)
                                            setTempMessage(loc.message)
                                        }}
                                    >
                                        💬 {loc.message}
                                    </p>
                                )}
                                <p className="text-xs text-zinc-500 truncate mt-1">
                                    {loc.address || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`}
                                </p>
                            </div>
                            <button
                                onClick={() => removeLocation(loc.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
