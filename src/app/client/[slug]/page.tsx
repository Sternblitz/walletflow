import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, QrCode, Activity, ArrowUpRight, TrendingUp } from "lucide-react"

export default async function ClientDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Fetch Client & Campaign Info
    const { data: client, error } = await supabase
        .from('clients')
        .select(`
            *,
            campaigns (
                id,
                name,
                concept,
                passes (count),
                scans (count)
            )
        `)
        .eq('slug', slug)
        .single()

    if (error || !client) {
        return <div className="p-8 text-white">Client not found</div>
    }

    const campaign = client.campaigns?.[0]
    if (!campaign) {
        return <div className="p-8 text-white">No active campaign found for this client.</div>
    }

    // 2. Fetch Recent Activity (Last 10 Scans)
    const { data: recentScans } = await supabase
        .from('scans')
        .select(`
            id,
            created_at,
            action_type,
            delta_value,
            passes (serial_number)
        `)
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
        .limit(10)

    // 3. Setup Stats
    const totalPasses = campaign.passes?.[0]?.count || 0
    const totalScans = campaign.scans?.[0]?.count || 0

    // Calculate Today's Scans
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // (This would be better done with a specific query, but for MVP fetching latest 10 is okay, 
    // or we can do a count query. Let's do a quick separate count for today)
    const { count: scansToday } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .gte('created_at', todayStart.toISOString())

    return (
        <div className="min-h-screen bg-zinc-950 text-white pb-20">
            {/* Header */}
            <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">{client.name}</h1>
                        <p className="text-xs text-zinc-500">Dashboard</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold">
                        {client.name.substring(0, 2).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">

                {/* Main Action: Validierung */}
                <Link
                    href={`/pos/${slug}`}
                    className="block w-full p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg shadow-green-900/20 active:scale-95 transition-all text-center group"
                >
                    <div className="flex justify-center mb-3">
                        <div className="p-3 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                            <QrCode size={32} />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mb-1">Scanner öffnen</h2>
                    <p className="text-white/80 text-sm">Kundenkarten scannen & stempeln</p>
                </Link>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                            <Users size={16} />
                            <span className="text-xs font-medium">Kunden</span>
                        </div>
                        <div className="text-2xl font-bold">{totalPasses}</div>
                        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <TrendingUp size={12} />
                            <span>Gesamt</span>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                            <Activity size={16} />
                            <span className="text-xs font-medium">Scans Heute</span>
                        </div>
                        <div className="text-2xl font-bold">{scansToday || 0}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                            {totalScans} Gesamt
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-zinc-400 text-sm uppercase tracking-wider">Letzte Aktivitäten</h3>

                    <div className="space-y-2">
                        {(!recentScans || recentScans.length === 0) && (
                            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                                Noch keine Scans vorhanden
                            </div>
                        )}

                        {recentScans?.map((scan) => (
                            <div key={scan.id} className="bg-zinc-900/30 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                                        {scan.action_type === 'ADD_STAMP' && '🧁'}
                                        {scan.action_type === 'REDEEM' && '🎁'}
                                        {scan.action_type === 'CHECK_IN' && '📍'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">
                                            {scan.action_type === 'ADD_STAMP' && 'Stempel gesammelt'}
                                            {scan.action_type === 'REDEEM' && 'Prämie eingelöst'}
                                            {scan.action_type === 'CHECK_IN' && 'Check-In'}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {new Date(scan.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                                            • Pass ...{Array.isArray(scan.passes) ? scan.passes[0]?.serial_number.slice(-4) : (scan.passes as any)?.serial_number?.slice(-4)}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-sm font-bold ${scan.delta_value > 0 ? 'text-green-500' : 'text-amber-500'
                                    }`}>
                                    {scan.delta_value > 0 ? '+' : ''}{scan.delta_value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
