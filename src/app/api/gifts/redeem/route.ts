import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/gifts/redeem
 * 
 * Called by POS/App when staff marks a gift as redeemed
 * 
 * Body: { giftId: string, redeemedBy?: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { giftId, redeemedBy } = body

        if (!giftId) {
            return NextResponse.json({ error: "Missing giftId" }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch the gift first to ensure it exists and is not already redeemed
        const { data: gift, error: fetchError } = await supabase
            .from('pass_gifts')
            .select('*, pass:passes(customer_name)')
            .eq('id', giftId)
            .single()

        if (fetchError || !gift) {
            return NextResponse.json({ error: "Gift not found" }, { status: 404 })
        }

        if (gift.redeemed_at) {
            return NextResponse.json({
                error: "Gift already redeemed",
                redeemed_at: gift.redeemed_at,
                redeemed_by: gift.redeemed_by
            }, { status: 400 })
        }

        // Check if gift is expired
        if (gift.expires_at && new Date(gift.expires_at) < new Date()) {
            return NextResponse.json({
                error: "Gift has expired",
                expires_at: gift.expires_at
            }, { status: 400 })
        }

        // Mark gift as redeemed
        const { error: updateError } = await supabase
            .from('pass_gifts')
            .update({
                redeemed_at: new Date().toISOString(),
                redeemed_by: redeemedBy || 'Mitarbeiter'
            })
            .eq('id', giftId)

        if (updateError) {
            console.error("Failed to redeem gift:", updateError)
            return NextResponse.json({ error: "Update failed" }, { status: 500 })
        }

        console.log(`[GIFT] Redeemed gift ${giftId} (${gift.gift_title}) by ${redeemedBy || 'Mitarbeiter'}`)

        return NextResponse.json({
            success: true,
            message: `${gift.gift_title} erfolgreich eingelöst!`,
            gift: {
                id: gift.id,
                title: gift.gift_title,
                type: gift.gift_type,
                customerName: gift.pass?.customer_name
            }
        })

    } catch (e) {
        console.error("Gift redemption error:", e)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

/**
 * GET /api/gifts/redeem?passId=XXX
 * 
 * Get all pending gifts for a pass (for manual lookup)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const passId = searchParams.get('passId')

    if (!passId) {
        return NextResponse.json({ error: "Missing passId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: gifts, error } = await supabase
        .from('pass_gifts')
        .select('*')
        .eq('pass_id', passId)
        .is('redeemed_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
        gifts: gifts || [],
        count: gifts?.length || 0
    })
}
