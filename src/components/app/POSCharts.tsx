'use client'

import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

// --- Activity Chart (Bar) ---
export function ActivityChart({ data }: { data: { date: string, stamps: number, redemptions: number, newPasses?: number }[] }) {
    if (!data || data.length === 0) return <div className="text-zinc-500 text-sm">Keine Daten verfügbar</div>

    // Find max for scaling
    const maxVal = Math.max(...data.map(d => Math.max(d.stamps, d.redemptions, d.newPasses || 0)), 10)

    return (
        <div className="flex items-end gap-2 h-40 w-full pt-4">
            {data.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap shadow-xl">
                        <div className="font-bold mb-1">{new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                            <span className="text-emerald-500">Stempel:</span> <span>{day.stamps}</span>
                            <span className="text-purple-500">Einlösung:</span> <span>{day.redemptions}</span>
                            <span className="text-blue-500">Neue Karten:</span> <span>{day.newPasses || 0}</span>
                        </div>
                    </div>

                    {/* Bars Container */}
                    <div className="w-full flex gap-0.5 items-end justify-center h-full px-0.5">
                        {/* Stamp Bar */}
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(day.stamps / maxVal) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="w-2 bg-emerald-500 rounded-t-sm"
                        />
                        {/* Redeem Bar */}
                        {day.redemptions > 0 && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(day.redemptions / maxVal) * 100}%` }}
                                transition={{ duration: 0.5, delay: i * 0.1 + 0.05 }}
                                className="w-2 bg-purple-500 rounded-t-sm opacity-90"
                            />
                        )}
                        {/* New Passes Bar */}
                        {(day.newPasses || 0) > 0 && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${((day.newPasses || 0) / maxVal) * 100}%` }}
                                transition={{ duration: 0.5, delay: i * 0.1 + 0.1 }}
                                className="w-2 bg-blue-500 rounded-t-sm opacity-90"
                            />
                        )}
                    </div>

                    {/* Label */}
                    <span className="text-[10px] text-zinc-500 font-medium">
                        {new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}
                    </span>
                </div>
            ))}
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
