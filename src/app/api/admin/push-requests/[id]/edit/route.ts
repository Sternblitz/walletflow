import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Edit a push request message
 * Admin can correct typos or modify the message before approval
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { message } = body

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Check if request exists and is editable
        const { data: request, error: reqError } = await supabase
            .from('push_requests')
            .select('id, status')
            .eq('id', id)
            .single()

        if (reqError || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // Can only edit pending or scheduled requests
        if (!['pending', 'scheduled'].includes(request.status)) {
            return NextResponse.json(
                { error: 'Can only edit pending or scheduled requests' },
                { status: 400 }
            )
        }

        // Update with edited message
        const { error: updateError } = await supabase
            .from('push_requests')
            .update({
                edited_message: message.trim(),
                edited_at: new Date().toISOString()
                // edited_by would be set from auth context if available
            })
            .eq('id', id)

        if (updateError) {
            console.error('Failed to update push request:', updateError)
            return NextResponse.json({ error: 'Failed to save edit' }, { status: 500 })
        }

        console.log(`[PUSH] Request ${id} edited`)

        return NextResponse.json({
            success: true,
            message: 'Request updated successfully'
        })

    } catch (e) {
        console.error('Edit error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
