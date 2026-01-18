'use client'

import { useState, useEffect } from 'react'
import { Zap, Gift, Users, Send, Bell, Clock } from 'lucide-react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

interface Activity {
    id: string
    type: 'stamp' | 'redeem' | 'new_customer' | 'push_sent' | 'push_request'
    message: string
    timestamp: string
}

interface LiveActivityFeedProps {
    campaignId: string
}

export function LiveActivityFeed({ campaignId }: LiveActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const supabase = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                )

                // Fetch recent scans
                const { data: scans } = await supabase
                    .from('scans')
                    .select('id, action_type, created_at, delta_value')
                    .eq('campaign_id', campaignId)
                    .order('created_at', { ascending: false })
                    .limit(15)

                // Fetch recent push requests
                const { data: pushes } = await supabase
                    .from('push_requests')
                    .select('id, message, status, created_at, sent_at')
                    .eq('campaign_id', campaignId)
                    .order('created_at', { ascending: false })
                    .limit(10)

                // Fetch recent new passes
                const oneHourAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                const { data: newPasses } = await supabase
                    .from('passes')
                    .select('id, created_at')
                    .eq('campaign_id', campaignId)
                    .gte('created_at', oneHourAgo)
                    .order('created_at', { ascending: false })
                    .limit(10)

                // Combine and format activities
                const allActivities: Activity[] = []

                scans?.forEach(scan => {
                    allActivities.push({
                        id: `scan-${scan.id}`,
                        type: scan.action_type === 'REDEEM' ? 'redeem' : 'stamp',
                        message: scan.action_type === 'REDEEM'
                            ? 'Prämie eingelöst'
                            : `+${scan.delta_value || 1} Stempel`,
                        timestamp: scan.created_at
                    })
                })

                pushes?.forEach(push => {
                    allActivities.push({
                        id: `push-${push.id}`,
                        type: push.status === 'sent' ? 'push_sent' : 'push_request',
                        message: push.status === 'sent'
                            ? `Push gesendet: "${push.message?.substring(0, 30)}..."`
                            : `Push beantragt`,
                        timestamp: push.sent_at || push.created_at
                    })
                })

                newPasses?.forEach(pass => {
                    allActivities.push({
                        id: `pass-${pass.id}`,
                        type: 'new_customer',
                        message: 'Neuer Kunde registriert',
                        timestamp: pass.created_at
                    })
                })

                // Sort by timestamp
                allActivities.sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )

                setActivities(allActivities.slice(0, 20))
            } catch (e) {
                console.error('Failed to fetch activity:', e)
            } finally {
                setLoading(false)
            }
        }

        fetchActivity()

        // Poll every 30 seconds
        const interval = setInterval(fetchActivity, 30000)
        return () => clearInterval(interval)
    }, [campaignId])

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'stamp': return <Zap size={14} className="text-emerald-500" />
            case 'redeem': return <Gift size={14} className="text-purple-500" />
            case 'new_customer': return <Users size={14} className="text-blue-500" />
            case 'push_sent': return <Send size={14} className="text-violet-500" />
            case 'push_request': return <Bell size={14} className="text-amber-500" />
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        if (diffMins < 1) return 'Jetzt'
        if (diffMins < 60) return `vor ${diffMins}m`
        if (diffHours < 24) return `vor ${diffHours}h`
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    }

    return (
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-2xl p-4 h-full flex flex-col shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Feed
                </h3>
                <Clock size={12} className="text-zinc-400 dark:text-zinc-500" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-80 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs">
                        Noch keine Aktivitäten
                    </div>
                ) : (
                    activities.map(activity => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-black/30 rounded-lg border border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-black/40 transition-colors"
                        >
                            <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center shrink-0 shadow-sm dark:shadow-none">
                                {getActivityIcon(activity.type)}
                            </div>
                            <span className="text-xs text-zinc-600 dark:text-zinc-300 flex-1 truncate">
                                {activity.message}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0 font-mono">
                                {formatTime(activity.timestamp)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
