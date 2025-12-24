'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Trash2, Loader2, Navigation, ChevronDown, Sparkles } from 'lucide-react'

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

// Kategorisierte Nachrichten für maximale Conversion
const MESSAGE_CATEGORIES = {
    'generisch': {
        emoji: '🟢',
        label: 'Generisch',
        description: 'Passt immer & überall',
        messages: [
            '👋 Hey! Du bist ja quasi vor der Tür. Komm kurz rein!',
            '📍 Du bist nur 50m entfernt! Zeit für einen Besuch?',
            '👀 Ich sehe dich! (Spaß 😉) Komm rein auf einen Sprung.',
            '✨ Wir sind gleich um die Ecke. Schau mal, was es Neues gibt.',
            '🚀 Na, auch in der Gegend? Komm vorbei & sammle Punkte!',
            '👋 Lange nicht gesehen! Wir vermissen dich.',
            '🚶‍♂️ Du läufst gerade an uns vorbei. Dreh dich um!',
            '🎁 Da du eh hier bist: Komm rein für eine kleine Überraschung.',
            '🏠 Willkommen im Viertel! Dein Lieblingsladen wartet.',
            '📲 Dein Punktestand wartet auf ein Update. Komm rein!',
        ]
    },
    'gastro': {
        emoji: '🍔',
        label: 'Gastro & Food',
        description: 'Hunger-Trigger (11-14 Uhr)',
        messages: [
            '🤤 Magen knurrt? Wir haben die Lösung in 100m Entfernung.',
            '🍔 Lust auf den besten Burger der Stadt? Du bist ganz nah!',
            '🥗 Keine Lust zu kochen? Wir übernehmen das für dich.',
            '🍕 Pizza-Alarm! Du bist in der Gefahrenzone. Komm rein!',
            '🥪 Nur kurz snacken? Wir haben was Schnelles für dich.',
            '🍜 Suppenkoma gefällig? Komm vorbei zum Lunch!',
            '🥖 Der Ofen ist heiß! Frisches Brot wartet auf dich.',
            '🍗 Gönn dir was Richtiges. Du hast es dir verdient.',
            '🤤 Riechst du das? Das sind unsere frischen Waffeln...',
            '🕑 Mittagspause nutzen! Dein Tisch ist fast gedeckt.',
        ]
    },
    'kaffee': {
        emoji: '☕️',
        label: 'Kaffee & Drinks',
        description: 'Impulskäufe',
        messages: [
            '☕️ Akku leer? Hol dir hier dein Koffein-Update!',
            '😴 Müde? Wir haben den Wachmacher direkt hier.',
            '🍰 Kaffee & Kuchen? Du bist nur 2 Minuten entfernt.',
            '🍹 Durstig? Happy Hour startet in 10 Minuten!',
            '🍻 Feierabend-Bier? Deine Freunde warten schon.',
            '🥤 Erfrischung gefällig? Hol dir deinen Drink to go.',
            '🍷 Ein Gläschen Wein in Ehren... Du bist ja eh hier!',
            '🥶 Kalt draußen? Wir haben heiße Schokolade & Heizung.',
            '☀️ Zu heiß? Wir haben die kältesten Drinks der Stadt.',
            '🧉 Matcha-Lover? Dein Green Energy Boost ist hier.',
        ]
    },
    'rabatte': {
        emoji: '💰',
        label: 'Rabatte & Deals',
        description: 'Verkaufs-Trigger',
        messages: [
            '💸 20% Rabatt! Aber nur, wenn du JETZT reinkommst.',
            '🚨 Flash Sale! Zeig diesen Pass für 10% Extra-Rabatt.',
            '🤑 Geld sparen? Komm rein, wir haben Angebote.',
            '🎟 2-für-1 Deal! Bring jemanden mit, du bist ja in der Nähe.',
            '📉 Preise fallen! Nur heute und nur für dich als Pass-Inhaber.',
            '🎁 Kleines Geschenk? Zeig den Pass an der Kasse!',
            '🍦 Gratis Topping? Nur weil du gerade in der Nähe bist.',
            '🏷 Rausverkauf! Alles muss raus. Hilf uns dabei.',
            '💎 Exklusiver Member-Deal: Heute doppelte Punkte sammeln!',
            '💳 Karte zücken, Geld sparen. Komm schnell rein.',
        ]
    },
    'genz': {
        emoji: '😎',
        label: 'Frech & Witzig',
        description: 'Gen Z / Hippe Läden',
        messages: [
            '🌚 Wir wissen, dass du hier bist. Komm rein!',
            '💔 Dein Ex ist nicht hier. Aber wir! Komm trinken.',
            '🏋️‍♀️ Cheat Day? Wir verraten es niemandem. Gönn dir.',
            '🌧 Scheiß Wetter, geiler Laden. Komm ins Trockene.',
            '🧟‍♂️ Du siehst hungrig aus. Wir ändern das.',
            '🤷‍♂️ Warum weiterlaufen? Hier ist es viel cooler.',
            '🚀 Beam me up! Oder komm einfach zu Fuß rein.',
            '🦄 Einhörner gibt\'s nicht. Unseren Kaffee schon.',
            '🔋 Deine Social Battery ist leer? Hier gibt\'s Drinks.',
            '✨ Du siehst gut aus! Zeig dich mal bei uns im Laden.',
        ]
    },
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
    const locationsRef = useRef(locations) // Keep ref updated for click handler

    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCategoryPicker, setShowCategoryPicker] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState(MESSAGE_CATEGORIES.generisch.messages[0])
    const [locatingMe, setLocatingMe] = useState(false)

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Keep locationsRef updated
    useEffect(() => {
        locationsRef.current = locations
    }, [locations])

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

    // Add location function
    const addLocation = useCallback((lat: number, lng: number, address?: string) => {
        const currentLocations = locationsRef.current
        if (currentLocations.length >= maxLocations) return

        const newLocation: Location = {
            id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            latitude: lat,
            longitude: lng,
            relevantText: selectedMessage,
            address
        }
        onChange([...currentLocations, newLocation])
    }, [maxLocations, onChange, selectedMessage])

    // Initialize map when loaded
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

        const defaultCenter = locations.length > 0
            ? { lat: locations[0].latitude, lng: locations[0].longitude }
            : { lat: 52.52, lng: 13.405 }

        const map = new google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: locations.length > 0 ? 14 : 6,
            styles: [], // Light theme
            gestureHandling: 'greedy',
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
            },
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            scaleControl: true,
        })

        // Click handler - uses ref to always have current locations
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (locationsRef.current.length >= maxLocations) return
            if (e.latLng) {
                const lat = e.latLng.lat()
                const lng = e.latLng.lng()

                // Reverse geocode to get address
                const geocoder = new google.maps.Geocoder()
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    const address = status === 'OK' && results?.[0]
                        ? results[0].formatted_address
                        : undefined
                    addLocation(lat, lng, address)
                })
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
    }, [isLoaded, addLocation, maxLocations])

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
                content: `<div style="color: #333; font-size: 14px; padding: 4px; max-width: 250px;"><strong>${loc.relevantText}</strong>${loc.address ? `<br><span style="font-size: 12px; color: #666;">${loc.address}</span>` : ''}</div>`,
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

    const removeLocation = (id: string) => {
        onChange(locations.filter(l => l.id !== id))
    }

    // Apply message to all locations
    const applyMessageToAll = (message: string) => {
        setSelectedMessage(message)
        if (locations.length > 0) {
            onChange(locations.map(l => ({ ...l, relevantText: message })))
        }
        setShowCategoryPicker(false)
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
            {/* Message Preset Selector */}
            <div className="relative">
                <button
                    onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-left hover:from-green-100 hover:to-emerald-100 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-green-600" />
                        <div>
                            <div className="text-sm font-medium text-green-800">Lockscreen-Nachricht</div>
                            <div className="text-xs text-green-600 truncate max-w-[280px]">{selectedMessage}</div>
                        </div>
                    </div>
                    <ChevronDown size={18} className={`text-green-600 transition-transform ${showCategoryPicker ? 'rotate-180' : ''}`} />
                </button>

                {/* Category Dropdown */}
                {showCategoryPicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-30 max-h-[400px] overflow-y-auto">
                        {Object.entries(MESSAGE_CATEGORIES).map(([key, category]) => (
                            <div key={key} className="border-b border-zinc-100 last:border-0">
                                <div className="px-4 py-2 bg-zinc-50 sticky top-0">
                                    <div className="flex items-center gap-2">
                                        <span>{category.emoji}</span>
                                        <span className="font-semibold text-sm text-zinc-700">{category.label}</span>
                                        <span className="text-xs text-zinc-400">– {category.description}</span>
                                    </div>
                                </div>
                                <div className="py-1">
                                    {category.messages.map((msg, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => applyMessageToAll(msg)}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-green-50 transition-colors ${selectedMessage === msg ? 'bg-green-100 text-green-800' : 'text-zinc-700'}`}
                                        >
                                            {msg}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
                Klicke auf die Karte um Standorte hinzuzufügen • {locations.length}/{maxLocations}
            </p>

            {/* Location List */}
            {locations.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-600">Deine Standorte ({locations.length})</h4>
                    {locations.map((loc, idx) => (
                        <div
                            key={loc.id}
                            className="flex items-start gap-3 p-3 bg-white border border-zinc-200 rounded-lg shadow-sm group"
                        >
                            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-800 truncate">{loc.relevantText}</p>
                                <p className="text-xs text-zinc-400 truncate mt-0.5">
                                    {loc.address || `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`}
                                </p>
                            </div>
                            <button
                                onClick={() => removeLocation(loc.id)}
                                className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
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
