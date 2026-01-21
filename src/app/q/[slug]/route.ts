import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Look up the QR code
    const { data: qrCode, error } = await supabase
        .from('qr_codes')
        .select('destination_url, id, scans')
        .eq('slug', slug)
        .single()

    if (error || !qrCode) {
        return new NextResponse("QR Code not found", { status: 404 })
    }

    // 2. Increment scan count (fire and forget to not block redirect)
    // We purposefully ignore the error here to ensure speed
    await supabase.rpc('increment_qr_scan', { qr_id: qrCode.id }).catch(() => {
        // Fallback if RPC doesn't exist yet, try direct update
        // (Though RPC is better for concurrency, we'll implement a simple update for now or add an RPC)
    })

    // Simple increment if RPC is not preferred/available yet:
    await supabase
        .from('qr_codes')
        .update({ scans: (qrCode.scans || 0) + 1 })
        .eq('id', qrCode.id)

    // 3. Redirect
    return NextResponse.redirect(qrCode.destination_url)
}
