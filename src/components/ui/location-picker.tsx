'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Plus, Trash2, Loader2, Navigation, ChevronDown } from 'lucide-react'

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

// Best converting messages for lockscreen notifications
const MESSAGE_PRESETS = [
    { emoji: '🎁', text: 'Dein Bonus wartet auf dich!', category: 'Bonus' },
    { emoji: '☕', text: 'Zeit für deinen Gratis-Stempel!', category: 'Stempel' },
    { emoji: '🔥', text: 'Heute: Doppelte Punkte sammeln!', category: 'Aktion' },
    { emoji: '👋', text: 'Schön, dass du da bist!', category: 'Willkommen' },
    { emoji: '🎉', text: 'Nur noch 1 Stempel bis zur Prämie!', category: 'Fast geschafft' },
    { emoji: '💝', text: 'Exklusiv für Stammkunden: 10% Rabatt', category: 'VIP' },
    { emoji: '⭐', text: 'Vergiss deinen Stempel nicht!', category: 'Erinnerung' },
    { emoji: '🍕', text: 'Hunger? Komm vorbei!', category: 'Food' },
]

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
    const [showPresets, setShowPresets] = useState<string | null>(null)
    const [locatingMe, setLocatingMe] = useState(false)

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
            zoom: locations.length > 0 ? 14 : 6,
            // Light theme - clean default Google Maps style
            styles: [],
            // Native controls
            gestureHandling: 'greedy', // Scroll without Ctrl, pinch zoom works
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
            },
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            scaleControl: true,
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
                    map.setZoom(16)
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
                    fontSize: '12px',
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 14,
                    fillColor: '#10B981',
                    fillOpacity: 1,
                    strokeColor: '#059669',
                    strokeWeight: 2,
                },
                animation: google.maps.Animation.DROP,
            })

            const infoWindow = new google.maps.InfoWindow({
                content: `<div style="color: #333; font-size: 14px; padding: 4px;"><strong>${loc.relevantText}</strong>${loc.address ? `<br><span style="font-size: 12px; color: #666;">${loc.address}</span>` : ''}</div>`,
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
            mapInstanceRef.current.fitBounds(bounds, 60)
        }
    }, [locations, isLoaded])

    const addLocation = useCallback((lat: number, lng: number, address?: string) => {
        if (locations.length >= maxLocations) return

        const newLocation: Location = {
            id: `loc-${Date.now()}`,
            latitude: lat,
            longitude: lng,
            relevantText: MESSAGE_PRESETS[0].emoji + ' ' + MESSAGE_PRESETS[0].text,
            address
        }
        onChange([...locations, newLocation])
    }, [locations, maxLocations, onChange])

    const removeLocation = (id: string) => {
        onChange(locations.filter(l => l.id !== id))
    }

    const updateMessage = (id: string, message: string) => {
        onChange(locations.map(l => l.id === id ? { ...l, relevantText: message } : l))
        setShowPresets(null)
    }

    // Go to my location
    const goToMyLocation = () => {
        if (!navigator.geolocation || !mapInstanceRef.current) return

        setLocatingMe(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                mapInstanceRef.current?.setCenter({ lat: latitude, lng: longitude })
                mapInstanceRef.current?.setZoom(16)
                setLocatingMe(false)
            },
            (error) => {
                console.error('Geolocation error:', error)
                setLocatingMe(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    if (error) {
        return (
            <div className="h-64 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200">
                <span className="text-red-500 text-sm">{error}</span>
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
                    className="flex-1 px-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    disabled={locations.length >= maxLocations || !isLoaded}
                />
                <button
                    onClick={goToMyLocation}
                    disabled={!isLoaded || locatingMe}
                    className="px-3 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    title="Mein Standort"
                >
                    {locatingMe ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Navigation size={18} />
                    )}
                </button>
            </div>

            {/* Map */}
            <div className="h-72 rounded-xl overflow-hidden border border-zinc-200 shadow-sm relative">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    </div>
                )}
                <div ref={mapRef} className="h-full w-full" />
            </div>

            {/* Hint */}
            <p className="text-xs text-zinc-500 flex items-center gap-1">
                <MapPin size={12} />
                Klicke auf die Karte oder suche eine Adresse • {locations.length}/{maxLocations} Standorte
            </p>

            {/* Location List */}
            {locations.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-600">Deine Standorte</h4>
                    {locations.map((loc, idx) => (
                        <div
                            key={loc.id}
                            className="flex items-start gap-3 p-3 bg-white border border-zinc-200 rounded-lg shadow-sm"
                        >
                            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                {/* Message with Presets Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowPresets(showPresets === loc.id ? null : loc.id)}
                                        className="w-full text-left text-sm text-zinc-800 hover:text-green-600 flex items-center gap-1 group"
                                    >
                                        <span className="truncate">{loc.relevantText}</span>
                                        <ChevronDown size={14} className="text-zinc-400 group-hover:text-green-500 shrink-0" />
                                    </button>

                                    {/* Presets Dropdown */}
                                    {showPresets === loc.id && (
                                        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 py-1 max-h-48 overflow-y-auto">
                                            {MESSAGE_PRESETS.map((preset, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => updateMessage(loc.id, preset.emoji + ' ' + preset.text)}
                                                    className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm flex items-center gap-2"
                                                >
                                                    <span>{preset.emoji}</span>
                                                    <span className="text-zinc-700">{preset.text}</span>
                                                    <span className="text-xs text-zinc-400 ml-auto">{preset.category}</span>
                                                </button>
                                            ))}
                                            <div className="border-t border-zinc-100 mt-1 pt-1 px-3 py-2">
                                                <input
                                                    type="text"
                                                    placeholder="Eigene Nachricht..."
                                                    className="w-full px-2 py-1 text-sm border border-zinc-200 rounded"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            updateMessage(loc.id, (e.target as HTMLInputElement).value)
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-400 truncate mt-1">
                                    {loc.address || `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`}
                                </p>
                            </div>
                            <button
                                onClick={() => removeLocation(loc.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Löschen"
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
