import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Apple Pass Web Service - Device Registration
 * 
 * POST: Register device for pass updates
 * DELETE: Unregister device
 * 
 * Route: /api/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 */

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params

    console.log(`[REGISTER] Incoming registration request for device ${deviceLibraryIdentifier}, pass ${serialNumber}`)

    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
        console.log(`[REGISTER] Missing or invalid auth header`)
        return new NextResponse(null, { status: 401 })
    }
    const authToken = authHeader.replace('ApplePass ', '')

    // Get push token from body
    let pushToken = ''
    try {
        const body = await req.json()
        pushToken = body.pushToken || ''
        console.log(`[REGISTER] Push token received: ${pushToken ? 'Yes' : 'No'}`)
    } catch {
        // Body might be empty
        console.log(`[REGISTER] No body/push token`)
    }

    const supabase = await createClient()

    // Verify pass exists and auth token matches
    const { data: pass, error } = await supabase
        .from('passes')
        .select('id, auth_token')
        .eq('serial_number', serialNumber)
        .single()

    if (error || !pass) {
        console.log(`[REGISTER] Pass not found: ${serialNumber}`)
        return new NextResponse(null, { status: 404 })
    }

    if (pass.auth_token !== authToken) {
        console.log(`[REGISTER] Auth token mismatch for ${serialNumber}`)
        return new NextResponse(null, { status: 401 })
    }

    // Store device registration (we'll create this table)
    const { error: regError } = await supabase
        .from('device_registrations')
        .upsert({
            device_library_identifier: deviceLibraryIdentifier,
            pass_type_identifier: passTypeIdentifier,
            serial_number: serialNumber,
            push_token: pushToken,
            pass_id: pass.id
        }, {
            onConflict: 'device_library_identifier,serial_number'
        })

    if (regError) {
        console.error('[REGISTER] Failed to save registration:', regError)
        // Return 200 anyway - device is already registered
    } else {
        // Mark the pass as installed on iOS and verified
        await supabase
            .from('passes')
            .update({
                is_installed_on_ios: true,
                verification_status: 'verified'  // Device registered = real customer
            })
            .eq('id', pass.id)
    }

    console.log(`[REGISTER] ✅ Device ${deviceLibraryIdentifier} registered for pass ${serialNumber} with push token: ${pushToken ? 'Yes' : 'No'}`)

    // 201 = newly registered, 200 = already registered
    return new NextResponse(null, { status: 201 })
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
    const { deviceLibraryIdentifier, serialNumber } = await params

    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
        return new NextResponse(null, { status: 401 })
    }
    const authToken = authHeader.replace('ApplePass ', '')

    const supabase = await createClient()

    // Verify pass exists and auth token matches
    const { data: pass } = await supabase
        .from('passes')
        .select('id, auth_token')
        .eq('serial_number', serialNumber)
        .single()

    if (!pass || pass.auth_token !== authToken) {
        return new NextResponse(null, { status: 401 })
    }

    // Delete registration
    await supabase
        .from('device_registrations')
        .delete()
        .eq('device_library_identifier', deviceLibraryIdentifier)
        .eq('serial_number', serialNumber)

    // Mark the pass as deleted (user removed it from their wallet)
    await supabase
        .from('passes')
        .update({
            deleted_at: new Date().toISOString(),
            is_installed_on_ios: false
        })
        .eq('id', pass.id)

    console.log(`[UNREGISTER] 🗑️ Pass ${serialNumber} marked as deleted - user removed from wallet`)

    return new NextResponse(null, { status: 200 })
}
