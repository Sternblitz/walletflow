'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react'

export interface Location {
    id: string
    latitude: number
    longitude: number
    relevantText: string
    address?: string
}

interface LocationPickerProps {
    locations: Location[]
    onChange: (locations: Location[]) => void
    maxLocations?: number
}

// Load Google Maps script
function loadGoogleMaps(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Window not available'))
            return
        }

        if ((window as any).google?.maps) {
            resolve()
            return
        }

        const existingScript = document.getElementById('google-maps-script')
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve())
            return
        }

        const script = document.createElement('script')
        script.id = 'google-maps-script'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Google Maps'))
        document.head.appendChild(script)
    })
}

export function LocationPicker({ locations, onChange, maxLocations = 10 }: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const markersRef = useRef<google.maps.Marker[]>([])
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [tempMessage, setTempMessage] = useState('')

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Initialize Google Maps
    useEffect(() => {
        if (!apiKey) {
            setError('Google Maps API Key fehlt')
            return
        }

        loadGoogleMaps(apiKey)
            .then(() => setIsLoaded(true))
            .catch((err) => setError(err.message))
    }, [apiKey])

    // Initialize map when loaded
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

        const defaultCenter = locations.length > 0
            ? { lat: locations[0].latitude, lng: locations[0].longitude }
            : { lat: 52.52, lng: 13.405 } // Berlin default

        const map = new google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: locations.length > 0 ? 12 : 6,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
                { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
            ],
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
        })

        // Click handler
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (locations.length >= maxLocations) return
            if (e.latLng) {
                addLocation(e.latLng.lat(), e.latLng.lng())
            }
        })

        mapInstanceRef.current = map

        // Setup autocomplete
        if (inputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
                fields: ['formatted_address', 'geometry', 'name'],
            })

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace()
                if (place.geometry?.location) {
                    const lat = place.geometry.location.lat()
                    const lng = place.geometry.location.lng()
                    addLocation(lat, lng, place.formatted_address || place.name)
                    if (inputRef.current) inputRef.current.value = ''
                    map.setCenter({ lat, lng })
                    map.setZoom(15)
                }
            })

            autocompleteRef.current = autocomplete
        }
    }, [isLoaded])

    // Update markers when locations change
    useEffect(() => {
        if (!mapInstanceRef.current) return

        // Clear old markers
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []

        // Add new markers
        locations.forEach((loc, idx) => {
            const marker = new google.maps.Marker({
                position: { lat: loc.latitude, lng: loc.longitude },
                map: mapInstanceRef.current!,
                label: {
                    text: String(idx + 1),
                    color: 'white',
                    fontWeight: 'bold',
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#10B981',
                    fillOpacity: 1,
                    strokeColor: '#059669',
                    strokeWeight: 2,
                },
            })

            const infoWindow = new google.maps.InfoWindow({
                content: `<div style="color: black; font-size: 14px;"><strong>${loc.relevantText}</strong>${loc.address ? `<br><span style="font-size: 12px; color: gray;">${loc.address}</span>` : ''}</div>`,
            })

            marker.addListener('click', () => {
                infoWindow.open(mapInstanceRef.current!, marker)
            })

            markersRef.current.push(marker)
        })

        // Fit bounds if multiple locations
        if (locations.length > 1) {
            const bounds = new google.maps.LatLngBounds()
            locations.forEach(loc => bounds.extend({ lat: loc.latitude, lng: loc.longitude }))
            mapInstanceRef.current.fitBounds(bounds, 50)
        }
    }, [locations, isLoaded])

    const addLocation = useCallback((lat: number, lng: number, address?: string) => {
        if (locations.length >= maxLocations) return

        const newLocation: Location = {
            id: `loc-${Date.now()}`,
            latitude: lat,
            longitude: lng,
            relevantText: 'Du bist in der Nähe! 🎉',
            address
        }
        onChange([...locations, newLocation])
    }, [locations, maxLocations, onChange])

    const removeLocation = (id: string) => {
        onChange(locations.filter(l => l.id !== id))
    }

    const updateMessage = (id: string, message: string) => {
        onChange(locations.map(l => l.id === id ? { ...l, relevantText: message } : l))
    }

    if (error) {
        return (
            <div className="h-64 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700">
                <span className="text-red-400 text-sm">{error}</span>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Adresse suchen..."
                    className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500"
                    disabled={locations.length >= maxLocations || !isLoaded}
                />
                <div className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg flex items-center gap-2 text-sm">
                    <MapPin size={16} />
                    {locations.length}/{maxLocations}
                </div>
            </div>

            {/* Map */}
            <div className="h-72 rounded-xl overflow-hidden border border-zinc-700 relative">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    </div>
                )}
                <div ref={mapRef} className="h-full w-full" />
            </div>

            {/* Hint */}
            <p className="text-xs text-zinc-500 flex items-center gap-1">
                <MapPin size={12} />
                Klicke auf die Karte oder suche eine Adresse. Kunden erhalten eine Benachrichtigung wenn sie in der Nähe sind.
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
                                            setTempMessage(loc.relevantText)
                                        }}
                                    >
                                        💬 {loc.relevantText}
                                    </p>
                                )}
                                <p className="text-xs text-zinc-500 truncate mt-1">
                                    {loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}
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
