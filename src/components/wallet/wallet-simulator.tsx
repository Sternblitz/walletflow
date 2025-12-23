"use client"

import { cn } from "@/lib/utils"
import { QrCode } from "lucide-react"
import { motion } from "framer-motion"

interface WalletSimulatorProps {
    // Pass Type
    passType?: 'storeCard' | 'coupon' | 'eventTicket' | 'generic'

    // Core Colors
    backgroundColor: string
    labelColor: string
    foregroundColor: string

    // Logo / Header
    logoText: string
    iconUrl?: string

    // Strip Image (The main visual area)
    stripImageUrl?: string

    // Text Fields (Apple renders these, we just position them)
    headerLabel?: string
    headerValue?: string
    primaryLabel?: string
    primaryValue?: string
    secLabel1?: string
    secValue1?: string
    secLabel2?: string
    secValue2?: string
    auxLabel1?: string
    auxValue1?: string

    // Editing Helpers
    showSafeZones?: boolean
    showDimensions?: boolean

    className?: string
}

// Apple Wallet exact proportions based on official documentation
const PASS_PROPORTIONS = {
    // Card Width is always 320pt (logical), we scale to 300px for display
    cardWidth: 300,
    cardHeight: 440, // Approximate full card height

    // Header Area
    headerHeight: 44,

    // Strip Area (Store Card / Coupon = 144pt, others vary)
    stripHeights: {
        storeCard: 115, // 144pt scaled to our 300px width context
        coupon: 115,
        eventTicket: 78,
        generic: 98,
    },

    // Barcode Area
    barcodeHeight: 90,

    // Field spacing
    fieldPadding: 12,
} as const

export function WalletSimulator({
    passType = 'storeCard',
    backgroundColor = "#1c1c1e",
    labelColor = "#8e8e93",
    foregroundColor = "#ffffff",
    logoText = "Store Card",
    iconUrl,
    stripImageUrl,
    headerLabel = "POINTS",
    headerValue = "50",
    primaryLabel = "BALANCE",
    primaryValue = "$50.00",
    secLabel1,
    secValue1,
    secLabel2,
    secValue2,
    auxLabel1,
    auxValue1,
    showSafeZones = false,
    showDimensions = false,
    className
}: WalletSimulatorProps) {

    const stripHeight = PASS_PROPORTIONS.stripHeights[passType]

    return (
        <div className={cn("relative group", className)}>
            {/* Premium Glow Effect */}
            <div
                className="absolute -inset-4 rounded-[30px] opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
                style={{ background: `linear-gradient(135deg, ${backgroundColor}, transparent)` }}
            />

            {/* The Pass Card */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                    "relative w-[300px] rounded-[16px] overflow-hidden",
                    "shadow-2xl shadow-black/60",
                    "ring-1 ring-white/10"
                )}
                style={{ backgroundColor }}
            >
                {/* === HEADER AREA === */}
                <div className="relative z-20 flex items-center justify-between p-3 pt-4">
                    {/* Logo + Text */}
                    <div className="flex items-center gap-2.5">
                        {iconUrl ? (
                            <img
                                src={iconUrl}
                                alt="icon"
                                className="w-10 h-10 rounded-lg object-contain bg-white/10"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <span className="text-lg">{logoText.charAt(0)}</span>
                            </div>
                        )}
                        <span
                            className="font-semibold text-[15px] tracking-tight truncate max-w-[120px]"
                            style={{ color: foregroundColor }}
                        >
                            {logoText}
                        </span>
                    </div>

                    {/* Header Field (Top Right) */}
                    <div className="text-right">
                        <p
                            className="text-[9px] uppercase font-semibold tracking-wider mb-0.5"
                            style={{ color: labelColor }}
                        >
                            {headerLabel}
                        </p>
                        <p
                            className="text-[15px] font-light leading-none"
                            style={{ color: foregroundColor }}
                        >
                            {headerValue}
                        </p>
                    </div>
                </div>

                {/* === STRIP IMAGE AREA (THE CRITICAL PART) === */}
                <div
                    className="relative w-full overflow-hidden"
                    style={{ height: stripHeight }}
                >
                    {/* Background Image */}
                    {stripImageUrl ? (
                        <motion.img
                            key={stripImageUrl}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            src={stripImageUrl}
                            alt="strip"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ backgroundColor: `${backgroundColor}dd` }}
                        >
                            <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
                                Strip Image
                            </span>
                        </div>
                    )}

                    {/* Primary Field (Overlaid on Strip - Left Side) */}
                    <div className="absolute inset-0 flex flex-col justify-center px-3 z-10">
                        <p
                            className="text-[9px] uppercase font-semibold tracking-wider mb-0.5 drop-shadow-lg"
                            style={{ color: labelColor }}
                        >
                            {primaryLabel}
                        </p>
                        <p
                            className="text-[32px] font-light leading-none drop-shadow-lg tracking-tight"
                            style={{ color: foregroundColor }}
                        >
                            {primaryValue}
                        </p>
                    </div>

                    {/* Safe Zone Indicator (Right Edge) */}
                    {showSafeZones && (
                        <div className="absolute inset-y-0 right-0 w-[26px] bg-red-500/20 border-l-2 border-dashed border-red-500/50 flex items-center justify-center z-30">
                            <span className="text-[7px] text-red-400 font-bold -rotate-90 whitespace-nowrap">
                                SAFE ZONE
                            </span>
                        </div>
                    )}

                    {/* Dimensions Overlay */}
                    {showDimensions && (
                        <div className="absolute top-1 left-1 bg-black/70 text-[8px] text-green-400 px-1.5 py-0.5 rounded font-mono z-30">
                            1125 × 432 px
                        </div>
                    )}
                </div>

                {/* === SECONDARY FIELDS AREA (PREMIUM REDESIGN) === */}
                <div className="relative z-20 px-4 py-4 space-y-3">
                    {/* Reward Section - Premium Layout */}
                    {secLabel1 && secValue1 && (
                        <div className="relative">
                            {/* Decorative Accent Line */}
                            <div 
                                className="absolute -top-1 left-0 w-12 h-0.5 rounded-full opacity-60"
                                style={{ backgroundColor: labelColor }}
                            />
                            
                            <div className="space-y-1">
                                <p
                                    className="text-[8px] uppercase font-bold tracking-[0.2em] opacity-70"
                                    style={{ color: labelColor }}
                                >
                                    {secLabel1}
                                </p>
                                <p
                                    className="text-[18px] font-bold leading-tight tracking-tight"
                                    style={{ color: foregroundColor }}
                                >
                                    {secValue1}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Optional Second Field */}
                    {secLabel2 && secValue2 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="text-left">
                                <p
                                    className="text-[8px] uppercase font-semibold tracking-wider mb-0.5 opacity-60"
                                    style={{ color: labelColor }}
                                >
                                    {secLabel2}
                                </p>
                                <p
                                    className="text-[12px] font-medium leading-none"
                                    style={{ color: foregroundColor }}
                                >
                                    {secValue2}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* === AUXILIARY (BRANDING) AREA - PREMIUM REDESIGN === */}
                {auxValue1 && (
                    <div className="relative z-20 px-4 pb-3">
                        {/* Elegant Separator */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div 
                                className="flex-1 h-px opacity-20"
                                style={{ backgroundColor: labelColor }}
                            />
                            <div 
                                className="w-1 h-1 rounded-full opacity-40"
                                style={{ backgroundColor: labelColor }}
                            />
                            <div 
                                className="flex-1 h-px opacity-20"
                                style={{ backgroundColor: labelColor }}
                            />
                        </div>
                        
                        {/* Branding Text - More Elegant */}
                        <div className="text-center space-y-0.5">
                            <p
                                className="text-[7px] uppercase tracking-[0.25em] font-semibold opacity-50"
                                style={{ color: labelColor }}
                            >
                                {auxLabel1}
                            </p>
                            <p
                                className="text-[10px] font-bold tracking-wider opacity-70"
                                style={{ 
                                    color: foregroundColor,
                                    letterSpacing: '0.15em'
                                }}
                            >
                                {auxValue1}
                            </p>
                        </div>
                    </div>
                )}

                {/* === BARCODE AREA === */}
                <div className="relative z-20 m-2.5 mt-1 bg-white rounded-xl p-3 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1">
                        <QrCode className="w-14 h-14 text-black" />
                        <span className="text-[10px] text-black/40 font-mono tracking-wider">
                            123 456 789
                        </span>
                    </div>
                </div>

                {/* Subtle glass overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none" />
            </motion.div>

            {/* Pass Type Indicator */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                {passType.replace(/([A-Z])/g, ' $1').trim()}
            </div>
        </div>
    )
}
