import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users, Clock, ChevronRight, Stamp, CreditCard, Gift } from "lucide-react"
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

    // First get campaigns with basic info
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

    // For each campaign, get ACTUAL installed passes count
    // A pass is "installed" if it has a device_registration (Apple) or is_installed_on_android=true (Google)
    const campaignsWithCounts = await Promise.all(
        (campaigns || []).map(async (campaign: any) => {
            // Count passes that have device registrations (actually installed on Apple)
            const { count: appleCount } = await supabase
                .from('device_registrations')
                .select('pass_id', { count: 'exact', head: true })
                .in('pass_id', campaign.passes?.map((p: any) => p.id) || [])

            // Count passes installed on Android
            const { count: androidCount } = await supabase
                .from('passes')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .eq('is_installed_on_android', true)
                .eq('wallet_type', 'google')

            return {
                ...campaign,
                _installedCount: (appleCount || 0) + (androidCount || 0)
            }
        })
    )

    return campaignsWithCounts as unknown as Campaign[]
}

function getConceptIcon(concept: string) {
    switch (concept) {
        case 'STAMP_CARD':
        case 'STAMP_CARD_V2':
            return <Stamp className="w-5 h-5" />
        case 'MEMBER_CARD':
        case 'VIP_CLUB':
            return <CreditCard className="w-5 h-5" />
        case 'COUPON':
            return <Gift className="w-5 h-5" />
        default:
            return <CreditCard className="w-5 h-5" />
    }
}

function getConceptLabel(concept: string) {
    switch (concept) {
        case 'STAMP_CARD':
        case 'STAMP_CARD_V2':
            return 'Stempelkarte'
        case 'MEMBER_CARD':
            return 'Mitgliedskarte'
        case 'VIP_CLUB':
            return 'VIP Club'
        case 'COUPON':
            return 'Coupon'
        case 'POINTS_CARD':
            return 'Punkte'
        default:
            return concept
    }
}

export default async function DashboardPage() {
    const campaigns = await getCampaigns()

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dein Cockpit</h1>
                    <p className="text-zinc-400">Verwalte deine Kampagnen und kontaktiere Kunden.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/editor">
                        <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
                            ✨ Neuer Editor
                        </Button>
                    </Link>
                    <Link href="/admin/create">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-5 w-5" />
                            Kampagne starten
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Campaign List */}
            {campaigns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
                    <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-white/10 mb-4">
                            <Plus className="h-10 w-10 text-zinc-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">Bereit für den Start?</h3>
                        <p className="mb-4 mt-2 text-sm text-zinc-400">
                            Erstelle deine erste Wallet-Kampagne für einen Kunden.
                        </p>
                        <Link href="/admin/create">
                            <Button variant="secondary">Jetzt erste Kampagne erstellen</Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white/80">Deine Kampagnen</h2>

                    <div className="grid gap-4">
                        {campaigns.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={`/admin/campaign/${campaign.id}`}
                                className="group block"
                            >
                                <div className="flex items-center justify-between p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all">
                                    {/* Left Side */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white">
                                            {getConceptIcon(campaign.concept)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                                                    {campaign.client?.name || campaign.name}
                                                </h3>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                                                    {getConceptLabel(campaign.concept)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {campaign._installedCount ?? campaign.passes?.length ?? 0} Kunden
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(campaign.created_at).toLocaleDateString('de-DE')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side */}
                                    <div className="flex items-center gap-3">
                                        {campaign.is_active ? (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
                                                Aktiv
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-500/20 text-zinc-400 font-medium">
                                                Inaktiv
                                            </span>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
