import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users, Clock, ChevronRight, Stamp, CreditCard, Gift, ArrowUpRight, Smartphone, Activity, Send, Zap, Bell, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Campaign {
    id: string
    name: string
    concept: string
    is_active: boolean
    created_at: string
    client: {
        name: string
        slug: string
    }
    passes: { id: string }[]
    _installedCount?: number
}

interface ActivityItem {
    id: string
    type: 'INSTALL' | 'PUSH' | 'CAMPAIGN'
    title: string
    subtitle: string
    timestamp: string
}

function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " Jahre"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " Monate"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " Tage"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " Std"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " Min"
    return Math.floor(seconds) + " Sek"
}

async function getDashboardData() {
    const supabase = await createClient()

    // 1. Fetch campaigns
    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select(`
            id,
            name,
            concept,
            is_active,
            created_at,
            client:clients(name, slug),
            passes(id)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching campaigns:', error)
        return { campaigns: [], stats: { total: 0, installs: 0, active: 0 }, activities: [] }
    }

    // 2. Fetch active install counts (Mocking exact count logic for speed if needed, but doing real count here)
    const campaignsWithCounts = await Promise.all(
        (campaigns || []).map(async (campaign: any) => {
            const { count } = await supabase
                .from('passes')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')

            return {
                ...campaign,
                _installedCount: count || 0
            }
        })
    )

    const totalInstalls = campaignsWithCounts.reduce((acc, curr) => acc + (curr._installedCount || 0), 0)
    const activeCampaigns = campaignsWithCounts.filter(c => c.is_active).length

    // 3. Fetch Recent Activities
    const [clientsRes, campaignsRes, pushesRes, automationsRes] = await Promise.all([
        supabase.from('clients')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('campaigns')
            .select('id, name, created_at, client:clients(name)')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('push_requests')
            .select('id, created_at, message, status, campaign:campaigns(client:clients(name))')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('automation_rules')
            .select('id, name, created_at, campaign:campaigns(client:clients(name))')
            .order('created_at', { ascending: false })
            .limit(5)
    ])

    let activities: any[] = []

    // Map Clients
    if (clientsRes.data) {
        activities.push(...clientsRes.data.map((c: any) => ({
            id: `client-${c.id}`,
            type: 'CLIENT',
            title: 'Neuer Kunde angelegt',
            subtitle: c.name,
            created_at: new Date(c.created_at)
        })))
    }

    // Map Campaigns
    if (campaignsRes.data) {
        activities.push(...campaignsRes.data.map((c: any) => ({
            id: `camp-${c.id}`,
            type: 'CAMPAIGN',
            title: 'Kampagne erstellt',
            subtitle: `${c.client?.name}: ${c.name}`,
            created_at: new Date(c.created_at)
        })))
    }

    // Map Pushes
    if (pushesRes.data) {
        activities.push(...pushesRes.data.map((p: any) => ({
            id: `push-${p.id}`,
            type: 'PUSH',
            title: 'Push Nachricht',
            subtitle: `${p.campaign?.client?.name || 'System'}: "${p.message}"`,
            created_at: new Date(p.created_at)
        })))
    }

    // Map Automations
    if (automationsRes.data) {
        activities.push(...automationsRes.data.map((a: any) => ({
            id: `auto-${a.id}`,
            type: 'AUTOMATION',
            title: 'Automation erstellt',
            subtitle: `${a.campaign?.client?.name || 'System'}: ${a.name}`,
            created_at: new Date(a.created_at)
        })))
    }

    // Sort and format
    const sortedActivities = activities
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, 10)
        .map(a => ({
            id: a.id,
            type: a.type as any,
            title: a.title,
            subtitle: a.subtitle,
            timestamp: `Vor ${timeAgo(a.created_at)}`
        }))


    return {
        campaigns: campaignsWithCounts as unknown as Campaign[],
        stats: {
            total: campaigns.length,
            installs: totalInstalls,
            active: activeCampaigns
        },
        activities: sortedActivities
    }
}

function getConceptIcon(concept: string) {
    const className = "w-5 h-5 text-white"
    switch (concept) {
        case 'STAMP_CARD':
        case 'STAMP_CARD_V2': return <Stamp className={className} />
        case 'MEMBER_CARD':
        case 'VIP_CLUB': return <CreditCard className={className} />
        case 'COUPON': return <Gift className={className} />
        default: return <CreditCard className={className} />
    }
}

function getConceptLabel(concept: string) {
    switch (concept) {
        case 'STAMP_CARD':
        case 'STAMP_CARD_V2': return 'Stempelkarte'
        case 'MEMBER_CARD': return 'Mitgliedskarte'
        case 'VIP_CLUB': return 'VIP Club'
        case 'COUPON': return 'Coupon'
        case 'POINTS_CARD': return 'Punkte'
        default: return concept
    }
}

export default async function DashboardPage() {
    const { campaigns, stats, activities } = await getDashboardData()

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-8 pt-6 space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Cockpit</h1>
                    <p className="text-zinc-400">Übersicht über alle Aktivitäten und Kampagnen der Agency.</p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900/50 p-1 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="px-4 py-1.5 text-xs font-medium text-green-400 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Online
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Stats & Quick Actions */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/admin/create" className="group">
                            <div className="bg-zinc-900 border border-white/10 hover:border-white/20 p-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 h-full flex flex-col justify-between">
                                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div className="font-semibold text-white">Neuer Kunde</div>
                                <div className="text-xs text-zinc-500 mt-1">Leg einen neuen Mandanten an.</div>
                            </div>
                        </Link>
                        <Link href="/admin/push-requests" className="group">
                            <div className="bg-zinc-900 border border-white/10 hover:border-white/20 p-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 h-full flex flex-col justify-between">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div className="font-semibold text-white">Push Senden</div>
                                <div className="text-xs text-zinc-500 mt-1">Nachricht an alle Pässe.</div>
                            </div>
                        </Link>
                        <Link href="/admin/automations" className="group">
                            <div className="bg-zinc-900 border border-white/10 hover:border-white/20 p-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/10 h-full flex flex-col justify-between">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div className="font-semibold text-white">Automation</div>
                                <div className="text-xs text-zinc-500 mt-1">Workflows verwalten.</div>
                            </div>
                        </Link>
                        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center text-center opacity-60">
                            <div className="text-sm font-medium text-zinc-500">Mehr Aktionen</div>
                            <div className="text-xs text-zinc-600">Bald verfügbar</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Smartphone className="w-16 h-16 text-white" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-green-500/20 text-green-400">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Installationen</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats.installs}</div>
                            <div className="flex items-center gap-1 text-xs text-green-500">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Alle aktiven Pässe</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Activity className="w-16 h-16 text-white" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Aktive Kampagnen</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats.active}</div>
                            <div className="text-xs text-zinc-500">von {stats.total} Gesamt</div>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Users className="w-16 h-16 text-white" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                                    <Users className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Kunden</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{campaigns.length}</div>
                            <div className="text-xs text-zinc-500">Agentur Bestand</div>
                        </div>
                    </div>

                    {/* Recent Campaigns Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-semibold text-white">Letzte Kampagnen</h2>
                            <Link href="/admin/clients" className="text-xs font-medium text-zinc-400 hover:text-white flex items-center transition-colors">
                                Alle anzeigen <ChevronRight className="w-3 h-3 ml-1" />
                            </Link>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                            {campaigns.slice(0, 5).map((campaign, i) => (
                                <div key={campaign.id} className={`flex items-center p-4 hover:bg-white/5 transition-colors ${i !== campaigns.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/5 mr-4">
                                        {getConceptIcon(campaign.concept)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-medium text-white truncate">{campaign.name}</h3>
                                            {campaign.is_active && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">{campaign.client?.name}</p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-6 mr-6">
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider">Installiert</div>
                                            <div className="text-sm font-bold text-white">{campaign._installedCount}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider">Typ</div>
                                            <div className="text-xs font-medium text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                {getConceptLabel(campaign.concept)}
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/admin/campaign/${campaign.id}`}>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                            {campaigns.length === 0 && (
                                <div className="p-8 text-center text-zinc-500">
                                    Keine Kampagnen gefunden.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Activity Feed */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-md sticky top-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-zinc-400" />
                            <h2 className="text-lg font-semibold text-white">Live Feed</h2>
                        </div>

                        {activities.length > 0 ? (
                            <div className="space-y-6 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

                                {activities.map((item) => (
                                    <div key={item.id} className="relative flex gap-4 group">
                                        <div className="relative z-10 w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform group-hover:border-white/30 shadow-lg">
                                            {item.type === 'INSTALL' && <Smartphone className="w-4 h-4 text-green-400" />}
                                            {item.type === 'PUSH' && <Send className="w-4 h-4 text-blue-400" />}
                                            {item.type === 'CAMPAIGN' && <Plus className="w-4 h-4 text-purple-400" />}
                                        </div>
                                        <div className="flex-1 py-0.5">
                                            <p className="text-sm font-medium text-white group-hover:text-zinc-200 transition-colors">{item.title}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.subtitle}</p>
                                            <p className="text-[10px] text-zinc-600 mt-1 font-mono">{item.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                Keine Aktivitäten verzeichnet.
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <Button variant="outline" className="w-full text-xs h-9 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white">
                                Alle Aktivitäten anzeigen
                            </Button>
                        </div>
                    </div>

                    {/* System Status / Mini Widget */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-900/10 border border-green-500/10 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-green-100">Automation Engine</div>
                                <div className="text-xs text-green-500/70">Running normally</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
