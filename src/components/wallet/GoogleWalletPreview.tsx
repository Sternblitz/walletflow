'use client'

import React from 'react'

interface GoogleWalletPreviewProps {
    // Class/Program Info
    programName: string
    issuerName: string

    // Design
    logoUrl?: string
    heroImageUrl?: string
    backgroundColor?: string

    // Customer Info
    customerName?: string
    customerId: string

    // Stamps/Points
    stamps?: { current: number; max: number }
    points?: number

    // Additional Fields
    textFields?: Array<{ header: string; body: string }>
}

/**
 * Visual preview of how a pass will look in Google Wallet
 * Based on Google Wallet's loyalty card layout
 */
export function GoogleWalletPreview({
    programName,
    issuerName,
    logoUrl,
    heroImageUrl,
    backgroundColor = '#1A1A1A',
    customerName = 'Stammkunde',
    customerId,
    stamps,
    points,
    textFields = []
}: GoogleWalletPreviewProps) {
    // Determine if background is dark for text color
    const isDark = isColorDark(backgroundColor)
    const textColor = isDark ? '#FFFFFF' : '#000000'
    const secondaryTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'

    return (
        <div className="flex flex-col items-center">
            {/* Device Frame (Android Phone) */}
            <div className="relative">
                {/* Phone bezel */}
                <div
                    className="relative w-[320px] rounded-[32px] overflow-hidden shadow-2xl"
                    style={{
                        background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
                        padding: '8px'
                    }}
                >
                    {/* Screen */}
                    <div className="rounded-[24px] overflow-hidden bg-gray-100">
                        {/* Status Bar */}
                        <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
                            <span>12:00</span>
                            <div className="flex items-center gap-1">
                                <span>📶</span>
                                <span>🔋</span>
                            </div>
                        </div>

                        {/* Google Wallet Header */}
                        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#4285F4" />
                                <path d="M4 12h16v6H4z" fill="#34A853" />
                                <path d="M4 6v6h8V6z" fill="#FBBC05" />
                                <path d="M12 6v6h8V6z" fill="#EA4335" />
                            </svg>
                            <span className="font-medium text-gray-800">Google Wallet</span>
                        </div>

                        {/* Pass Card */}
                        <div className="p-4 bg-gray-100 min-h-[400px]">
                            <div
                                className="rounded-2xl overflow-hidden shadow-lg"
                                style={{ backgroundColor }}
                            >
                                {/* Hero Image (if present) */}
                                {heroImageUrl && (
                                    <div className="w-full h-24 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${heroImageUrl})` }}
                                    />
                                )}

                                {/* Card Header */}
                                <div className="p-4 flex items-center gap-3">
                                    {/* Logo */}
                                    {logoUrl ? (
                                        <div
                                            className="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0"
                                            style={{ backgroundImage: `url(${logoUrl})` }}
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                        >
                                            ☕
                                        </div>
                                    )}

                                    <div>
                                        <div className="font-semibold" style={{ color: textColor }}>
                                            {programName}
                                        </div>
                                        <div className="text-sm" style={{ color: secondaryTextColor }}>
                                            {issuerName}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="mx-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                                {/* Loyalty Points/Stamps */}
                                <div className="p-4">
                                    {stamps && (
                                        <div className="text-center">
                                            <div className="text-sm mb-1" style={{ color: secondaryTextColor }}>
                                                Stempel
                                            </div>
                                            <div className="text-3xl font-bold" style={{ color: textColor }}>
                                                {stamps.current} / {stamps.max}
                                            </div>
                                            {/* Visual stamps */}
                                            <div className="flex justify-center gap-1 mt-3 flex-wrap max-w-[200px] mx-auto">
                                                {Array.from({ length: stamps.max }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                                        style={{
                                                            backgroundColor: i < stamps.current
                                                                ? 'rgba(74, 222, 128, 0.8)'
                                                                : 'rgba(255,255,255,0.1)'
                                                        }}
                                                    >
                                                        {i < stamps.current ? '✓' : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {points !== undefined && (
                                        <div className="text-center">
                                            <div className="text-sm mb-1" style={{ color: secondaryTextColor }}>
                                                Punkte
                                            </div>
                                            <div className="text-3xl font-bold" style={{ color: textColor }}>
                                                {points}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Customer Info */}
                                <div className="px-4 pb-2">
                                    <div className="text-sm" style={{ color: secondaryTextColor }}>
                                        {customerName}
                                    </div>
                                    <div className="text-xs font-mono" style={{ color: secondaryTextColor }}>
                                        #{customerId}
                                    </div>
                                </div>

                                {/* Text Fields */}
                                {textFields.length > 0 && (
                                    <div className="px-4 pb-4">
                                        {textFields.map((field, i) => (
                                            <div key={i} className="mt-2">
                                                <div className="text-xs uppercase tracking-wide" style={{ color: secondaryTextColor }}>
                                                    {field.header}
                                                </div>
                                                <div className="text-sm" style={{ color: textColor }}>
                                                    {field.body}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Barcode */}
                                <div className="p-4 bg-white mx-4 mb-4 rounded-lg">
                                    <div className="flex justify-center">
                                        {/* QR Code placeholder */}
                                        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                                            <svg viewBox="0 0 100 100" className="w-20 h-20">
                                                {/* Simple QR-like pattern */}
                                                <rect x="10" y="10" width="20" height="20" fill="black" />
                                                <rect x="40" y="10" width="10" height="10" fill="black" />
                                                <rect x="70" y="10" width="20" height="20" fill="black" />
                                                <rect x="10" y="40" width="10" height="10" fill="black" />
                                                <rect x="30" y="40" width="20" height="20" fill="black" />
                                                <rect x="60" y="40" width="10" height="10" fill="black" />
                                                <rect x="80" y="40" width="10" height="10" fill="black" />
                                                <rect x="10" y="70" width="20" height="20" fill="black" />
                                                <rect x="40" y="70" width="10" height="10" fill="black" />
                                                <rect x="60" y="70" width="10" height="20" fill="black" />
                                                <rect x="80" y="80" width="10" height="10" fill="black" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-center text-xs text-gray-500 mt-2 font-mono">
                                        {customerId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Label */}
                <div className="text-center mt-4 text-sm text-gray-500">
                    Google Wallet Preview
                </div>
            </div>
        </div>
    )
}

// Helper to determine if a color is dark
function isColorDark(color: string): boolean {
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.slice(1)
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return luminance < 0.5
    }
    return true // Default to dark
}

export default GoogleWalletPreview
