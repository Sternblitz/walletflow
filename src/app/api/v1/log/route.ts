import { NextRequest, NextResponse } from "next/server"

/**
 * Apple Pass Web Service - Error Logging
 * 
 * POST: Receives error logs from iOS devices
 * 
 * Route: /api/v1/log
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('[APPLE PASS LOG]', JSON.stringify(body, null, 2))
    } catch {
        // Ignore parse errors
    }

    return new NextResponse(null, { status: 200 })
}
