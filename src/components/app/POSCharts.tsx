'use client'

import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Users, Gift, Stamp } from 'lucide-react'
import { useState, useMemo } from 'react'

type ChartDataPoint = {
    date: string
    stamps: number
    redemptions: number
    newPasses?: number
}

type Range = '24h' | '7d' | '30d' | 'all'

// --- Premium Activity Chart (Combined Line Chart) ---
export function PremiumActivityChart({
    data,
    range = '7d'
}: {
    data: ChartDataPoint[]
    range?: Range
}) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    // Process data and calculate dimensions
    const chartConfig = useMemo(() => {
        if (!data || data.length === 0) {
            return null
        }

        const maxVal = Math.max(
            ...data.map(d => Math.max(d.stamps, d.redemptions, d.newPasses || 0)),
            1
        )

        // Add 20% padding to max for visual breathing room
        const scaledMax = maxVal * 1.2

        // Chart dimensions - increased paddingTop to prevent curve clipping
        const width = 100
        const height = 100
        const paddingTop = 15
        const paddingBottom = 8
        const chartHeight = height - paddingTop - paddingBottom

        // Generate points for each metric
        const generatePoints = (values: number[]) => {
            return values.map((val, i) => ({
                x: (i / Math.max(data.length - 1, 1)) * width,
                y: paddingTop + chartHeight - (val / scaledMax) * chartHeight
            }))
        }

        // Create smooth bezier path from points
        const createSmoothPath = (points: { x: number; y: number }[]) => {
            if (points.length < 2) return ''

            let path = `M ${points[0].x} ${points[0].y}`

            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[Math.max(0, i - 1)]
                const p1 = points[i]
                const p2 = points[i + 1]
                const p3 = points[Math.min(points.length - 1, i + 2)]

                // Catmull-Rom to Bezier conversion for smooth curves
                const tension = 0.3
                const cp1x = p1.x + (p2.x - p0.x) * tension
                const cp1y = p1.y + (p2.y - p0.y) * tension
                const cp2x = p2.x - (p3.x - p1.x) * tension
                const cp2y = p2.y - (p3.y - p1.y) * tension

                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
            }
            return path
        }

        // Create area path (path + close to bottom)
        const createAreaPath = (points: { x: number; y: number }[]) => {
            const linePath = createSmoothPath(points)
            if (!linePath) return ''
            return `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
        }

        const stampsPoints = generatePoints(data.map(d => d.stamps))
        const redemptionsPoints = generatePoints(data.map(d => d.redemptions))
        const newPassesPoints = generatePoints(data.map(d => d.newPasses || 0))

        return {
            width,
            height,
            paddingTop,
            paddingBottom,
            stampsPath: createSmoothPath(stampsPoints),
            stampsArea: createAreaPath(stampsPoints),
            redemptionsPath: createSmoothPath(redemptionsPoints),
            redemptionsArea: createAreaPath(redemptionsPoints),
            newPassesPath: createSmoothPath(newPassesPoints),
            newPassesArea: createAreaPath(newPassesPoints),
            stampsPoints,
            redemptionsPoints,
            newPassesPoints,
            maxVal,
            totalStamps: data.reduce((sum, d) => sum + d.stamps, 0),
            totalRedemptions: data.reduce((sum, d) => sum + d.redemptions, 0),
            totalNewPasses: data.reduce((sum, d) => sum + (d.newPasses || 0), 0)
        }
    }, [data])

    // Format X-axis labels based on range
    const formatLabel = (dateStr: string, index: number) => {
        try {
            const date = new Date(dateStr)

            if (range === '24h') {
                // Show hours for 24h view
                return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
            } else if (range === '7d') {
                // Show weekday abbreviation
                return date.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)
            } else if (range === '30d') {
                // Show day of month
                return date.getDate().toString()
            } else {
                // For 'all', show abbreviated date
                return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }).replace('.', '')
            }
        } catch {
            return ''
        }
    }

    // Determine which labels to show (avoid clutter)
    const shouldShowLabel = (index: number, total: number) => {
        if (total <= 7) return true
        if (total <= 14) return index % 2 === 0
        if (total <= 30) return index % 5 === 0 || index === total - 1
        return index % 7 === 0 || index === total - 1
    }

    if (!chartConfig || !data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
                <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span className="text-sm">Keine Daten verfügbar</span>
                </div>
            </div>
        )
    }

    const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null

    return (
        <div className="flex flex-col h-full">
            {/* Chart Area - full height, legend moved to page header */}
            <div className="relative h-[120px]">
                {/* Hover Tooltip */}
                {hoveredData && hoveredIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute z-30 pointer-events-none"
                        style={{
                            left: `${(hoveredIndex / Math.max(data.length - 1, 1)) * 100}%`,
                            top: '0',
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="bg-zinc-900 dark:bg-black border border-white/20 rounded-xl px-3 py-2 shadow-2xl min-w-[120px]">
                            <div className="text-[10px] font-bold text-zinc-400 mb-1.5">
                                {new Date(hoveredData.date).toLocaleDateString('de-DE', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit'
                                })}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Stempel
                                    </span>
                                    <span className="text-xs font-bold text-white">{hoveredData.stamps}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-[10px] text-purple-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        Einlösungen
                                    </span>
                                    <span className="text-xs font-bold text-white">{hoveredData.redemptions}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-[10px] text-blue-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Neue Kunden
                                    </span>
                                    <span className="text-xs font-bold text-white">{hoveredData.newPasses || 0}</span>
                                </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-black border-r border-b border-white/20 rotate-45" />
                        </div>
                    </motion.div>
                )}

                {/* SVG Chart */}
                <svg
                    viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                    className="w-full h-full"
                    preserveAspectRatio="none"
                >
                    {/* Gradient Definitions */}
                    <defs>
                        <linearGradient id="stampsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="redemptionsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="newPassesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0.25, 0.5, 0.75].map((ratio, i) => (
                        <line
                            key={i}
                            x1="0"
                            y1={chartConfig.paddingTop + (chartConfig.height - chartConfig.paddingTop - chartConfig.paddingBottom) * ratio}
                            x2={chartConfig.width}
                            y2={chartConfig.paddingTop + (chartConfig.height - chartConfig.paddingTop - chartConfig.paddingBottom) * ratio}
                            stroke="currentColor"
                            strokeOpacity="0.05"
                            strokeWidth="0.3"
                        />
                    ))}

                    {/* Area Fills (in order: back to front) */}
                    <motion.path
                        d={chartConfig.newPassesArea}
                        fill="url(#newPassesGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />
                    <motion.path
                        d={chartConfig.redemptionsArea}
                        fill="url(#redemptionsGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    />
                    <motion.path
                        d={chartConfig.stampsArea}
                        fill="url(#stampsGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    />

                    {/* Lines */}
                    <motion.path
                        d={chartConfig.newPassesPath}
                        fill="none"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                    />
                    <motion.path
                        d={chartConfig.redemptionsPath}
                        fill="none"
                        stroke="rgb(168, 85, 247)"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                    />
                    <motion.path
                        d={chartConfig.stampsPath}
                        fill="none"
                        stroke="rgb(16, 185, 129)"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
                    />

                    {/* Data Points (dots) - only show on hover column */}
                    {hoveredIndex !== null && (
                        <>
                            <motion.circle
                                cx={chartConfig.stampsPoints[hoveredIndex].x}
                                cy={chartConfig.stampsPoints[hoveredIndex].y}
                                r="1.5"
                                fill="rgb(16, 185, 129)"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            />
                            <motion.circle
                                cx={chartConfig.redemptionsPoints[hoveredIndex].x}
                                cy={chartConfig.redemptionsPoints[hoveredIndex].y}
                                r="1.5"
                                fill="rgb(168, 85, 247)"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            />
                            <motion.circle
                                cx={chartConfig.newPassesPoints[hoveredIndex].x}
                                cy={chartConfig.newPassesPoints[hoveredIndex].y}
                                r="1.5"
                                fill="rgb(59, 130, 246)"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            />
                        </>
                    )}

                    {/* Hover Detection Zones */}
                    {data.map((_, i) => (
                        <rect
                            key={i}
                            x={(i / Math.max(data.length - 1, 1)) * chartConfig.width - chartConfig.width / data.length / 2}
                            y="0"
                            width={chartConfig.width / data.length}
                            height={chartConfig.height}
                            fill="transparent"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="cursor-crosshair"
                        />
                    ))}
                </svg>

                {/* X-Axis Labels - with proper containment */}
                <div className="relative h-4 mt-2">
                    {data.map((d, i) => {
                        if (!shouldShowLabel(i, data.length)) return null
                        const leftPercent = (i / Math.max(data.length - 1, 1)) * 100
                        // Clamp edges to prevent overflow
                        const clampedLeft = Math.max(5, Math.min(95, leftPercent))
                        return (
                            <span
                                key={i}
                                className={`text-[9px] font-medium transition-colors absolute ${hoveredIndex === i
                                    ? 'text-emerald-500 dark:text-emerald-400'
                                    : 'text-zinc-400 dark:text-zinc-600'
                                    }`}
                                style={{
                                    left: `${clampedLeft}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                {formatLabel(d.date, i)}
                            </span>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// Keep the old ActivityChart for backwards compatibility, but mark as deprecated
/** @deprecated Use PremiumActivityChart instead */
export function ActivityChart({ data }: { data: ChartDataPoint[] }) {
    return <PremiumActivityChart data={data} range="7d" />
}


// --- Wallet Distribution (Donut) ---
export function WalletDonut({ apple, google }: { apple: number, google: number }) {
    const total = apple + google
    if (total === 0) return <div className="text-zinc-500 text-sm">Keine Daten</div>

    const applePercent = (apple / total) * 100
    const googlePercent = (google / total) * 100

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Circle */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#333" strokeWidth="10" />

                {/* Apple Segment */}
                <motion.circle
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: applePercent / 100 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="white"
                    strokeWidth="10"
                    strokeDasharray="1 1"
                    pathLength={1} // Normalized length for framer motion usually works differently, but for standard SVG dasharray approach:
                // Using standard strokeDasharray logic if framer pathLength isn't compatible with circle segments in this specific way without complex logic.
                // Actually, simpler CSS/SVG approach:
                />
            </svg>

            {/* Simpler Approach: Conic Gradient */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 rounded-full"
                style={{
                    background: `conic-gradient(#ffffff ${applePercent}%, #333333 0)`
                }}
            />
            {/* Center Cutout */}
            <div className="absolute inset-2 bg-black rounded-full flex flex-col items-center justify-center z-10">
                <Wallet className="w-6 h-6 text-zinc-400 mb-1" />
                <span className="text-xs font-bold text-white">{total}</span>
            </div>
        </div>
    )
}

export function RetentionGauge({ rate }: { rate: number }) {
    return (
        <div className="relative w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rate}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white text-shadow-sm">
                {rate}% Treuequote
            </div>
        </div>
    )
}
