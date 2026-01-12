// Supabase Edge Function: execute-automations
// This function is called by pg_cron to execute automation rules

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutomationRule {
    id: string
    campaign_id: string
    name: string
    rule_type: 'birthday' | 'weekday_schedule' | 'inactivity' | 'custom'
    config: Record<string, any>
    message_template: string
    is_enabled: boolean
}

interface Pass {
    id: string
    push_token: string | null
    current_state: Record<string, any>
    customer_name?: string
    customer_birthday?: string
    deleted_at?: string | null
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client with service role
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const now = new Date()
        const currentHour = now.getHours()
        const currentWeekday = now.getDay()
        const todayDate = now.toISOString().split('T')[0]
        const todayMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

        console.log(`[Automation] Running at ${now.toISOString()}`)
        console.log(`[Automation] Hour: ${currentHour}, Weekday: ${currentWeekday}, Date: ${todayMonthDay}`)

        // Fetch all enabled automation rules
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('is_enabled', true)

        if (rulesError) {
            console.error('[Automation] Error fetching rules:', rulesError)
            throw rulesError
        }

        console.log(`[Automation] Found ${rules?.length || 0} enabled rules`)

        let totalExecuted = 0
        let totalSkipped = 0
        let totalFailed = 0

        // Process each rule
        for (const rule of (rules || []) as AutomationRule[]) {
            try {
                const shouldRun = checkIfRuleShouldRun(rule, currentHour, currentWeekday, todayMonthDay)

                if (!shouldRun) {
                    console.log(`[Automation] Rule "${rule.name}" - not scheduled for now`)
                    continue
                }

                console.log(`[Automation] Processing rule: ${rule.name} (${rule.rule_type})`)

                // Get target passes based on rule type
                const passes = await getTargetPasses(supabase, rule, todayMonthDay)
                console.log(`[Automation] Found ${passes.length} potential targets`)

                for (const pass of passes) {
                    // Check if already executed today
                    const { data: existing } = await supabase
                        .from('automation_executions')
                        .select('id')
                        .eq('rule_id', rule.id)
                        .eq('pass_id', pass.id)
                        .eq('execution_date', todayDate)
                        .single()

                    if (existing) {
                        console.log(`[Automation] Already sent to pass ${pass.id} today`)
                        totalSkipped++
                        continue
                    }

                    // Generate personalized message
                    const message = generateMessage(rule.message_template, pass)

                    // Update pass state to trigger push notification
                    const { error: updateError } = await supabase
                        .from('passes')
                        .update({
                            current_state: {
                                ...pass.current_state,
                                last_automation_message: message,
                                last_automation_at: now.toISOString(),
                            }
                        })
                        .eq('id', pass.id)

                    if (updateError) {
                        console.error(`[Automation] Failed to update pass ${pass.id}:`, updateError)

                        await supabase.from('automation_executions').insert({
                            rule_id: rule.id,
                            pass_id: pass.id,
                            status: 'failed',
                            error_message: updateError.message,
                            execution_date: todayDate,
                        })

                        totalFailed++
                        continue
                    }

                    // Send push notification if pass has push token
                    if (pass.push_token) {
                        await sendPushNotification(pass.push_token, message)
                    }

                    // Log successful execution
                    await supabase.from('automation_executions').insert({
                        rule_id: rule.id,
                        pass_id: pass.id,
                        status: 'sent',
                        sent_message: message,
                        execution_date: todayDate,
                    })

                    console.log(`[Automation] ✓ Sent to pass ${pass.id}`)
                    totalExecuted++
                }
            } catch (ruleError) {
                console.error(`[Automation] Error processing rule ${rule.name}:`, ruleError)
                totalFailed++
            }
        }

        const result = {
            success: true,
            executed: totalExecuted,
            skipped: totalSkipped,
            failed: totalFailed,
            timestamp: now.toISOString(),
        }

        console.log(`[Automation] Complete:`, result)

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('[Automation] Fatal error:', error)

        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

// Check if a rule should run at the current time
function checkIfRuleShouldRun(
    rule: AutomationRule,
    currentHour: number,
    currentWeekday: number,
    todayMonthDay: string
): boolean {
    switch (rule.rule_type) {
        case 'birthday': {
            const sendTime = rule.config.send_time || '09:00'
            const sendHour = parseInt(sendTime.split(':')[0], 10)
            return currentHour === sendHour
        }

        case 'weekday_schedule': {
            const weekdays = rule.config.weekdays || []
            const time = rule.config.time || '12:00'
            const sendHour = parseInt(time.split(':')[0], 10)
            return weekdays.includes(currentWeekday) && currentHour === sendHour
        }

        case 'inactivity': {
            // Run inactivity checks once per day at 10:00
            const checkHour = rule.config.check_hour ?? 10
            return currentHour === checkHour
        }

        case 'custom': {
            // Custom rules can have various triggers
            if (rule.config.always_run) return true
            return false
        }

        default:
            return false
    }
}

// Get passes that match the rule criteria
async function getTargetPasses(
    supabase: any,
    rule: AutomationRule,
    todayMonthDay: string
): Promise<Pass[]> {
    let query = supabase
        .from('passes')
        .select('id, push_token, current_state, customer_name, customer_birthday, deleted_at')
        .eq('campaign_id', rule.campaign_id)
        .is('deleted_at', null)

    switch (rule.rule_type) {
        case 'birthday': {
            const daysBefore = rule.config.days_before || 0

            // Calculate target date (today + days_before)
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + daysBefore)
            const targetMonthDay = `${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`

            // Filter for matching birthdays
            const { data } = await query
            return (data || []).filter((pass: Pass) => {
                if (!pass.customer_birthday) return false
                const birthday = pass.customer_birthday.substring(5) // Get MM-DD part
                return birthday === targetMonthDay
            })
        }

        case 'weekday_schedule': {
            // All active passes for this campaign
            const { data } = await query
            return data || []
        }

        case 'inactivity': {
            const daysInactive = rule.config.days_inactive || 14
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

            // Get passes and check their last scan
            const { data: passes } = await query

            const inactivePasses: Pass[] = []
            for (const pass of (passes || [])) {
                const { data: lastScan } = await supabase
                    .from('scans')
                    .select('created_at')
                    .eq('pass_id', pass.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                const lastActivity = lastScan?.created_at
                    ? new Date(lastScan.created_at)
                    : new Date(0)

                if (lastActivity < cutoffDate) {
                    inactivePasses.push(pass)
                }
            }

            return inactivePasses
        }

        case 'custom': {
            const { data } = await query
            return data || []
        }

        default:
            return []
    }
}

// Generate personalized message with placeholders
function generateMessage(template: string, pass: Pass): string {
    const state = pass.current_state || {}

    return template
        .replace(/\{\{name\}\}/gi, pass.customer_name || 'Kunde')
        .replace(/\{\{stamps\}\}/gi, String(state.stamps || 0))
        .replace(/\{\{points\}\}/gi, String(state.points || 0))
        .replace(/\{\{max_stamps\}\}/gi, String(state.max_stamps || 10))
        .replace(/\{\{reward\}\}/gi, state.reward || 'Belohnung')
        .replace(/\{\{customer_number\}\}/gi, state.customer_number || '')
}

// Send APNS push notification (simplified - uses pass update trigger)
async function sendPushNotification(pushToken: string, message: string): Promise<void> {
    // The actual push is sent via the pass update mechanism
    // When current_state changes, Apple Wallet fetches the updated pass
    // This is handled by the existing /api/v1/passes endpoint
    console.log(`[Automation] Push triggered for token: ${pushToken.substring(0, 8)}...`)
}
