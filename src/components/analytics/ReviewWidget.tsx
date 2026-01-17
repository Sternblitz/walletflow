'use client'

import { Star, MessageSquare, TrendingUp, ExternalLink, Calendar } from "lucide-react"
import { ReviewStats } from "@/lib/reviews"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface ReviewWidgetProps {
    stats: ReviewStats
    variant?: 'card' | 'minimal'
}

export function ReviewWidget({ stats, variant = 'card' }: ReviewWidgetProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <div className="cursor-pointer group">
                    {variant === 'card' ? (
                        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl transition-all hover:border-white/10 active:scale-[0.98]">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <Star size={16} />
                                <span className="text-xs font-medium">Bewertungen</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-sm font-medium text-yellow-500 mb-1 flex items-center">
                                    {stats.average} <Star size={12} className="fill-current ml-0.5" />
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                <TrendingUp size={12} />
                                <span>Gesamt</span>
                            </div>
                        </div>
                    ) : (
                        // Minimal variant if needed
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors">
                            <Star size={14} className="text-yellow-500" />
                            <span>{stats.average} ({stats.total})</span>
                        </button>
                    )}
                </div>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-md bg-zinc-950 border-l border-white/10 text-white overflow-y-auto p-0">
                <div className="p-6 space-y-8">
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-xl font-bold">Bewertungsübersicht</SheetTitle>
                        <SheetDescription className="text-zinc-500">
                            Detaillierte Analyse aller eingegangenen Bewertungen und Feedbacks.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Summary Stats */}
                    <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white">{stats.average}</div>
                            <div className="flex gap-0.5 text-yellow-500 justify-center mt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        size={12}
                                        className={cn(
                                            "fill-current",
                                            s <= Math.round(stats.average) ? "opacity-100" : "opacity-30"
                                        )}
                                    />
                                ))}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">{stats.total} Bewertungen</div>
                        </div>

                        {/* Bars Breakdown */}
                        <div className="flex-1 space-y-1.5">
                            {stats.breakdown.map((item) => (
                                <div key={item.rating} className="flex items-center gap-2 text-xs">
                                    <div className="w-3 text-zinc-400">{item.rating}</div>
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-8 text-right text-zinc-500">{item.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Verlauf</h3>

                        <div className="space-y-3">
                            {stats.recentActivity.length === 0 ? (
                                <div className="text-center py-8 text-zinc-600 italic text-sm">
                                    Noch keine Bewertungen vorhanden.
                                </div>
                            ) : (
                                stats.recentActivity.map((activity) => (
                                    <div key={activity.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-1 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={cn(
                                                            "fill-current",
                                                            i < activity.rating ? "opacity-100" : "opacity-20"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                                <Calendar size={10} />
                                                {new Date(activity.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                            </div>
                                        </div>

                                        {activity.comment && (
                                            <div className="text-sm text-zinc-300 leading-relaxed bg-black/20 p-3 rounded-lg mt-2">
                                                "{activity.comment}"
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mt-2">
                                            <div className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full border",
                                                activity.rating >= 4
                                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                                    : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                            )}>
                                                {activity.rating >= 4 ? "Google Redirect" : "Internes Feedback"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
