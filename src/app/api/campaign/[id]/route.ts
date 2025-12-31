import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(`
            id,
            name,
            concept,
            is_active,
            created_at,
            config,
            design_assets,
            client:clients(name, slug),
            passes(
                id,
                serial_number,
                current_state,
                created_at,
                last_updated_at,
                wallet_type
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching campaign:', error)
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign })
}
