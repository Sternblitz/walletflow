
import { X, Mail, Phone, Cake, Calendar, Zap, Gift, Smartphone, TrendingUp, History, Send, Clock, AlertTriangle, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface CustomerDetailModalProps {
    customer: any
    onClose: () => void
    onSendPush: (customer: any) => void
}

export function CustomerDetailModal({ customer, onClose, onSendPush }: CustomerDetailModalProps) {
    if (!customer) return null

    // Mock calculations for demo purposes
    const lastScan = customer.last_scan_at ? new Date(customer.last_scan_at) : null
    const daysSinceScan = lastScan ? Math.floor((new Date().getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24)) : -1

    // Determine status color/text
    let statusColor = "text-emerald-500"
    let statusBg = "bg-emerald-500/10"
    let statusText = "Aktiv"

    if (daysSinceScan > 60) {
        statusColor = "text-red-500"
        statusBg = "bg-red-500/10"
        statusText = "Inaktiv"
    } else if (daysSinceScan > 30) {
        statusColor = "text-orange-500"
        statusBg = "bg-orange-500/10"
        statusText = "Gefährdet"
    } else if (daysSinceScan >= 14) {
        statusColor = "text-blue-500"
        statusBg = "bg-blue-500/10"
        statusText = "Abwesend"
    }

    // Mock timeline data
    const timeline = [
        { type: 'scan', date: new Date(), title: 'Besuch', subtitle: 'Stempel erhalten' },
        { type: 'push', date: new Date(Date.now() - 86400000 * 2), title: 'Marketing', subtitle: 'Push Nachricht empfangen' },
        { type: 'redemption', date: new Date(Date.now() - 86400000 * 5), title: 'Prämie', subtitle: 'Kaffee Gratis eingelöst' },
        { type: 'scan', date: new Date(Date.now() - 86400000 * 12), title: 'Besuch', subtitle: 'Stempel erhalten' },
    ]

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
                    <div className="p-8 pb-0">
                        {/* Profile Header */}
                        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-8 relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-zinc-400 text-2xl font-black shadow-inner border border-zinc-200 dark:border-white/5">
                                {(customer.customer_name || 'K').charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white truncate">
                                        {customer.customer_name || `Kunde #${customer.customer_number || 'Unknown'}`}
                                    </h2>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBg} ${statusColor} border border-current opacity-80`}>
                                        {statusText}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                                    {customer.wallet_type && (
                                        <span className="flex items-center gap-1.5">
                                            <Smartphone size={14} />
                                            {customer.wallet_type === 'google' ? 'Google Wallet' : 'Apple Wallet'}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        Zuletzt: {lastScan ? format(lastScan, 'dd. MMM', { locale: de }) : 'Nie'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {customer.customer_email && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg"><Mail size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500">Email</div>
                                        <div className="text-sm font-medium truncate text-zinc-900 dark:text-white">{customer.customer_email}</div>
                                    </div>
                                </div>
                            )}
                            {customer.customer_phone && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg"><Phone size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500">Telefon</div>
                                        <div className="text-sm font-medium truncate text-zinc-900 dark:text-white">{customer.customer_phone}</div>
                                    </div>
                                </div>
                            )}
                            {customer.customer_birthday && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5">
                                    <div className="p-2 bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-lg"><Cake size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-zinc-500">Geburtstag</div>
                                        <div className="text-sm font-medium truncate text-zinc-900 dark:text-white">
                                            {format(new Date(customer.customer_birthday), 'dd. MMMM', { locale: de })}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg"><Calendar size={16} /></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-zinc-500">Dabei seit</div>
                                    <div className="text-sm font-medium truncate text-zinc-900 dark:text-white">
                                        {customer.created_at ? format(new Date(customer.created_at), 'dd.MM.yyyy') : 'Unbekannt'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5">
                                <div className="text-2xl font-black text-emerald-500 mb-1">{customer.current_state?.stamps || 0}</div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stempel</div>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5">
                                <div className="text-2xl font-black text-purple-500 mb-1">3</div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Prämien</div>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5">
                                <div className="text-2xl font-black text-blue-500 mb-1">ø 4</div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tage/Besuch</div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-white/5 p-8">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <History size={16} className="text-zinc-400" />
                            Aktivitäten
                        </h3>

                        <div className="space-y-6 relative before:absolute before:top-2 before:bottom-0 before:left-[19px] before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
                            {timeline.map((item, i) => (
                                <div key={i} className="relative flex gap-4">
                                    {/* Icon */}
                                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-zinc-50 dark:border-zinc-900 shrink-0 ${item.type === 'scan' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                        item.type === 'redemption' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                        }`}>
                                        {item.type === 'scan' ? <Zap size={16} /> : item.type === 'redemption' ? <Gift size={16} /> : <Send size={16} />}
                                    </div>

                                    <div className="pt-1">
                                        <div className="flex items-baseline gap-2 mb-0.5">
                                            <span className="font-bold text-zinc-900 dark:text-white text-sm">{item.title}</span>
                                            <span className="text-xs text-zinc-400">{format(item.date, 'dd. MMM, HH:mm')}</span>
                                        </div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
