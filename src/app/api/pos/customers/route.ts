import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/pos/customers?slug=xxx
 * Returns customer list for a restaurant's POS dashboard
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Find client and campaign by slug
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, campaigns(id)')
        .eq('slug', slug)
        .single()

    if (clientError || !client || !client.campaigns?.length) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    const campaignId = client.campaigns[0].id

    // 2. Fetch all passes with customer data
    const { data: passes, error: passesError } = await supabase
        .from('passes')
        .select(`
            id,
            serial_number,
            customer_name,
            customer_birthday,
            customer_email,
            customer_phone,
            current_state,
            wallet_type,
            created_at,
            last_updated_at,
            is_installed_on_ios,
            is_installed_on_android
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

    if (passesError) {
        console.error("Error fetching customers:", passesError)
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    // 3. Transform data for frontend
    const customers = (passes || []).map(pass => ({
        id: pass.id,
        serialNumber: pass.serial_number,
        name: pass.customer_name || null,
        birthday: pass.customer_birthday || null,
        email: pass.customer_email || null,
        phone: pass.customer_phone || null,
        stamps: pass.current_state?.stamps || 0,
        maxStamps: pass.current_state?.max_stamps || 10,
        customerNumber: pass.current_state?.customer_number || pass.serial_number?.slice(-6),
        platform: pass.wallet_type || 'apple',
        isInstalled: pass.is_installed_on_ios || pass.is_installed_on_android,
        createdAt: pass.created_at,
        lastActivity: pass.last_updated_at
    }))

    // 4. Summary stats
    const summary = {
        total: customers.length,
        withName: customers.filter(c => c.name).length,
        withBirthday: customers.filter(c => c.birthday).length,
        withEmail: customers.filter(c => c.email).length,
        installed: customers.filter(c => c.isInstalled).length
    }

    return NextResponse.json({ customers, summary })
}
