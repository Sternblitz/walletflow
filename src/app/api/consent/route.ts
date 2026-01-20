import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const consentSchema = z.object({
    merchantId: z.string().uuid(),
    campaignId: z.string().uuid(),
    platform: z.enum(['apple', 'google']),
    consentPrivacyTerms: z.boolean(),
    consentBenefitsMarketing: z.boolean(),
    sessionId: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const validation = consentSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid parameters", details: validation.error.format() },
                { status: 400 }
            )
        }

        const {
            merchantId,
            campaignId,
            platform,
            consentPrivacyTerms,
            consentBenefitsMarketing,
            sessionId
        } = validation.data

        const supabase = await createClient()

        // Get user agent and IP (best effort)
        const userAgent = req.headers.get('user-agent')
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'

        const { error } = await supabase
            .from('consent_logs')
            .insert({
                merchant_id: merchantId,
                campaign_id: campaignId,
                wallet_platform: platform,
                consent_privacy_terms: consentPrivacyTerms,
                consent_benefits_marketing: consentBenefitsMarketing,
                session_id: sessionId,
                user_agent: userAgent,
                ip_address: ipAddress
            })

        if (error) {
            console.error("[CONSENT LOG] Error inserting record:", error)
            return NextResponse.json({ error: "Database error" }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (e) {
        console.error("[CONSENT LOG] Unexpected error:", e)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
