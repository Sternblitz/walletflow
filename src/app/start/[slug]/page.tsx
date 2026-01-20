import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getStartURL } from "@/lib/domain-urls"
import { WalletDownloadButton } from "./wallet-download-button"

export default async function SmartLinkPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Fetch Client & Active Campaign
    const { data: client, error } = await supabase
        .from('clients')
        .select('id, name, logo_url, campaigns(id, config, design_assets)')
        .eq('slug', slug)
        .single()

    if (error || !client || !client.campaigns || client.campaigns.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-10 text-center">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
                    <p className="text-gray-400">This link may be inactive or expired.</p>
                </div>
            </div>
        )
    }

    const campaign = client.campaigns[0]
    const campaignConfig = campaign.config || {}
    const designAssets = campaign.design_assets || {}

    // Extract colors from design
    const bgColor = designAssets.colors?.backgroundColor || '#1A1A1A'
    const fgColor = designAssets.colors?.foregroundColor || '#FFFFFF'

    // 2. Detect Device (Removed auto-redirect to enforce consent)
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || ""

    // 5. Desktop Fallback (The Landing Page)
    const smartLinkUrl = getStartURL(slug)

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-8"
            style={{ backgroundColor: bgColor, color: fgColor }}
        >
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative z-10">
                {/* Logo */}
                {client.logo_url && (
                    <img
                        src={client.logo_url}
                        alt={client.name}
                        className="w-24 h-24 mx-auto mb-4 rounded-2xl object-cover"
                    />
                )}

                <h1 className="text-4xl font-bold mb-2">{client.name}</h1>
                <p className="text-gray-400 mb-8">Scanne diesen Code mit deinem Smartphone</p>
            </div>

            {/* QR Code Box */}
            <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl hidden sm:block">
                <div className="w-64 h-64 flex items-center justify-center">
                    {/* Real QR Code - using a popular QR service */}
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(smartLinkUrl)}`}
                        alt="QR Code"
                        className="w-full h-full"
                    />
                </div>
                <p className="text-gray-500 text-sm mt-4 font-mono">{slug}</p>
            </div>

            {/* Platform Buttons & Consent Flow */}
            <div className="relative z-10 w-full mt-4">
                <WalletDownloadButton
                    campaignId={campaign.id}
                    merchantId={client.id}
                    designColors={{ bgColor, fgColor }}
                />
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-8 text-gray-500 text-sm">
                <p>Powered by <span className="font-semibold">QARD</span></p>
            </div>
        </div>
    )
}
