import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AutomationRule {
    id: string
    campaign_id: string
    name: string
    rule_type: 'birthday' | 'weekday_schedule' | 'inactivity' | 'custom'
    config: Record<string, any>
    message_template: string
    is_enabled: boolean
    created_at: string
    updated_at: string
}

/**
 * GET /api/automations?campaignId=XXX or ?slug=XXX
 * List all automation rules for a campaign
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const slug = searchParams.get('slug')

    if (!campaignId && !slug) {
        return NextResponse.json({ error: 'Missing campaignId or slug' }, { status: 400 })
    }

    const supabase = await createClient()

    let finalCampaignId = campaignId

    // Resolve slug to campaignId
    if (slug && !campaignId) {
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('campaigns(id)')
            .eq('slug', slug)
            .single()

        if (clientError || !client || !client.campaigns?.length) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }
        finalCampaignId = client.campaigns[0].id
    }

    // Fetch automation rules
    const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('campaign_id', finalCampaignId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch automation rules:', error)
        return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
    }

    return NextResponse.json({ rules: rules || [] })
}

/**
 * POST /api/automations
 * Create a new automation rule
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { campaignId, slug, name, ruleType, config, messageTemplate, isEnabled = true } = body

        if (!name || !ruleType || !messageTemplate) {
            return NextResponse.json({
                error: 'Missing required fields: name, ruleType, messageTemplate'
            }, { status: 400 })
        }

        if (!campaignId && !slug) {
            return NextResponse.json({ error: 'Missing campaignId or slug' }, { status: 400 })
        }

        const supabase = await createClient()

        let finalCampaignId = campaignId

        // Resolve slug to campaignId
        if (slug && !campaignId) {
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('campaigns(id)')
                .eq('slug', slug)
                .single()

            if (clientError || !client || !client.campaigns?.length) {
                return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
            }
            finalCampaignId = client.campaigns[0].id
        }

        // Create the rule
        const { data: rule, error } = await supabase
            .from('automation_rules')
            .insert({
                campaign_id: finalCampaignId,
                name,
                rule_type: ruleType,
                config: config || {},
                message_template: messageTemplate,
                is_enabled: isEnabled
            })
            .select()
            .single()

        if (error) {
            console.error('Failed to create automation rule:', error)
            return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
        }

        console.log(`[AUTOMATION] Created rule "${name}" (${ruleType}) for campaign ${finalCampaignId}`)

        return NextResponse.json({ success: true, rule })

    } catch (e) {
        console.error('Automation create error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

/**
 * PUT /api/automations
 * Update an existing automation rule
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { id, name, config, messageTemplate, isEnabled } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing rule id' }, { status: 400 })
        }

        const supabase = await createClient()

        // Build update object
        const updates: Record<string, any> = {}
        if (name !== undefined) updates.name = name
        if (config !== undefined) updates.config = config
        if (messageTemplate !== undefined) updates.message_template = messageTemplate
        if (isEnabled !== undefined) updates.is_enabled = isEnabled

        const { data: rule, error } = await supabase
            .from('automation_rules')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Failed to update automation rule:', error)
            return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
        }

        console.log(`[AUTOMATION] Updated rule ${id}`)

        return NextResponse.json({ success: true, rule })

    } catch (e) {
        console.error('Automation update error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/automations?id=XXX
 * Delete an automation rule
 */
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Missing rule id' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Failed to delete automation rule:', error)
        return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
    }

    console.log(`[AUTOMATION] Deleted rule ${id}`)

    return NextResponse.json({ success: true })
}
