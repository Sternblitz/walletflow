import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/geocode
 * 
 * Converts an address to latitude/longitude coordinates
 * Uses Google Geocoding API or OpenStreetMap Nominatim (free)
 */
export async function POST(req: NextRequest) {
    try {
        const { address } = await req.json()

        if (!address || typeof address !== 'string') {
            return NextResponse.json({ error: "Missing address" }, { status: 400 })
        }

        // Use OpenStreetMap Nominatim (free, no API key required)
        const encodedAddress = encodeURIComponent(address)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
                headers: {
                    'User-Agent': 'QARD/1.0 (contact@qard.io)' // Required by Nominatim
                }
            }
        )

        if (!response.ok) {
            return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 })
        }

        const results = await response.json()

        if (!results || results.length === 0) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 })
        }

        const location = results[0]

        return NextResponse.json({
            success: true,
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon),
            displayName: location.display_name
        })

    } catch (e) {
        console.error("Geocoding error:", e)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
