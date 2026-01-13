import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users, Clock, ChevronRight, Stamp, CreditCard, Gift, ArrowUpRight, Smartphone, Activity, Send } from "lucide-react"
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

async function getCampaigns(): Promise<Campaign[]> {
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
        return []
    }

    // 2. Fetch active install counts
    const campaignsWithCounts = await Promise.all(
        (campaigns || []).map(async (campaign: any) => {
            const { count: installedCount } = await supabase
                .from('passes')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .or('verification_status.eq.verified,is_installed_on_ios.eq.true,is_installed_on_android.eq.true')

            return {
                ...campaign,
                _installedCount: installedCount || 0
            }
        })
    )

    return campaignsWithCounts as unknown as Campaign[]
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
    const campaigns = await getCampaigns()

    // Calculate Aggregate Stats
    const totalCampaigns = campaigns.length
    const totalInstalls = campaigns.reduce((acc, curr) => acc + (curr._installedCount || 0), 0)
    const activeCampaigns = campaigns.filter(c => c.is_active).length

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 p-6 md:p-8 pt-6">

            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-zinc-400">Willkommen zurück. Hier ist der Überblick über deine Kampagnen.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/push-requests">
                        <Button className="bg-zinc-800 text-white hover:bg-zinc-700 h-11 px-6 rounded-full font-medium transition-all hover:scale-105 active:scale-95 border border-white/10">
                            <Send className="mr-2 h-4 w-4" /> Push Requests
                        </Button>
                    </Link>
                    <Link href="/admin/create">
                        <Button className="bg-white text-black hover:bg-zinc-200 h-11 px-6 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <Plus className="mr-2 h-4 w-4" /> Neue Kampagne
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-purple-400">
                            <Smartphone className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wider">Installationen</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{totalInstalls}</div>
                        <div className="text-sm text-zinc-500 mt-1">Aktive Wallet Pässe</div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-green-400">
                            <Activity className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wider">Aktiv</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{activeCampaigns}</div>
                        <div className="text-sm text-zinc-500 mt-1">Laufende Kampagnen</div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-blue-400">
                            <Users className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wider">Datenbank</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{totalCampaigns}</div>
                        <div className="text-sm text-zinc-500 mt-1">Gesamt Kampagnen</div>
                    </div>
                </div>
            </div>

            {/* Campaigns Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Deine Kampagnen</h2>
                </div>

                {campaigns.length === 0 ? (
                    <div className="h-64 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4 bg-white/5">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                            <Plus className="w-8 h-8 text-zinc-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">Keine Kampagnen</h3>
                            <p className="text-zinc-500 max-w-sm mt-1">Erstelle deine erste Wallet Kampagne und starte durch.</p>
                        </div>
                        <Link href="/admin/create">
                            <Button className="bg-white text-black hover:bg-zinc-200">
                                Erste Kampagne erstellen
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {campaigns.map((campaign) => (
                            <Link
                                href={`/admin/campaign/${campaign.id}`}
                                key={campaign.id}
                                className="group block relative"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-transparent to-white/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                                <div className="relative bg-zinc-900 border border-white/10 rounded-2xl p-6 h-full transition-transform duration-300 group-hover:-translate-y-1">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 sticky-icon transition-colors group-hover:bg-white/10 group-hover:border-white/20">
                                                {getConceptIcon(campaign.concept)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">{campaign.name}</h3>
                                                <p className="text-sm text-zinc-500">{campaign.client?.name || 'Unbekannter Kunde'}</p>
                                            </div>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${campaign.is_active ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-zinc-700'}`} />
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Installationen</div>
                                            <div className="text-xl font-bold text-white flex items-center gap-2">
                                                {campaign._installedCount}
                                                <Smartphone className="w-3 h-3 text-zinc-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Typ</div>
                                            <div className="text-sm font-medium text-zinc-300 bg-white/5 self-start inline-block px-2 py-1 rounded-md border border-white/5">
                                                {getConceptLabel(campaign.concept)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                                        <div className="text-xs text-zinc-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(campaign.created_at).toLocaleDateString()}
                                        </div>
                                        <span className="text-xs font-medium text-zinc-500 group-hover:text-white transition-colors flex items-center gap-1">
                                            Verwalten <ArrowUpRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
