import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getStartURL } from "@/lib/domain-urls"

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

    // 2. Detect Device
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || ""

    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)

    // 3. Check if personalization is required
    const personalization = campaignConfig.personalization || {}
    const requiresOnboarding = personalization.enabled && (
        personalization.ask_name ||
        personalization.ask_birthday ||
        personalization.ask_email ||
        personalization.ask_phone
    )

    // 4. Auto-Redirect Logic for Mobile
    // Redirects need full path because middleware rewrites happen AFTER redirect
    // NOTE: Direct redirects skip consent popup, default to consent_marketing=true
    if (isIOS) {
        if (requiresOnboarding) {
            redirect(`/start/${slug}/onboarding?campaignId=${campaign.id}&platform=ios&clientId=${client.id}`)
        }
        redirect(`/api/pass/issue?campaignId=${campaign.id}&platform=ios&consent_marketing=true&consent_source=direct_mobile`)
    }

    if (isAndroid) {
        if (requiresOnboarding) {
            redirect(`/start/${slug}/onboarding?campaignId=${campaign.id}&platform=android&clientId=${client.id}`)
        }
        redirect(`/api/pass/issue?campaignId=${campaign.id}&platform=android&consent_marketing=true&consent_source=direct_mobile`)
    }

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
            <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl">
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

            {/* Platform Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center mt-4">
                <Link
                    href={`/api/pass/issue?campaignId=${campaign.id}&platform=ios&consent_marketing=true&consent_source=desktop`}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple Wallet
                </Link>
                <Link
                    href={`/api/pass/issue?campaignId=${campaign.id}&platform=android&consent_marketing=true&consent_source=desktop`}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.523 2.047a.5.5 0 0 0-.77-.064l-2.342 2.342a8.46 8.46 0 0 0-4.822 0L7.247 1.983a.5.5 0 0 0-.77.064 9.96 9.96 0 0 0-2.452 6.538V20.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-2.465a8.46 8.46 0 0 0 7.95 0V20.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V8.585a9.96 9.96 0 0 0-2.452-6.538z" />
                    </svg>
                    Google Wallet
                </Link>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-8 text-gray-500 text-sm">
                <p>Powered by <span className="font-semibold">QARD</span></p>
            </div>
        </div>
    )
}
