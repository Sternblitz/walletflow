'use client'

import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

// --- Activity Chart (Bar) ---
export function ActivityChart({ data }: { data: { date: string, stamps: number, redemptions: number, newPasses?: number }[] }) {
    if (!data || data.length === 0) return <div className="text-zinc-500 text-sm">Keine Daten verfügbar</div>

    // Find max for scaling
    const maxVal = Math.max(...data.map(d => Math.max(d.stamps, d.redemptions, d.newPasses || 0)), 10)

    // Calculate totals for legend
    const totalStamps = data.reduce((sum, d) => sum + d.stamps, 0)
    const totalRedemptions = data.reduce((sum, d) => sum + d.redemptions, 0)
    const totalNewPasses = data.reduce((sum, d) => sum + (d.newPasses || 0), 0)

    return (
        <div className="flex flex-col h-full">
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-500/30" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Stempel</span>
                    <span className="text-xs font-bold text-emerald-500">{totalStamps}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-purple-600 to-purple-400 shadow-sm shadow-purple-500/30" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Einlösungen</span>
                    <span className="text-xs font-bold text-purple-500">{totalRedemptions}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm shadow-blue-500/30" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Neue Kunden</span>
                    <span className="text-xs font-bold text-blue-500">{totalNewPasses}</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 min-h-[120px]">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="border-b border-zinc-200 dark:border-white/5" />
                    ))}
                </div>

                {/* Bars */}
                <div className="relative flex items-end gap-1 sm:gap-2 h-full w-full pt-2">
                    {data.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
                            {/* Tooltip */}
                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-zinc-800 dark:bg-zinc-900 border border-zinc-600 dark:border-white/10 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-20 whitespace-nowrap shadow-xl scale-95 group-hover:scale-100">
                                <div className="font-bold mb-1.5 text-zinc-100">{new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                                <div className="space-y-1 text-[11px]">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Stempel
                                        </span>
                                        <span className="font-bold">{day.stamps}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-purple-400 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                            Einlösungen
                                        </span>
                                        <span className="font-bold">{day.redemptions}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-blue-400 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            Neue Kunden
                                        </span>
                                        <span className="font-bold">{day.newPasses || 0}</span>
                                    </div>
                                </div>
                                {/* Tooltip Arrow */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 dark:bg-zinc-900 border-r border-b border-zinc-600 dark:border-white/10 rotate-45" />
                            </div>

                            {/* Bars Container */}
                            <div className="w-full flex gap-[2px] items-end justify-center h-full px-[1px]">
                                {/* Stamp Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: day.stamps > 0 ? `${Math.max((day.stamps / maxVal) * 100, 4)}%` : '2px' }}
                                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                                    className={`flex-1 max-w-3 rounded-t-sm transition-shadow duration-200 ${day.stamps > 0
                                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-500/30'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                        }`}
                                />
                                {/* Redeem Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: day.redemptions > 0 ? `${Math.max((day.redemptions / maxVal) * 100, 4)}%` : '2px' }}
                                    transition={{ duration: 0.6, delay: i * 0.05 + 0.02, ease: "easeOut" }}
                                    className={`flex-1 max-w-3 rounded-t-sm transition-shadow duration-200 ${day.redemptions > 0
                                            ? 'bg-gradient-to-t from-purple-600 to-purple-400 group-hover:shadow-lg group-hover:shadow-purple-500/30'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                        }`}
                                />
                                {/* New Passes Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: (day.newPasses || 0) > 0 ? `${Math.max(((day.newPasses || 0) / maxVal) * 100, 4)}%` : '2px' }}
                                    transition={{ duration: 0.6, delay: i * 0.05 + 0.04, ease: "easeOut" }}
                                    className={`flex-1 max-w-3 rounded-t-sm transition-shadow duration-200 ${(day.newPasses || 0) > 0
                                            ? 'bg-gradient-to-t from-blue-600 to-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/30'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                        }`}
                                />
                            </div>

                            {/* Day Label */}
                            <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-1">
                                {new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
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
