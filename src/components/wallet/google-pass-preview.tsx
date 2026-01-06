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

    // User wants a full colored card (like the orange example)
    const bgColor = colors.backgroundColor || "#ffffff"
    const fgColor = colors.foregroundColor || "#ffffff"
    const labelColor = colors.labelColor || "rgba(255,255,255,0.7)"

    return (
        <div className="flex flex-col items-center" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-[340px] min-h-[550px] overflow-hidden rounded-[24px] shadow-2xl flex flex-col"
                style={{ backgroundColor: bgColor }}
            >
                {/* === TOP HEADER === */}
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-6">
                        {images.logo ? (
                            <img
                                src={images.logo.url}
                                alt="Logo"
                                className="w-10 h-10 rounded-full bg-white object-contain p-0.5"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-white font-bold text-lg">{content.logoText?.charAt(0)}</span>
                            </div>
                        )}
                        <span className="font-medium text-[17px] tracking-tight" style={{ color: fgColor }}>
                            {content.logoText || "QARD Rewards"}
                        </span>
                    </div>

                    {/* Program Name (Title) */}
                    <h2 className="text-[28px] leading-tight font-normal mb-6" style={{ color: fgColor }}>
                        {content.programName || fields.headerFields[0]?.value || "Start Kampagne"}
                    </h2>

                    {/* Primary Field (e.g. Stempel 1/10) */}
                    {(fields.primaryFields.length > 0) && (
                        <div className="mb-2">
                            <p className="text-[13px] mb-0.5 font-medium" style={{ color: labelColor }}>
                                {fields.primaryFields[0].label}
                            </p>
                            <p className="text-[20px] font-normal" style={{ color: fgColor }}>
                                {fields.primaryFields[0].value}
                            </p>
                        </div>
                    )}
                </div>

                {/* === CENTER QR CODE === */}
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="bg-white p-4 rounded-[20px] shadow-sm mb-3">
                        <QrCode className="w-36 h-36 text-black" />
                    </div>
                    {/* Barcode Text */}
                    <p className="text-[13px] font-medium opacity-80" style={{ color: fgColor }}>
                        1234 5678 9012
                    </p>
                </div>

                {/* === BOTTOM IMAGE (HERO/FOOTER) === */}
                {/* Matches user's screenshot where image is at the very bottom */}
                <div className="h-[200px] w-full mt-auto relative overflow-hidden">
                    {images.strip ? (
                        <img
                            src={images.strip.url}
                            alt="Footer"
                            className="w-full h-full object-cover"
                        />
                    ) : images.background ? (
                        <img
                            src={images.background.url}
                            alt="Footer"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-black/10 flex items-center justify-center">
                            <span className="text-white/40 text-sm">Image Area</span>
                        </div>
                    )}
                    {/* Gradient overlay to blend top edge slightly */}
                    <div
                        className="absolute top-0 left-0 w-full h-12"
                        style={{ background: `linear-gradient(to bottom, ${bgColor}, transparent)` }}
                    />
                </div>

            </motion.div>

            {/* Google Wallet Brand Footer */}
            <div className="mt-6 flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                <img
                    src="https://www.gstatic.com/images/branding/product/2x/google_wallet_512dp.png"
                    alt="Google Wallet"
                    className="h-6 w-6"
                />
                <span className="text-xs font-medium text-gray-500">Google Wallet Preview</span>
            </div>

            <p className="mt-2 text-[10px] text-gray-400 max-w-[300px] text-center">
                * Design approximate. Actual rendering varies by Android version and user theme.
            </p>
        </div>
    )
}
