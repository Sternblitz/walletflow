import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get total count first (optimized count query)
    const { count, error: countError } = await supabase
        .from('passes')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)
        .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true,deleted_at.not.is.null')

    if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Get paginated data
    const { data: passes, error } = await supabase
        .from('passes')
        .select(`
            id,
            serial_number,
            current_state,
            created_at,
            last_updated_at,
            wallet_type,
            is_installed_on_ios,
            is_installed_on_android,
            verification_status,
            customer_name,
            customer_birthday,
            customer_email,
            customer_phone,
            deleted_at
        `)
        .eq('campaign_id', id)
        .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true,deleted_at.not.is.null')
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error('Error fetching passes:', error)
        return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 })
    }

    return NextResponse.json({
        passes: passes || [],
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    })
}
