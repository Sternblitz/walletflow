"use client"

import { cn } from "@/lib/utils"

interface TemplatePreviewProps {
    size: string
    data: {
        headline: string
        subline: string
        qrUrl: string
        logoUrl?: string | null
        logoSize?: number
        bgEffect: string
        bgColor1: string
        bgColor2: string
        qrFrame: string
        showSteps: boolean
        stampCount: number
        rewardText: string
        campaignName: string
    }
    className?: string
}

export function TemplatePreview({ size, data, className }: TemplatePreviewProps) {
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(data.qrUrl)}`
    const logoSize = data.logoSize || 80

    // Get aspect ratio based on size
    const getAspectStyle = () => {
        switch (size) {
            case 'a4': return 'aspect-[210/297]'
            case 'a5': return 'aspect-[148/210]'
            case 'a6': return 'aspect-[105/148]'
            case 'square': return 'aspect-square'
            case 'story': return 'aspect-[9/16]'
            default: return 'aspect-[148/210]'
        }
    }

    // Background effect styles
    const getBackgroundStyle = () => {
        const c1 = data.bgColor1
        const c2 = data.bgColor2

        switch (data.bgEffect) {
            case 'solid':
                return { background: c1 }
            case 'gradient':
                return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }
            case 'orbs':
                return { background: c1 }
            case 'glow':
                return { background: `radial-gradient(ellipse at center, ${c1} 0%, ${c2} 100%)` }
            case 'dots':
                return { background: c1 }
            default:
                return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }
        }
    }

    // QR Frame styles
    const getQRContainerClass = () => {
        const base = "bg-white p-4 relative"
        switch (data.qrFrame) {
            case 'none':
                return base
            case 'rounded':
                return `${base} rounded-2xl`
            case 'shadow':
                return `${base} rounded-2xl shadow-2xl`
            case 'glow':
                return `${base} rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)]`
            case 'badge':
                return `${base} rounded-3xl shadow-xl ring-4 ring-white/20`
            case 'corner':
                return base
            default:
                return `${base} rounded-2xl shadow-xl`
        }
    }

    // Corner decorations for 'corner' frame style
    const CornerDecorations = () => (
        <>
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-white/80" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-white/80" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-white/80" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-white/80" />
        </>
    )

    // Orb effect overlay
    const OrbsOverlay = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl opacity-30"
                style={{ background: data.bgColor2 }}
            />
            <div
                className="absolute -bottom-1/4 -left-1/4 w-2/3 h-2/3 rounded-full blur-3xl opacity-20"
                style={{ background: data.bgColor2 }}
            />
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full blur-2xl opacity-40"
                style={{ background: `${data.bgColor2}80` }}
            />
        </div>
    )

    // Dots pattern overlay
    const DotsOverlay = () => (
        <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
                backgroundImage: `radial-gradient(circle, ${data.bgColor2} 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }}
        />
    )

    // Determine if we need light or dark text based on background
    const isLightBg = () => {
        const hex = data.bgColor1.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness > 128
    }

    const textColor = isLightBg() ? 'text-black' : 'text-white'
    const mutedColor = isLightBg() ? 'text-black/60' : 'text-white/60'
    const subtleColor = isLightBg() ? 'text-black/40' : 'text-white/40'

    return (
        <div
            className={cn(
                "w-full overflow-hidden relative print:shadow-none",
                getAspectStyle(),
                className
            )}
            style={getBackgroundStyle()}
        >
            {/* Effect Overlays */}
            {data.bgEffect === 'orbs' && <OrbsOverlay />}
            {data.bgEffect === 'dots' && <DotsOverlay />}

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col p-6 md:p-8 lg:p-10">

                {/* Logo Area */}
                {data.logoUrl && (
                    <div className="flex justify-center mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={data.logoUrl}
                            alt="Logo"
                            style={{ height: `${logoSize}px`, width: 'auto' }}
                            className="object-contain"
                        />
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 relative z-10">

                    {/* Headline */}
                    <h1 className={cn(
                        "font-bold uppercase tracking-tight max-w-[90%] leading-tight",
                        textColor,
                        size === 'a4' ? 'text-4xl md:text-5xl' :
                            size === 'square' ? 'text-2xl' :
                                'text-2xl md:text-3xl'
                    )}>
                        {data.headline}
                    </h1>

                    {/* QR Code */}
                    <div className={cn("relative", getQRContainerClass())}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrImage}
                            alt="QR Code"
                            className={cn(
                                "mix-blend-multiply",
                                size === 'a4' ? 'w-48 h-48 md:w-56 md:h-56' :
                                    size === 'square' ? 'w-28 h-28' :
                                        'w-32 h-32 md:w-40 md:h-40'
                            )}
                        />
                        {data.qrFrame === 'corner' && <CornerDecorations />}
                    </div>

                    {/* Subline */}
                    <p className={cn(
                        "font-medium max-w-[85%]",
                        mutedColor,
                        size === 'a4' ? 'text-xl md:text-2xl' :
                            size === 'square' ? 'text-sm' :
                                'text-base md:text-lg'
                    )}>
                        {data.subline}
                    </p>

                    {/* Emoji Steps */}
                    {data.showSteps && (
                        <div className={cn(
                            "flex items-center justify-center gap-2 md:gap-4 mt-2",
                            size === 'square' ? 'text-xs' : 'text-sm md:text-base'
                        )}>
                            <span className={cn("flex items-center gap-1", mutedColor)}>
                                <span className="text-lg md:text-xl">📱</span>
                                <span>Scannen</span>
                            </span>
                            <span className={subtleColor}>→</span>
                            <span className={cn("flex items-center gap-1", mutedColor)}>
                                <span className="text-lg md:text-xl">⭐</span>
                                <span>{data.stampCount}× sammeln</span>
                            </span>
                            <span className={subtleColor}>→</span>
                            <span className={cn("flex items-center gap-1", mutedColor)}>
                                <span className="text-lg md:text-xl">🎁</span>
                                <span>{data.rewardText}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={cn(
                    "flex flex-col items-center gap-1 mt-auto pt-4",
                    subtleColor
                )}>
                    <div className="h-px w-16 bg-current opacity-30" />
                    <span className={cn(
                        "font-mono uppercase tracking-widest",
                        size === 'square' ? 'text-[8px]' : 'text-[10px]'
                    )}>
                        powered by QARD
                    </span>
                </div>
            </div>
        </div>
    )
}
