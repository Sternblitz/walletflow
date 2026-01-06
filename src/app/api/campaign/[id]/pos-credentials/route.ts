import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/campaign/[id]/pos-credentials
 * Get all POS credentials for a campaign
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Verify authentication (optional, depending on middleware)
        // const { data: { user }, error: authError } = await supabase.auth.getUser()
        // if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: credentials, error } = await supabase
            .from('pos_credentials')
            .select('id, role, label, pin_code, is_active, last_used_at')
            .eq('campaign_id', id)
            .order('role', { ascending: true }) // chef then staff usually, or sort in frontend

        if (error) {
            console.error('Error fetching credentials:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json({ credentials })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

/**
 * POST /api/campaign/[id]/pos-credentials
 * Update or Create POS credentials
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { credentials } = await req.json() // Array of { id?, role, pin_code, label }

        if (!Array.isArray(credentials)) {
            return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
        }

        const supabase = await createClient()

        const results = []

        for (const cred of credentials) {
            if (cred.id) {
                // Update existing
                const { data, error } = await supabase
                    .from('pos_credentials')
                    .update({
                        pin_code: cred.pin_code,
                        label: cred.label,
                        // role should typically not change for an ID, but let's allow it or ignore it
                    })
                    .eq('id', cred.id)
                    .eq('campaign_id', id)
                    .select()

                if (error) throw error
                results.push(data[0])
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('pos_credentials')
                    .insert({
                        campaign_id: id,
                        role: cred.role,
                        pin_code: cred.pin_code,
                        label: cred.label || (cred.role === 'chef' ? 'Chef' : 'Mitarbeiter')
                    })
                    .select()

                if (error) throw error
                results.push(data[0])
            }
        }

        return NextResponse.json({ success: true, credentials: results })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
