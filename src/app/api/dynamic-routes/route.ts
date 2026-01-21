import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getStartURL } from "@/lib/domain-urls"

// Generate a random 8-character alphanumeric code
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars like 0/O, 1/I
    let code = ''
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// GET: Fetch dynamic route for a client
export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
        return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const { data: route, error } = await supabase
        .from('dynamic_routes')
        .select('*')
        .eq('client_id', clientId)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ route: route || null })
}

// POST: Create or update dynamic route for a client
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const body = await request.json()
    const { clientId, targetUrl, clientSlug } = body

    if (!clientId) {
        return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    // If no targetUrl provided, use the default campaign URL based on slug
    const finalTargetUrl = targetUrl || (clientSlug ? getStartURL(clientSlug) : null)

    if (!finalTargetUrl) {
        return NextResponse.json({ error: 'targetUrl or clientSlug is required' }, { status: 400 })
    }

    // Check if route already exists for this client
    const { data: existing } = await supabase
        .from('dynamic_routes')
        .select('id, code')
        .eq('client_id', clientId)
        .single()

    if (existing) {
        // Update existing route
        const { data, error } = await supabase
            .from('dynamic_routes')
            .update({
                target_url: finalTargetUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ route: data, created: false })
    } else {
        // Create new route with unique code
        let code = generateCode()
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
            const { data, error } = await supabase
                .from('dynamic_routes')
                .insert({
                    client_id: clientId,
                    code: code,
                    target_url: finalTargetUrl
                })
                .select()
                .single()

            if (!error) {
                return NextResponse.json({ route: data, created: true })
            }

            // If unique constraint violation, try another code
            if (error.code === '23505') {
                code = generateCode()
                attempts++
            } else {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        }

        return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 })
    }
}
