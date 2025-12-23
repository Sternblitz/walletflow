import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SmartLinkPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Fetch Client & Active Campaign
    const { data: client, error } = await supabase.from('clients').select('id, name, campaigns(id, config)').eq('slug', slug).single()

    if (error || !client || !client.campaigns || client.campaigns.length === 0) {
        return <div className="p-10 text-center">Campaign inactive or not found.</div>
    }

    const campaign = client.campaigns[0] // Taking the first one for MVP

    // 2. Detect Device
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || ""

    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)

    // 3. Auto-Redirect Logic
    if (isIOS) {
        // Redirect to API that generates .pkpass
        redirect(`/api/pass/issue?campaignId=${campaign.id}&platform=ios`)
    }

    if (isAndroid) {
        // Redirect to API that generates Google Save Link
        redirect(`/api/pass/issue?campaignId=${campaign.id}&platform=android`)
    }

    // 4. Desktop Fallback (The Landing Page)
    const smartLinkUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://passify.io'}/start/${slug}`

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-8 bg-black text-white">
            <div>
                <h1 className="text-4xl font-bold mb-2">{client.name}</h1>
                <p className="text-muted-foreground">Get your digital pass now.</p>
            </div>

            <div className="bg-white p-4 rounded-xl">
                {/* Real QR Code would go here. For now, visual placeholder. */}
                <div className="w-64 h-64 bg-black/10 flex items-center justify-center text-black font-mono text-xs text-center border-2 border-dashed border-black/20">
                    SCAN TO ADD<br />TO WALLET
                </div>
            </div>

            <div className="flex flex-col gap-4 items-center">
                <p className="max-w-md text-sm text-gray-400">
                    Scan this code with your iPhone or Android camera to add the pass to your wallet.
                </p>

                {/* DEBUG BUTTON FOR DESKTOP TESTING */}
                <a
                    href={`/api/pass/issue?campaignId=${campaign.id}&platform=ios`}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors"
                >
                    Test Download (iOS .pkpass)
                </a>
            </div>
        </div>
    )
}
