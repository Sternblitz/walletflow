import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { reason } = await req.json()

        const supabase = await createClient()

        const { error } = await supabase
            .from('push_requests')
            .update({
                status: 'rejected',
                rejection_reason: reason || 'No reason provided',
                approved_at: new Date().toISOString() // Using this as 'decision_at'
            })
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
