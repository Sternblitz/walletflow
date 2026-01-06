"use client"

import { WalletPassDraft } from "@/lib/wallet/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { QrCode } from "lucide-react"

interface GooglePassPreviewProps {
    draft: WalletPassDraft
    scale?: number
}

export function GooglePassPreview({ draft, scale = 1 }: GooglePassPreviewProps) {
    const { colors, fields, content, images } = draft

    // Google Wallet usually has a dark background for the card or white depending on theme
    // We'll simulate the "Card" view in Google Wallet

    // Default Google Wallet colors if not specified
    const bgColor = "#1F1F1F" // Dark mode default for Google Wallet cards

    return (
        <div className="flex flex-col items-center" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-[340px] overflow-hidden rounded-[20px] bg-black font-sans shadow-2xl"
            >
                {/* === TOP SECTION (HERO) === */}
                <div className="relative h-[180px] w-full bg-slate-800 overflow-hidden">
                    {/* Hero Image */}
                    {images.strip ? (
                        <img
                            src={images.strip.url}
                            alt="Banner"
                            className="h-full w-full object-cover"
                        />
                    ) : images.background ? (
                        <img
                            src={images.background.url}
                            alt="Banner"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500 text-sm font-medium">
                            NO BANNER IMAGE
                        </div>
                    )}

                    {/* Logo Overlay (Top Left) */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                        {images.logo ? (
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-white p-1 shadow-sm">
                                <img src={images.logo.url} alt="Logo" className="h-full w-full object-contain" />
                            </div>
                        ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                                <span className="text-white font-bold">{content.logoText?.charAt(0) || 'L'}</span>
                            </div>
                        )}
                        <span className="text-lg font-medium text-white drop-shadow-md">
                            {content.logoText || "Loyalty Card"}
                        </span>
                    </div>
                </div>

                {/* === BODY SECTION === */}
                <div className="bg-[#1F1F1F] text-white p-5 min-h-[300px]">

                    {/* Header / Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-normal text-white">
                            {content.logoText || "Passify Rewards"}
                        </h2>
                        <p className="text-sm text-[#A8C7FA]">
                            {fields.headerFields[0]?.value || "Membership"}
                        </p>
                    </div>

                    {/* Primary Info (Points/Balances) */}
                    {(fields.primaryFields.length > 0 || fields.secondaryFields.length > 0) && (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {/* Primary Field */}
                            {fields.primaryFields.map((f, i) => (
                                <div key={i} className="col-span-2">
                                    <p className="text-sm text-gray-400">{f.label || "BALANCE"}</p>
                                    <p className="text-3xl font-normal text-white">{f.value}</p>
                                </div>
                            ))}

                            {/* Secondary Fields */}
                            {fields.secondaryFields.map((f, i) => (
                                <div key={i} className={cn("col-span-1", i === 2 && "col-span-2")}>
                                    <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                                    <p className="text-base font-medium text-white">{f.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Barcode Section */}
                    <div className="flex flex-col items-center justify-center pt-4 border-t border-white/10 my-4">
                        <div className="bg-white p-3 rounded-xl mb-2">
                            <QrCode className="w-32 h-32 text-black" />
                        </div>
                        <p className="text-xs text-gray-500 font-mono tracking-wider">
                            1234 5678 9012
                        </p>
                    </div>

                    {/* Details Link Mockup */}
                    <div className="flex items-center justify-between py-4 border-t border-white/10 mt-2">
                        <span className="text-[#A8C7FA] text-sm font-medium">Details</span>
                        <span className="text-[#A8C7FA]">›</span>
                    </div>

                </div>
            </motion.div>

            {/* Google Wallet Brand Footer */}
            <div className="mt-4 flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                <img
                    src="https://www.gstatic.com/images/branding/product/2x/google_wallet_512dp.png"
                    alt="Google Wallet"
                    className="h-6 w-6"
                />
                <span className="text-xs font-medium text-gray-400">Google Wallet Preview</span>
            </div>
        </div>
    )
}
