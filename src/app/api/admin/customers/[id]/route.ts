import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Determine if it was soft-deleted already (optional check) but we want HARD delete

    // Hard delete the pass. 
    // Assuming configured FK constraints will cascade delete scans, push_logs, devices.
    // If not, we should delete them explicitly. But usually Passes is the root.

    // Explicitly deleting related data first just to be safe if cascades aren't perfect
    await supabase.from('scans').delete().eq('pass_id', id)
    await supabase.from('push_logs').delete().eq('pass_id', id)
    await supabase.from('devices').delete().eq('pass_id', id) // if exists

    const { error } = await supabase
        .from('passes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error deleting pass:", error)
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
