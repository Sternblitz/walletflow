
import { useState, useEffect } from 'react'
import { X, Mail, Phone, Cake, Calendar, Zap, Gift, Smartphone, History, Send, Clock, Sparkles, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface CustomerDetailModalProps {
    customer: any
    slug: string
    onClose: () => void
}

export function CustomerDetailModal({ customer, slug, onClose }: CustomerDetailModalProps) {
    const [detailedData, setDetailedData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Fetch detailed customer data with full timeline
    useEffect(() => {
        const fetchDetails = async () => {
            if (!customer?.id || !slug) return
            setLoading(true)
            try {
                const res = await fetch(`/api/app/customers/${customer.id}?slug=${slug}`)
                if (res.ok) {
                    const data = await res.json()
                    setDetailedData(data)
                }
            } catch (e) {
                console.error('Failed to load customer details:', e)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [customer?.id, slug])

    if (!customer) return null

    // Use detailed data if available, otherwise fall back to customer prop
    const c = detailedData?.customer || customer
    const stats = detailedData?.stats || {}
    const timeline = detailedData?.timeline || customer.activity || []

    // Status styling based on pre-calculated status
    const statusStyles: Record<string, { color: string, bg: string, text: string }> = {
        active: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'Aktiv' },
        absent: { color: 'text-blue-500', bg: 'bg-blue-500/10', text: 'Abwesend' },
        risk: { color: 'text-orange-500', bg: 'bg-orange-500/10', text: 'Gefährdet' },
        inactive: { color: 'text-red-500', bg: 'bg-red-500/10', text: 'Inaktiv' },
    }
    const status = statusStyles[c.status] || statusStyles.active

    // Display name - use name if available, else customer number
    const displayName = c.display_name || c.customer_name || `Kunde #${c.customer_number || 'Unbekannt'}`
    const lastScan = c.last_scan_at ? new Date(c.last_scan_at) : null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
            >
                {/* Header Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full hover:bg-white/80 dark:hover:bg-black/70 transition-colors z-20 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="p-6 sm:p-8 pb-0">
                        {/* Profile Header */}
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center mb-6 relative z-10">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-zinc-400 text-xl sm:text-2xl font-black shadow-inner border border-zinc-200 dark:border-white/5">
                                {(c.customer_name || 'K').charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white truncate">
                                        {displayName}
                                    </h2>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.color} border border-current opacity-80`}>
                                        {status.text}
                                    </span>
                                    {c.is_new && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-500 flex items-center gap-1">
                                            <Sparkles size={10} /> Neu
                                        </span>
                                    )}
                                    {c.birthday_upcoming && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-500">
                                            🎂
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1.5">
                                        <Smartphone size={14} />
                                        {c.wallet_type === 'google' ? 'Google Wallet' : 'Apple Wallet'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {lastScan ? `Zuletzt ${formatDistanceToNow(lastScan, { addSuffix: true, locale: de })}` : 'Noch nie gescannt'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Grid - only show collected fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6">
                            {c.customer_email && (
                                <InfoCard icon={<Mail size={16} />} label="Email" value={c.customer_email} color="blue" />
                            )}
                            {c.customer_phone && (
                                <InfoCard icon={<Phone size={16} />} label="Telefon" value={c.customer_phone} color="purple" />
                            )}
                            {c.customer_birthday && (
                                <InfoCard
                                    icon={<Cake size={16} />}
                                    label="Geburtstag"
                                    value={format(new Date(c.customer_birthday), 'dd. MMMM', { locale: de })}
                                    color="pink"
                                />
                            )}
                            <InfoCard
                                icon={<Calendar size={16} />}
                                label="Kunde seit"
                                value={c.created_at ? format(new Date(c.created_at), 'dd.MM.yyyy') : 'Unbekannt'}
                                color="emerald"
                            />
                            {/* Customer Number - always show */}
                            <InfoCard
                                icon={<User size={16} />}
                                label="Kundennummer"
                                value={`#${c.customer_number || c.serial_number?.slice(-6) || 'N/A'}`}
                                color="zinc"
                            />
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                            <StatCard
                                value={c.stamps ?? c.current_state?.stamps ?? 0}
                                label="Stempel"
                                color="emerald"
                            />
                            <StatCard
                                value={c.redemptions ?? c.current_state?.redemptions ?? stats.total_redemptions ?? 0}
                                label="Prämien"
                                color="purple"
                            />
                            <StatCard
                                value={stats.avg_visit_frequency ? `ø ${stats.avg_visit_frequency}` : '—'}
                                label="Tage/Besuch"
                                color="blue"
                            />
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-white/5 p-6 sm:p-8">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <History size={16} className="text-zinc-400" />
                            Aktivitäten
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                        ) : timeline.length === 0 ? (
                            <div className="text-center py-8 text-zinc-400 text-sm">
                                Keine Aktivitäten vorhanden
                            </div>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:top-2 before:bottom-0 before:left-[15px] before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
                                {timeline.slice(0, 10).map((item: any, i: number) => (
                                    <TimelineItem key={item.id || i} item={item} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
        pink: 'bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400',
        emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        zinc: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="text-sm font-medium truncate text-zinc-900 dark:text-white">{value}</div>
            </div>
        </div>
    )
}

function StatCard({ value, label, color }: { value: string | number, label: string, color: string }) {
    const colorClasses: Record<string, string> = {
        emerald: 'text-emerald-500',
        purple: 'text-purple-500',
        blue: 'text-blue-500',
    }

    return (
        <div className="text-center p-3 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5">
            <div className={`text-xl sm:text-2xl font-black ${colorClasses[color]} mb-0.5`}>{value}</div>
            <div className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</div>
        </div>
    )
}

function TimelineItem({ item }: { item: any }) {
    const typeStyles: Record<string, { bg: string, icon: React.ReactNode }> = {
        scan: {
            bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
            icon: <Zap size={14} />
        },
        redemption: {
            bg: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
            icon: <Gift size={14} />
        },
        push: {
            bg: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
            icon: <Send size={14} />
        },
        created: {
            bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
            icon: <Calendar size={14} />
        },
    }

    const style = typeStyles[item.type] || typeStyles.scan

    return (
        <div className="relative flex gap-3">
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-zinc-50 dark:border-zinc-900 shrink-0 ${style.bg}`}>
                {style.icon}
            </div>
            <div className="pt-0.5 min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-zinc-900 dark:text-white text-sm">{item.title}</span>
                    <span className="text-xs text-zinc-400">
                        {item.date ? format(new Date(item.date), 'dd. MMM, HH:mm', { locale: de }) : ''}
                    </span>
                </div>
                {item.subtitle && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{item.subtitle}</p>
                )}
            </div>
        </div>
    )
}
