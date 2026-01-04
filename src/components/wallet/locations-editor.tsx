'use client'

import { useState, useCallback } from 'react'
import { Location } from '@/components/ui/location-picker'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Google Maps
const LocationPicker = dynamic(
    () => import('@/components/ui/location-picker').then(mod => mod.LocationPicker),
    { ssr: false }
)

interface LocationsEditorProps {
    locations: Location[]
    onChange: (locations: Location[]) => void
}

export function LocationsEditor({ locations, onChange }: LocationsEditorProps) {
    return (
        <div className="space-y-4">
            <div className="bg-white/5 rounded-xl border border-white/5 p-4">
                <LocationPicker
                    locations={locations || []}
                    onChange={onChange}
                    maxLocations={10}
                />
            </div>
        </div>
    )
}
