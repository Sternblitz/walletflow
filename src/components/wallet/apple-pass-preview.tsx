import { cn } from "@/lib/utils"
import { QrCode, ScanLine } from "lucide-react"

interface ApplePassPreviewProps {
    // Visuals
    backgroundColor: string
    labelColor: string
    foregroundColor: string

    // Assets
    logoText: string
    iconUrl?: string
    stripImageUrl?: string

    // Content Fields
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

    // Advanced Customization
    stripOverlay?: React.ReactNode // <--- NEW: Allows rendering Stamps/Text inside the Strip Area

    className?: string
}

export function ApplePassPreview({
    backgroundColor = "#1c1c1e",
    labelColor = "#8e8e93",
    foregroundColor = "#ffffff",

    logoText = "Store Card",
    iconUrl,
    stripImageUrl,

    headerLabel = "PUNKTE",
    headerValue = "50",
    primaryLabel = "MITGLIED",
    primaryValue = "GOLD STATUS",
    secLabel1,
    secValue1,
    secLabel2,
    secValue2,

    // New Auxiliary Fields (Row 2)
    auxLabel1 = "",
    auxValue1 = "",

    stripOverlay,

    className
}: ApplePassPreviewProps) {
    return (
        <div className={cn("relative w-[300px] shadow-2xl rounded-[15px] overflow-hidden font-sans select-none", className)}>

            {/* The Pass Body */}
            <div
                className="relative flex flex-col h-[480px] transition-colors duration-300"
                style={{ backgroundColor }}
            >
                {/* Header Row */}
                <div className="flex items-center justify-between p-4 pt-5 relative z-10 w-full">
                    <div className="flex items-center gap-3">
                        {/* Icon Area (Flexible Logo) */}
                        <div className="h-10 min-w-[40px] flex items-center justify-center">
                            {iconUrl ? (
                                <img
                                    src={iconUrl}
                                    alt="icon"
                                    className="h-full w-auto object-contain drop-shadow-sm"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={cn("absolute inset-0 flex items-center justify-center", iconUrl ? "hidden" : "")}>
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <ScanLine className="w-6 h-6 text-white/50" />
                                </div>
                            </div>
                        </div>
                        <span className="font-semibold text-lg truncate max-w-[140px]" style={{ color: foregroundColor }}>
                            {logoText}
                        </span>
                    </div>

                    {/* Header Field (Top Right usually, but here simplified or same row) */}
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold tracking-wider mb-0.5" style={{ color: labelColor }}>{headerLabel}</p>
                        <p className="text-lg font-light leading-none" style={{ color: foregroundColor }}>{headerValue}</p>
                    </div>
                </div>

                {/* Strip Image Area (Fixed Aspect Ratio 375:98) */}
                {/* Strip Image Area (Modern Aspect Ratio 375:144) */}
                <div className="relative w-full aspect-[375/144] mt-2 flex items-center overflow-hidden bg-black/50">
                    {stripImageUrl ? (
                        <img src={stripImageUrl} alt="strip" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-white/30 uppercase tracking-widest">Strip Image (1125x432)</span>
                        </div>
                    )}

                    {/* Safe Zone Indicator (Always visible during editing for 'What You See Is What You Get') */}
                    {stripImageUrl && stripImageUrl.includes('api/preview') && (
                        <div className="absolute inset-y-0 right-0 w-[9%] bg-red-500/10 border-l border-red-500/30 flex items-center justify-center pointer-events-none z-50">
                            <span className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 font-bold -rotate-90 whitespace-nowrap">
                                SAFE AREA
                            </span>
                        </div>
                    )}

                    {/* PRIMARY FIELD (Overlay on Strip for Store Cards) */}
                    {/* Apple puts Primary Fields on the Left of the Strip Image for Store Cards */}
                    {/* PRIMARY FIELD (Overlay on Strip for Store Cards) */}
                    {/* Apple puts Primary Fields on the Left of the Strip Image for Store Cards */}
                    <div className="absolute inset-0 flex flex-col justify-center px-4 z-20">
                        <p className="text-[10px] uppercase font-semibold tracking-wider mb-0.5 drop-shadow-md" style={{ color: labelColor }}>
                            {primaryLabel}
                        </p>
                        <p className="text-4xl font-light leading-none drop-shadow-md" style={{ color: foregroundColor }}>
                            {primaryValue}
                        </p>
                    </div>

                    {/* OVERLAY CONTENT (Stamps, etc) - Right Aligned */}
                    {stripOverlay && (
                        <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
                            {stripOverlay}
                        </div>
                    )}
                </div>

                {/* Fields Area (Bottom Info) - Premium Redesign */}
                <div className="flex-1 px-5 py-4 flex flex-col justify-end gap-4 mb-2">
                    {/* Secondary Fields (Row 1 - Reward & Info) - Premium Layout */}
                    {secLabel1 && secValue1 && (
                        <div className="relative space-y-1">
                            {/* Decorative Accent Line */}
                            <div 
                                className="absolute -top-1 left-0 w-12 h-0.5 rounded-full opacity-60"
                                style={{ backgroundColor: labelColor }}
                            />
                            
                            <div className="space-y-1">
                                <p className="text-[8px] uppercase font-bold tracking-[0.2em] opacity-70" style={{ color: labelColor }}>{secLabel1}</p>
                                <p className="text-[18px] font-bold leading-tight tracking-tight" style={{ color: foregroundColor }}>{secValue1}</p>
                            </div>
                        </div>
                    )}

                    {/* Optional Second Field */}
                    {secValue2 && secLabel2 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="text-left">
                                <p className="text-[8px] uppercase font-semibold tracking-wider mb-0.5 opacity-60" style={{ color: labelColor }}>{secLabel2}</p>
                                <p className="text-[12px] font-medium leading-none" style={{ color: foregroundColor }}>{secValue2}</p>
                            </div>
                        </div>
                    )}

                    {/* Auxiliary Fields (Row 2 - Branding) - Premium Redesign */}
                    {auxValue1 && (
                        <div className="relative space-y-2">
                            {/* Elegant Separator */}
                            <div className="flex items-center justify-center gap-2">
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
                                <p className="text-[7px] uppercase tracking-[0.25em] font-semibold opacity-50" style={{ color: labelColor }}>
                                    {auxLabel1}
                                </p>
                                <p className="text-[10px] font-bold tracking-wider opacity-70" style={{ 
                                    color: foregroundColor,
                                    letterSpacing: '0.15em'
                                }}>
                                    {auxValue1}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Barcode Stump (Bottom Part) */}
                <div className="bg-white m-2 mx-3 p-1 rounded-lg flex items-center justify-center h-20 shadow-lg">
                    <div className="flex flex-col items-center opacity-90">
                        <QrCode className="w-12 h-12 text-black" />
                    </div>
                </div>

            </div>

            {/* Glossy Overlay Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>
    )
}
