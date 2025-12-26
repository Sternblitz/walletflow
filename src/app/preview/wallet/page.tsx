'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import GoogleWalletPreview from '@/components/wallet/GoogleWalletPreview'

/**
 * Dual Wallet Preview Page
 * Shows both Apple Wallet and Google Wallet previews side by side
 * 
 * Usage: /preview/wallet?campaignId=XXX
 */
export default function WalletPreviewPage() {
    const searchParams = useSearchParams()
    const campaignId = searchParams.get('campaignId')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [campaign, setCampaign] = useState<any>(null)

    useEffect(() => {
        if (campaignId) {
            loadCampaign(campaignId)
        } else {
            setLoading(false)
        }
    }, [campaignId])

    const loadCampaign = async (id: string) => {
        try {
            const res = await fetch(`/api/campaign/${id}`)
            if (res.ok) {
                const data = await res.json()
                setCampaign(data)
            } else {
                setError('Campaign nicht gefunden')
            }
        } catch (e) {
            setError('Fehler beim Laden')
        }
        setLoading(false)
    }

    // Demo data if no campaign
    const demoData = {
        programName: campaign?.name || 'Caffè Deluxe',
        issuerName: campaign?.client?.name || 'Restaurant Demo',
        logoUrl: campaign?.design_assets?.images?.logo?.url,
        heroImageUrl: campaign?.design_assets?.images?.strip?.url,
        backgroundColor: campaign?.design_assets?.colors?.backgroundColor || '#1A1A1A',
        customerName: 'Max Mustermann',
        customerId: 'ABC123',
        stamps: { current: 3, max: 10 },
        textFields: [
            { header: 'Prämie', body: 'Gratis Kaffee' },
            { header: 'Powered by', body: 'PASSIFY' }
        ]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Wallet Preview</h1>
                <p className="text-gray-400">
                    {campaign ? campaign.name : 'Demo-Ansicht - So sehen deine Karten aus'}
                </p>
                {campaignId && (
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                        Campaign ID: {campaignId}
                    </p>
                )}
            </div>

            {loading ? (
                <div className="text-center text-gray-500">Laden...</div>
            ) : error ? (
                <div className="text-center text-red-400">{error}</div>
            ) : (
                <>
                    {/* Wallet Previews - Side by Side */}
                    <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">

                        {/* Apple Wallet Preview */}
                        <div className="flex flex-col items-center">
                            <div className="mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                <span className="font-semibold">Apple Wallet</span>
                            </div>

                            {/* Apple Wallet Card (simplified visual) */}
                            <div
                                className="w-[320px] rounded-2xl overflow-hidden shadow-2xl"
                                style={{ backgroundColor: demoData.backgroundColor }}
                            >
                                {/* Strip Image */}
                                {demoData.heroImageUrl ? (
                                    <div
                                        className="w-full h-[100px] bg-cover bg-center"
                                        style={{ backgroundImage: `url(${demoData.heroImageUrl})` }}
                                    />
                                ) : (
                                    <div className="w-full h-[100px] bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                        <div className="text-6xl">
                                            {demoData.stamps ? '☕️'.repeat(Math.min(demoData.stamps.current, 5)) : '⭐'}
                                        </div>
                                    </div>
                                )}

                                {/* Logo Row */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {demoData.logoUrl ? (
                                            <img
                                                src={demoData.logoUrl}
                                                className="w-12 h-12 rounded-lg object-cover"
                                                alt="Logo"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl">
                                                ☕
                                            </div>
                                        )}
                                        <div className="text-sm font-medium opacity-80">
                                            {demoData.issuerName}
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Field */}
                                <div className="px-4 pb-2">
                                    <div className="text-4xl font-bold text-center">
                                        {demoData.stamps ? `${demoData.stamps.current}/${demoData.stamps.max}` : demoData.programName}
                                    </div>
                                </div>

                                {/* Secondary Fields */}
                                <div className="px-4 pb-4 grid grid-cols-2 gap-4 text-sm">
                                    {demoData.textFields.slice(0, 2).map((field, i) => (
                                        <div key={i}>
                                            <div className="opacity-50 text-xs uppercase">{field.header}</div>
                                            <div className="font-medium">{field.body}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Barcode */}
                                <div className="p-4 bg-white">
                                    <div className="flex justify-center">
                                        <div className="bg-gray-200 p-4 rounded">
                                            <div className="w-32 h-32 bg-white flex items-center justify-center">
                                                <span className="text-6xl">📱</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center text-gray-500 text-xs mt-2 font-mono">
                                        {demoData.customerId}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-4 text-sm text-gray-500">
                                Apple Wallet Preview
                            </div>
                        </div>

                        {/* Google Wallet Preview */}
                        <GoogleWalletPreview
                            programName={demoData.programName}
                            issuerName={demoData.issuerName}
                            logoUrl={demoData.logoUrl}
                            heroImageUrl={demoData.heroImageUrl}
                            backgroundColor={demoData.backgroundColor}
                            customerName={demoData.customerName}
                            customerId={demoData.customerId}
                            stamps={demoData.stamps}
                            textFields={demoData.textFields}
                        />
                    </div>

                    {/* Info */}
                    <div className="mt-12 text-center max-w-2xl mx-auto">
                        <h2 className="text-xl font-semibold mb-4">Unterschiede</h2>
                        <div className="grid grid-cols-2 gap-8 text-sm text-gray-400">
                            <div className="text-left">
                                <h3 className="font-semibold text-white mb-2">Apple Wallet</h3>
                                <ul className="space-y-1">
                                    <li>• Custom Strip-Bild möglich</li>
                                    <li>• Emojis als Stempel</li>
                                    <li>• Offline verfügbar (.pkpass)</li>
                                    <li>• Push via APNs</li>
                                </ul>
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-white mb-2">Google Wallet</h3>
                                <ul className="space-y-1">
                                    <li>• Standardisiertes Layout</li>
                                    <li>• Text-basierte Stempel</li>
                                    <li>• Cloud-basiert</li>
                                    <li>• Direktes API-Update</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    {!campaignId && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-500 text-sm">
                                Füge <code className="bg-gray-800 px-2 py-1 rounded">?campaignId=DEINE_ID</code> zur URL hinzu, um eine echte Campaign zu laden
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
