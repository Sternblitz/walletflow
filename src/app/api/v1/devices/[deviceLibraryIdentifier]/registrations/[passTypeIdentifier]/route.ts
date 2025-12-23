import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Apple Pass Web Service - Get Passes for Device
 * 
 * GET: Returns list of passes that need updating
 * 
 * Route: /api/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
 */

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> }
) {
    const { deviceLibraryIdentifier, passTypeIdentifier } = await params

    // Optional: passesUpdatedSince query param
    const passesUpdatedSince = req.nextUrl.searchParams.get('passesUpdatedSince')

    const supabase = await createClient()

    // Get all registrations for this device
    let query = supabase
        .from('device_registrations')
        .select('serial_number, passes!inner(last_updated_at)')
        .eq('device_library_identifier', deviceLibraryIdentifier)
        .eq('pass_type_identifier', passTypeIdentifier)

    // If passesUpdatedSince provided, filter by update time
    if (passesUpdatedSince) {
        const sinceDate = new Date(parseInt(passesUpdatedSince) * 1000).toISOString()
        query = query.gt('passes.last_updated_at', sinceDate)
    }

    const { data: registrations, error } = await query

    if (error) {
        console.error('[GET PASSES] Query error:', error)
        return new NextResponse(null, { status: 500 })
    }

    if (!registrations || registrations.length === 0) {
        // 204 = No updates available
        return new NextResponse(null, { status: 204 })
    }

    const serialNumbers = registrations.map(r => r.serial_number)
    const lastUpdated = Math.floor(Date.now() / 1000).toString()

    console.log(`[GET PASSES] Device ${deviceLibraryIdentifier} has ${serialNumbers.length} passes to update`)

    return NextResponse.json({
        serialNumbers,
        lastUpdated
    })
}
