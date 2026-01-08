import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: requests, error } = await supabase
            .from('push_requests')
            .select(`
                *,
                campaign:campaigns(
                    id, 
                    name, 
                    client:clients(name, slug)
                )
            `)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching push requests:', error)
            return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
        }

        return NextResponse.json({ requests })
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
