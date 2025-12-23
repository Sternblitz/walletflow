'use server'

import { createClient } from "@/lib/supabase/server"
import { createDraftFromTemplate } from "@/lib/wallet/layout-definitions"

export async function createCampaignAction(data: any) {
    const supabase = await createClient()

    // 1. Auth Check (STRICT)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: "Nicht autorisiert. Bitte neu einloggen." }
    }

    const userId = user.id

    // 2. Find Agency
    let { data: agency, error: agencyFetchError } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', userId)
        .single()

    // 3. Create Agency if missing
    if (!agency) {
        const { data: newAgency, error: createError } = await supabase
            .from('agencies')
            .insert({
                owner_id: userId,
                name: "Meine Agentur"
            })
            .select('id')
            .single()

        if (createError) {
            console.error("Agency creation failed:", createError)
            return { success: false, error: `Fehler beim Erstellen der Agentur: ${createError.message}` }
        }
        agency = newAgency
    }

    if (!agency) {
        return { success: false, error: "Kritischer Fehler: Agentur existiert nicht." }
    }

    // 4. Create Client with Unique Slug (Random Suffix)
    const baseSlug = data.slug || (data.clientName ? data.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'client') || 'client'
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`

    const { data: client, error: clientError } = await supabase.from('clients').insert({
        agency_id: agency.id,
        name: data.clientName,
        slug: uniqueSlug
    }).select().single()

    if (clientError) {
        console.error("Client creation error:", clientError)
        return { success: false, error: `Fehler beim Kunden-Anlegen: ${clientError.message}` }
    }

    // 5. Create Campaign
    let designConfig = data.designConfig

    // Fallback: Generate Draft if missing (Server-Side)
    if (!designConfig || Object.keys(designConfig).length === 0) {
        const map: Record<string, string> = {
            'STAMP_CARD': 'stempelkarte',
            'STAMP_CARD_V2': 'stempelkarte_v2',
            'MEMBER_CARD': 'mitgliederkarte',
            'POINTS_CARD': 'punktekarte',
            'COUPON': 'gutschein',
            'CUSTOM': 'individuell'
        }
        const templateId = map[data.concept] || 'stempelkarte'
        designConfig = createDraftFromTemplate(templateId)

        // Inject Basic Info
        if (designConfig) {
            designConfig.content.organizationName = data.clientName
            designConfig.content.logoText = data.clientName
        }
    }

    // Ensure it's valid JSON & Strip Data URLs
    let cleanDesignConfig: any = {}
    let cleanConfig: any = {}

    try {
        cleanDesignConfig = JSON.parse(JSON.stringify(designConfig || {}))
        cleanConfig = JSON.parse(JSON.stringify({
            address: data.address || "",
            locationMessage: data.locationMessage || "Du bist in der Nähe! 🎉",
            locations: data.locations || [] // Multiple locations support
        }))

        // Upload data URL images to Storage before stripping
        if (cleanDesignConfig.images) {
            for (const key of Object.keys(cleanDesignConfig.images)) {
                const img = cleanDesignConfig.images[key]
                if (img && typeof img.url === 'string' && img.url.startsWith('data:')) {
                    // Upload to Supabase Storage
                    const base64Data = img.url.split(',')[1]
                    const mimeMatch = img.url.match(/data:(.*?);/)
                    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
                    const extension = mimeType.split('/')[1] || 'png'
                    const fileName = `${key}-${Date.now()}.${extension}`
                    const filePath = `pass-assets/${key}-images/${fileName}`

                    // Convert base64 to buffer
                    const buffer = Buffer.from(base64Data, 'base64')

                    const { error: uploadError } = await supabase.storage
                        .from('pass-assets')
                        .upload(filePath, buffer, {
                            contentType: mimeType,
                            upsert: true
                        })

                    if (!uploadError) {
                        // Get public URL
                        const { data: publicUrlData } = supabase.storage
                            .from('pass-assets')
                            .getPublicUrl(filePath)

                        cleanDesignConfig.images[key] = {
                            url: publicUrlData.publicUrl,
                            fileName: img.fileName || fileName
                        }
                        console.log(`[DEBUG] Uploaded ${key} to:`, publicUrlData.publicUrl)
                    } else {
                        console.error(`[DEBUG] Failed to upload ${key}:`, uploadError)
                        // Remove failed image to prevent DB error
                        delete cleanDesignConfig.images[key]
                    }
                }
            }
        }
    } catch (e) {
        console.error("JSON serialization failed:", e)
        return { success: false, error: "Interner Fehler: Ungültiges Design-Format" }
    }

    // 6. Insert Campaign
    const { error: campaignError } = await supabase.from('campaigns').insert({
        client_id: client.id,
        name: "Start Kampagne",
        concept: data.concept,
        config: cleanConfig,
        design_assets: cleanDesignConfig,
    })

    if (campaignError) {
        console.error("Campaign insert error:", campaignError)
        return { success: false, error: `Kampagne konnte nicht gespeichert werden: ${campaignError.message}` }
    }

    return { success: true, slug: uniqueSlug }
}
