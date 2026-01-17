'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Star, Check, X, Building2, Loader2 } from 'lucide-react'

interface PlaceResult {
    place_id: string
    name: string
    formatted_address: string
    rating?: number
    user_ratings_total?: number
    photos?: google.maps.places.PlacePhoto[]
}

interface PlaceIdSearcherProps {
    value?: string | null
    onChange: (placeId: string | null, placeData?: PlaceResult) => void
    className?: string
}

// Load Google Maps script
function loadGoogleMaps(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Window not available'))
            return
        }

        if ((window as any).google?.maps?.places) {
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

export function PlaceIdSearcher({ value, onChange, className = '' }: PlaceIdSearcherProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<PlaceResult[]>([])
    const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
    const [showDropdown, setShowDropdown] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
    const serviceRef = useRef<google.maps.places.PlacesService | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Load Google Maps API
    useEffect(() => {
        if (!apiKey) {
            setError('Google Maps API Key fehlt')
            return
        }

        loadGoogleMaps(apiKey)
            .then(() => {
                setIsLoaded(true)
                // Create a dummy div for PlacesService (required)
                const dummyDiv = document.createElement('div')
                serviceRef.current = new google.maps.places.PlacesService(dummyDiv)
            })
            .catch((err) => setError(err.message))
    }, [apiKey])

    // Fetch place details if we have a value but no selectedPlace
    useEffect(() => {
        if (value && !selectedPlace && isLoaded && serviceRef.current) {
            serviceRef.current.getDetails(
                { placeId: value, fields: ['place_id', 'name', 'formatted_address', 'rating', 'user_ratings_total', 'photos'] },
                (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                        setSelectedPlace({
                            place_id: place.place_id || value,
                            name: place.name || 'Unbekannt',
                            formatted_address: place.formatted_address || '',
                            rating: place.rating,
                            user_ratings_total: place.user_ratings_total,
                            photos: place.photos
                        })
                    }
                }
            )
        }
    }, [value, selectedPlace, isLoaded])

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Search places
    const searchPlaces = (searchQuery: string) => {
        if (!searchQuery.trim() || !serviceRef.current) {
            setResults([])
            return
        }

        setIsSearching(true)

        const request: google.maps.places.TextSearchRequest = {
            query: searchQuery,
            type: 'establishment'
        }

        serviceRef.current.textSearch(request, (places, status) => {
            setIsSearching(false)
            if (status === google.maps.places.PlacesServiceStatus.OK && places) {
                setResults(places.slice(0, 5).map(place => ({
                    place_id: place.place_id || '',
                    name: place.name || '',
                    formatted_address: place.formatted_address || '',
                    rating: place.rating,
                    user_ratings_total: place.user_ratings_total,
                    photos: place.photos
                })))
                setShowDropdown(true)
            } else {
                setResults([])
            }
        })
    }

    // Debounced search
    const handleQueryChange = (newQuery: string) => {
        setQuery(newQuery)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => searchPlaces(newQuery), 300)
    }

    // Select a place
    const handleSelect = (place: PlaceResult) => {
        setSelectedPlace(place)
        setQuery('')
        setResults([])
        setShowDropdown(false)
        onChange(place.place_id, place)
    }

    // Clear selection
    const handleClear = () => {
        setSelectedPlace(null)
        onChange(null)
    }

    if (error) {
        return (
            <div className={`p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm ${className}`}>
                {error}
            </div>
        )
    }

    // Show selected place
    if (selectedPlace) {
        return (
            <div className={`relative ${className}`}>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    {/* Photo or Icon */}
                    <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
                        {selectedPlace.photos?.[0] ? (
                            <img
                                src={selectedPlace.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 })}
                                alt={selectedPlace.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Building2 className="w-6 h-6 text-green-600" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                            <h4 className="font-semibold text-green-800 truncate">{selectedPlace.name}</h4>
                        </div>
                        <p className="text-sm text-green-600 truncate mt-0.5">{selectedPlace.formatted_address}</p>
                        {selectedPlace.rating && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs text-green-700 font-medium">{selectedPlace.rating}</span>
                                <span className="text-xs text-green-600">({selectedPlace.user_ratings_total} Bewertungen)</span>
                            </div>
                        )}
                    </div>

                    {/* Clear Button */}
                    <button
                        onClick={handleClear}
                        className="p-1.5 text-green-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Entfernen"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    // Show search input
    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    placeholder="Unternehmen suchen (z.B. Café Müller Hamburg)"
                    disabled={!isLoaded}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />
                )}
            </div>

            {/* Results Dropdown */}
            {showDropdown && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {results.map((place) => (
                        <button
                            key={place.place_id}
                            onClick={() => handleSelect(place)}
                            className="w-full flex items-start gap-3 p-3 hover:bg-violet-50 transition-colors text-left border-b border-zinc-100 last:border-0"
                        >
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
                                {place.photos?.[0] ? (
                                    <img
                                        src={place.photos[0].getUrl({ maxWidth: 80, maxHeight: 80 })}
                                        alt={place.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <MapPin className="w-4 h-4 text-zinc-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-zinc-900 truncate">{place.name}</p>
                                <p className="text-xs text-zinc-500 truncate">{place.formatted_address}</p>
                                {place.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        <span className="text-xs text-zinc-600">{place.rating}</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results */}
            {showDropdown && query.length > 2 && results.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-4 text-center text-sm text-zinc-500">
                    Kein Unternehmen gefunden
                </div>
            )}
        </div>
    )
}
