import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * DELETE /api/admin/clients/[id]
 * Deletes a client and all associated campaigns/passes
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Verify client exists and user has permission
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, agency_id, agencies(owner_id)')
        .eq('id', id)
        .single()

    if (clientError || !client) {
        return NextResponse.json({ error: 'Client nicht gefunden' }, { status: 404 })
    }

    // Check ownership (agency owner must match user)
    const agencyOwner = (client as any).agencies?.owner_id
    if (agencyOwner !== user.id) {
        return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Delete client (cascades to campaigns, passes due to FK constraints)
    const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

    if (deleteError) {
        console.error('Delete error:', deleteError)
        return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
