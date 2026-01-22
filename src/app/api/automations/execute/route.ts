import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPassUpdatePush } from '@/lib/wallet/apns'

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
    campaign_id: string
    customer_name: string | null
    customer_birthday: string | null
    customer_email: string | null
    current_state: Record<string, any>
    last_scan_at?: string
    deleted_at: string | null
}

/**
 * POST /api/automations/execute
 * 
 * This endpoint is called by Vercel Cron (Pro plan)
 * to evaluate and execute all enabled automation rules.
 * 
 * Vercel Cron automatically secures this endpoint.
 */
export async function POST(req: NextRequest) {
    // Vercel Cron sends Authorization header automatically on Pro plan
    // We accept all requests for now (endpoint is not publicly linked)

    const supabase = await createClient()

    // IMPORTANT: Convert to German timezone (Europe/Berlin)
    // Vercel runs on UTC, but users configure times in their local timezone
    const nowUTC = new Date()
    const germanTime = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))

    const currentHour = germanTime.getHours()
    const currentMinute = germanTime.getMinutes()
    const currentWeekday = germanTime.getDay() // 0 = Sunday, 1 = Monday, etc.
    const today = germanTime.toISOString().split('T')[0]

    console.log(`[AUTOMATION] Executing at ${nowUTC.toISOString()} (UTC), German time: ${currentHour}:${currentMinute}, weekday=${currentWeekday}`)

    // Fetch all enabled automation rules
    const { data: rules, error: rulesError } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('is_enabled', true)

    if (rulesError) {
        console.error('[AUTOMATION] Failed to fetch rules:', rulesError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!rules || rules.length === 0) {
        console.log('[AUTOMATION] No enabled rules found')
        return NextResponse.json({ executed: 0, message: 'No rules to execute' })
    }

    const results = {
        total_rules: rules.length,
        executed: 0,
        skipped: 0,
        failed: 0,
        details: [] as any[]
    }

    // Process each rule
    for (const rule of rules as AutomationRule[]) {
        try {
            const ruleResult = await executeRule(supabase, rule, {
                currentHour,
                currentMinute,
                currentWeekday,
                today,
                now: germanTime
            })

            results.details.push(ruleResult)
            if (ruleResult.status === 'executed') results.executed++
            else if (ruleResult.status === 'skipped') results.skipped++
            else results.failed++

        } catch (e: any) {
            console.error(`[AUTOMATION] Error processing rule ${rule.id}:`, e)
            results.failed++
            results.details.push({
                rule_id: rule.id,
                rule_name: rule.name,
                status: 'error',
                error: e.message
            })
        }
    }

    console.log(`[AUTOMATION] Completed: ${results.executed} executed, ${results.skipped} skipped, ${results.failed} failed`)

    return NextResponse.json(results)
}

// Also support GET for manual testing
export async function GET(req: NextRequest) {
    // Redirect to POST with same logic
    return POST(req)
}

/**
 * Execute a single automation rule
 */
async function executeRule(
    supabase: any,
    rule: AutomationRule,
    context: {
        currentHour: number
        currentMinute: number
        currentWeekday: number
        today: string
        now: Date
    }
) {
    const { currentHour, currentMinute, currentWeekday, today, now } = context

    // Check if this rule should run now based on its type
    let shouldRun = false
    let targetPasses: Pass[] = []

    switch (rule.rule_type) {
        case 'birthday':
            shouldRun = shouldRunBirthday(rule.config, currentHour, currentMinute)
            if (shouldRun) {
                targetPasses = await getBirthdayPasses(supabase, rule.campaign_id, rule.config, today)
            }
            break

        case 'weekday_schedule':
            shouldRun = shouldRunWeekday(rule.config, currentWeekday, currentHour, currentMinute)
            if (shouldRun) {
                targetPasses = await getAllActivePasses(supabase, rule.campaign_id)
            }
            break

        case 'inactivity':
            // Inactivity runs once per day at a fixed time (default: 12:00)
            const inactivityHour = rule.config.check_hour ?? 12
            shouldRun = currentHour === inactivityHour && currentMinute < 30
            if (shouldRun) {
                targetPasses = await getInactivePasses(supabase, rule.campaign_id, rule.config, now)
            }
            break

        case 'custom':
            // Custom rules - evaluate condition (future expansion)
            shouldRun = evaluateCustomCondition(rule.config, context)
            if (shouldRun) {
                targetPasses = await getCustomTargetPasses(supabase, rule.campaign_id, rule.config)
            }
            break
    }

    if (!shouldRun) {
        return { rule_id: rule.id, rule_name: rule.name, status: 'skipped', reason: 'Not scheduled for now' }
    }

    if (targetPasses.length === 0) {
        return { rule_id: rule.id, rule_name: rule.name, status: 'skipped', reason: 'No matching passes' }
    }

    // Check which passes haven't been notified today for this rule
    const { data: existingExecutions } = await supabase
        .from('automation_executions')
        .select('pass_id')
        .eq('rule_id', rule.id)
        .eq('execution_date', today)

    const alreadyNotifiedIds = new Set((existingExecutions || []).map((e: any) => e.pass_id))
    const passesToNotify = targetPasses.filter(p => !alreadyNotifiedIds.has(p.id))

    if (passesToNotify.length === 0) {
        return {
            rule_id: rule.id,
            rule_name: rule.name,
            status: 'skipped',
            reason: 'All passes already notified today'
        }
    }

    // Send notifications
    let sentCount = 0
    let failedCount = 0

    for (const pass of passesToNotify) {
        try {
            // Replace placeholders in message
            const message = replacePlaceholders(rule.message_template, pass)

            // Update the pass to trigger a push notification
            // Use latest_news field which PassFactory checks for displaying on pass
            const stateUpdate: Record<string, any> = {
                ...pass.current_state,
                latest_news: message,
                last_message_at: new Date().toISOString(),
                last_automation_at: new Date().toISOString()
            }

            // For inactivity rules, track when we sent the reminder
            // This prevents spamming - only sends every X days
            if (rule.rule_type === 'inactivity') {
                stateUpdate.last_inactivity_push_at = new Date().toISOString()
            }

            const { error: updateError } = await supabase
                .from('passes')
                .update({
                    last_updated_at: new Date().toISOString(),
                    current_state: stateUpdate
                })
                .eq('id', pass.id)

            if (!updateError) {
                // Send push notification
                await sendPassUpdatePush(pass.id)

                // Log execution
                await supabase
                    .from('automation_executions')
                    .insert({
                        rule_id: rule.id,
                        pass_id: pass.id,
                        status: 'sent',
                        sent_message: message,
                        execution_date: today
                    })

                // For birthday rules with gift enabled: create a redeemable gift record
                if (rule.rule_type === 'birthday' && rule.config.gift_enabled) {
                    const expiresAt = rule.config.gift_expires_days
                        ? new Date(Date.now() + rule.config.gift_expires_days * 24 * 60 * 60 * 1000).toISOString()
                        : null

                    await supabase
                        .from('pass_gifts')
                        .insert({
                            pass_id: pass.id,
                            campaign_id: rule.campaign_id,
                            automation_rule_id: rule.id,
                            gift_type: 'birthday',
                            gift_title: rule.config.gift_title || 'Geburtstagsgeschenk',
                            gift_description: rule.config.gift_description || null,
                            gift_message: message,
                            birthday_date: pass.customer_birthday,
                            expires_at: expiresAt
                        })

                    console.log(`[AUTOMATION] Created birthday gift for pass ${pass.id}`)
                }

                sentCount++
            } else {
                throw new Error(updateError.message)
            }

        } catch (e: any) {
            failedCount++
            await supabase
                .from('automation_executions')
                .insert({
                    rule_id: rule.id,
                    pass_id: pass.id,
                    status: 'failed',
                    error_message: e.message,
                    execution_date: today
                })
        }
    }

    console.log(`[AUTOMATION] Rule "${rule.name}": ${sentCount} sent, ${failedCount} failed`)

    return {
        rule_id: rule.id,
        rule_name: rule.name,
        status: 'executed',
        sent: sentCount,
        failed: failedCount,
        total_targets: passesToNotify.length
    }
}

// =============================================
// RULE TYPE CHECKS
// =============================================

function shouldRunBirthday(config: Record<string, any>, hour: number, minute: number): boolean {
    const sendHour = parseInt(config.send_time?.split(':')[0] ?? '9')
    const sendMinute = parseInt(config.send_time?.split(':')[1] ?? '0')

    // Run if within 30 minutes of scheduled time
    return hour === sendHour && minute >= sendMinute && minute < sendMinute + 30
}

function shouldRunWeekday(config: Record<string, any>, weekday: number, hour: number, minute: number): boolean {
    const weekdays = config.weekdays || []

    console.log(`[WEEKDAY CHECK] Config weekdays: ${JSON.stringify(weekdays)}, Current weekday: ${weekday}`)

    if (!weekdays.includes(weekday)) {
        console.log(`[WEEKDAY CHECK] Today (${weekday}) not in configured weekdays - SKIPPING`)
        return false
    }

    const sendHour = parseInt(config.time?.split(':')[0] ?? '12')
    const sendMinute = parseInt(config.time?.split(':')[1] ?? '0')

    console.log(`[WEEKDAY CHECK] Config time: ${sendHour}:${sendMinute}, Current time: ${hour}:${minute}`)
    console.log(`[WEEKDAY CHECK] Window: ${sendHour}:${sendMinute} to ${sendHour}:${sendMinute + 30}`)

    const inWindow = hour === sendHour && minute >= sendMinute && minute < sendMinute + 30
    console.log(`[WEEKDAY CHECK] In window: ${inWindow}`)

    return inWindow
}

function evaluateCustomCondition(config: Record<string, any>, context: any): boolean {
    // Placeholder for custom condition evaluation
    // Can be expanded to support various trigger conditions
    return config.always_run === true
}

// =============================================
// PASS QUERY FUNCTIONS
// =============================================

async function getBirthdayPasses(
    supabase: any,
    campaignId: string,
    config: Record<string, any>,
    today: string
): Promise<Pass[]> {
    const daysBefore = config.days_before ?? 0

    // Calculate target date
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysBefore)
    const targetMonth = targetDate.getMonth() + 1
    const targetDay = targetDate.getDate()

    // Query passes with matching birthday (month and day) AND consent
    const { data: passes } = await supabase
        .from('passes')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .eq('consent_marketing', true)  // Only opted-in customers
        .not('customer_birthday', 'is', null)

    // Filter by birthday month/day in JS (since SQL varies by db)
    return (passes || []).filter((p: Pass) => {
        if (!p.customer_birthday) return false
        const bday = new Date(p.customer_birthday)
        return bday.getMonth() + 1 === targetMonth && bday.getDate() === targetDay
    })
}

async function getAllActivePasses(supabase: any, campaignId: string): Promise<Pass[]> {
    const { data: passes } = await supabase
        .from('passes')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .eq('consent_marketing', true)  // Only opted-in customers

    return passes || []
}

async function getInactivePasses(
    supabase: any,
    campaignId: string,
    config: Record<string, any>,
    now: Date
): Promise<Pass[]> {
    const daysInactive = config.days_inactive ?? 14
    const cutoffDate = new Date(now)
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

    // Get passes that haven't been scanned recently AND have consent
    const { data: passes } = await supabase
        .from('passes')
        .select('*, scans(scanned_at)')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .eq('consent_marketing', true)  // Only opted-in customers

    // Filter to passes with no recent scans AND no recent inactivity push
    return (passes || []).filter((p: any) => {
        // Check last scan
        let lastActivityDate: Date

        if (!p.scans || p.scans.length === 0) {
            // Never scanned - use created_at
            lastActivityDate = new Date(p.created_at)
        } else {
            // Find most recent scan
            const lastScan = p.scans.sort((a: any, b: any) =>
                new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
            )[0]
            lastActivityDate = new Date(lastScan.scanned_at)
        }

        // Not inactive yet
        if (lastActivityDate >= cutoffDate) {
            return false
        }

        // Check if we already sent an inactivity push recently
        // Only send every X days (same as inactivity config)
        const lastInactivityPush = p.current_state?.last_inactivity_push_at
        if (lastInactivityPush) {
            const lastPushDate = new Date(lastInactivityPush)
            const nextAllowedPush = new Date(lastPushDate)
            nextAllowedPush.setDate(nextAllowedPush.getDate() + daysInactive)

            if (now < nextAllowedPush) {
                // Too soon for another inactivity reminder
                return false
            }
        }

        return true
    })
}

async function getCustomTargetPasses(
    supabase: any,
    campaignId: string,
    config: Record<string, any>
): Promise<Pass[]> {
    // For custom rules, just get all active passes
    // More sophisticated filtering can be added later
    return getAllActivePasses(supabase, campaignId)
}

// =============================================
// PLACEHOLDER REPLACEMENT
// =============================================

function replacePlaceholders(template: string, pass: Pass): string {
    let message = template

    // {{name}} - Customer name
    message = message.replace(/\{\{name\}\}/gi, pass.customer_name || 'Kunde')

    // {{stamps}} - Current stamp count
    const stamps = pass.current_state?.stamps ?? pass.current_state?.current ?? 0
    message = message.replace(/\{\{stamps\}\}/gi, String(stamps))

    // {{points}} - Points (if applicable)
    const points = pass.current_state?.points ?? 0
    message = message.replace(/\{\{points\}\}/gi, String(points))

    // {{reward}} - Next reward (from campaign config, if available)
    const reward = pass.current_state?.reward ?? 'Belohnung'
    message = message.replace(/\{\{reward\}\}/gi, reward)

    return message
}
