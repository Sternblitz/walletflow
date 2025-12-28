import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/campaign/[id]/update
 * Update campaign design_assets and config
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params
        const body = await req.json()
        const { design_assets, config } = body

        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaign ID' }, { status: 400 })
        }

        const supabase = await createClient()

        // Verify campaign exists
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('id, config')
            .eq('id', campaignId)
            .single()

        if (fetchError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Prepare update object
        const updateData: any = {}

        if (design_assets) {
            // Process images - upload data URLs to storage
            let processedDesignAssets = { ...design_assets }

            if (design_assets.images) {
                for (const key of Object.keys(design_assets.images)) {
                    const img = design_assets.images[key]
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

                            processedDesignAssets.images[key] = {
                                url: publicUrlData.publicUrl,
                                fileName: img.fileName || fileName
                            }
                            console.log(`[UPDATE] Uploaded ${key} to:`, publicUrlData.publicUrl)
                        } else {
                            console.error(`[UPDATE] Failed to upload ${key}:`, uploadError)
                        }
                    }
                }
            }

            updateData.design_assets = processedDesignAssets
        }

        if (config) {
            // Merge with existing config
            updateData.config = {
                ...campaign.config,
                ...config
            }
        }

        // Update campaign
        const { error: updateError } = await supabase
            .from('campaigns')
            .update(updateData)
            .eq('id', campaignId)

        if (updateError) {
            console.error('Campaign update error:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        console.log(`[UPDATE] Campaign ${campaignId} updated successfully`)

        return NextResponse.json({
            success: true,
            message: 'Campaign updated'
        })

    } catch (e) {
        console.error('Update error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
