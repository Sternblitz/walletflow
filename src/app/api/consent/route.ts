import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            campaignId,
            clientId,
            consentPrivacyTerms,
            consentBenefitsMarketing,
            platform,
            // New fields for pass linking
            passId,
            consentSource, // 'popup1_yes' | 'popup2_yes' | 'popup2_no'
            consentTextVersion,
            consentTextHash,
        } = body

        // Validate required fields
        if (!campaignId || !clientId) {
            return NextResponse.json(
                { error: "Missing required fields: campaignId, clientId" },
                { status: 400 }
            )
        }

        if (typeof consentPrivacyTerms !== 'boolean') {
            return NextResponse.json(
                { error: "consentPrivacyTerms must be a boolean" },
                { status: 400 }
            )
        }

        // Privacy terms must be accepted
        if (!consentPrivacyTerms) {
            return NextResponse.json(
                { error: "Privacy terms must be accepted" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get client info (headers)
        const userAgent = req.headers.get('user-agent') || null
        const forwardedFor = req.headers.get('x-forwarded-for')
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null

        // Generate session token for optional future linking
        const sessionToken = uuidv4()

        // Insert consent log (audit trail)
        const { data, error } = await supabase
            .from('consent_logs')
            .insert({
                campaign_id: campaignId,
                client_id: clientId,
                consent_privacy_terms: consentPrivacyTerms,
                consent_benefits_marketing: consentBenefitsMarketing ?? false,
                wallet_platform: platform || null,
                session_token: sessionToken,
                user_agent: userAgent,
                ip_address: ipAddress,
                consent_version: consentTextVersion || '1.0',
                // New fields
                pass_id: passId || null,
                consent_source: consentSource || null,
                consent_text_hash: consentTextHash || null,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Error inserting consent log:', error)
            return NextResponse.json(
                { error: "Failed to save consent" },
                { status: 500 }
            )
        }

        // If passId provided, update the pass record with consent status
        if (passId) {
            const { error: updateError } = await supabase
                .from('passes')
                .update({
                    consent_marketing: consentBenefitsMarketing ?? false,
                    consent_marketing_at: new Date().toISOString(),
                    consent_source: consentSource || null,
                    consent_text_version: consentTextVersion || '1.0',
                })
                .eq('id', passId)

            if (updateError) {
                console.error('Error updating pass consent:', updateError)
                // Don't fail the request, consent log was already saved
            }
        }

        return NextResponse.json({
            success: true,
            consentId: data.id,
            sessionToken,
        })

    } catch (error) {
        console.error('Consent API error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
