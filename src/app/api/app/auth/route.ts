import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/app/auth
 * Authenticate POS user with PIN
 */
export async function POST(req: NextRequest) {
    try {
        const { slug, pin } = await req.json()

        if (!slug || !pin) {
            return NextResponse.json({ error: 'Missing slug or pin' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get client/campaign by slug
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, campaigns(id)')
            .eq('slug', slug)
            .single()

        if (clientError || !client || !client.campaigns?.length) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const campaignId = client.campaigns[0].id

        // Check PIN against pos_credentials
        const { data: credential, error: credError } = await supabase
            .from('pos_credentials')
            .select('id, role, label')
            .eq('campaign_id', campaignId)
            .eq('pin_code', pin)
            .eq('is_active', true)
            .single()

        if (credError || !credential) {
            return NextResponse.json({
                success: false,
                error: 'Ungültiger PIN'
            }, { status: 401 })
        }

        // Update last_used_at
        await supabase
            .from('pos_credentials')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', credential.id)

        return NextResponse.json({
            success: true,
            role: credential.role, // 'chef' or 'staff'
            label: credential.label,
            campaignId
        })

    } catch (e) {
        console.error('POS Auth error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
