
import { useState, useMemo, useRef, useEffect } from 'react'
import { Users, Zap, ChevronDown, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

interface CustomerListProps {
    customers: any[]
    onSelectCustomer: (customer: any) => void
    loading: boolean
}

type FilterType = 'all' | 'recent' | 'absent' | 'risk' | 'inactive'

// Filter configuration
const FILTERS: { key: FilterType, label: string, color: string, dotColor: string, description: string }[] = [
    { key: 'all', label: 'Alle Kunden', color: 'zinc', dotColor: 'bg-zinc-400', description: '' },
    { key: 'recent', label: 'Aktiv', color: 'emerald', dotColor: 'bg-emerald-500', description: '< 7 Tage' },
    { key: 'absent', label: 'Abwesend', color: 'blue', dotColor: 'bg-blue-500', description: '14+ Tage' },
    { key: 'risk', label: 'Gefährdet', color: 'orange', dotColor: 'bg-orange-500', description: '30+ Tage' },
    { key: 'inactive', label: 'Inaktiv', color: 'red', dotColor: 'bg-red-500', description: '60+ Tage' },
]

export function CustomerList({ customers, onSelectCustomer, loading }: CustomerListProps) {
    const [filter, setFilter] = useState<FilterType>('all')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Derived stats for filter badges
    const stats = useMemo(() => {
        const now = new Date()
        const getDaysSince = (dateStr: string | null) => {
            if (!dateStr) return 999
            return Math.floor((now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
        }

        return {
            all: customers.length,
            recent: customers.filter(c => getDaysSince(c.last_scan_at) < 7).length,
            absent: customers.filter(c => { const d = getDaysSince(c.last_scan_at); return d >= 14 && d < 30 }).length,
            risk: customers.filter(c => { const d = getDaysSince(c.last_scan_at); return d >= 30 && d < 60 }).length,
            inactive: customers.filter(c => getDaysSince(c.last_scan_at) >= 60).length,
        }
    }, [customers])

    // Filtering Logic
    const filteredCustomers = useMemo(() => {
        let result = [...customers]
        const now = new Date()

        if (filter !== 'all') {
            result = result.filter(c => {
                const days = c.last_scan_at ? Math.floor((now.getTime() - new Date(c.last_scan_at).getTime()) / (1000 * 60 * 60 * 24)) : 999
                if (filter === 'recent') return days < 7
                if (filter === 'absent') return days >= 14 && days < 30
                if (filter === 'risk') return days >= 30 && days < 60
                if (filter === 'inactive') return days >= 60
                return true
            })
        }

        // Sort by most recent
        result.sort((a, b) => new Date(b.last_scan_at || 0).getTime() - new Date(a.last_scan_at || 0).getTime())

        return result
    }, [customers, filter])

    // Helper for visual tags
    const getTags = (c: any) => {
        const tags = []
        const days = c.last_scan_at ? Math.floor((new Date().getTime() - new Date(c.last_scan_at).getTime()) / (1000 * 60 * 60 * 24)) : 999

        if (days < 7) tags.push({ dot: 'bg-emerald-500' })
        else if (days >= 14 && days < 30) tags.push({ dot: 'bg-blue-500' })
        else if (days >= 30 && days < 60) tags.push({ dot: 'bg-orange-500' })
        else if (days >= 60) tags.push({ dot: 'bg-red-500' })

        // New Customer (< 24 hours)
        if (c.created_at && (new Date().getTime() - new Date(c.created_at).getTime()) < 1000 * 60 * 60 * 24) {
            tags.push({ label: 'Neu', color: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' })
        }

        // Birthday check (next 7 days)
        if (c.customer_birthday) {
            const birthDate = new Date(c.customer_birthday);
            const today = new Date();
            birthDate.setFullYear(today.getFullYear());
            const diff = (birthDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
            if (diff >= 0 && diff <= 7) {
                tags.push({ label: '🎂', color: 'bg-pink-100 dark:bg-pink-500/20' })
            }
        }

        return tags
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm animate-pulse">Lade Kunden...</p>
            </div>
        )
    }

    const currentFilter = FILTERS.find(f => f.key === filter)!

    return (
        <div className="space-y-4">
            {/* Compact Filter Dropdown */}
            <div className="flex items-center justify-between gap-3" ref={filterRef}>
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span className={`w-2 h-2 rounded-full ${currentFilter.dotColor}`} />
                        <span>{currentFilter.label}</span>
                        <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {stats[filter]}
                        </span>
                        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 top-full mt-2 z-50 min-w-[200px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden"
                            >
                                {FILTERS.map((f) => {
                                    const isActive = filter === f.key
                                    return (
                                        <button
                                            key={f.key}
                                            onClick={() => {
                                                setFilter(f.key)
                                                setIsFilterOpen(false)
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors
                                                ${isActive
                                                    ? 'bg-zinc-100 dark:bg-zinc-800'
                                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                }
                                            `}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${f.dotColor}`} />
                                            <span className="flex-1 font-medium text-zinc-900 dark:text-white">
                                                {f.label}
                                                {f.description && (
                                                    <span className="text-xs text-zinc-400 ml-1.5">{f.description}</span>
                                                )}
                                            </span>
                                            <span className="text-xs font-bold text-zinc-400">{stats[f.key]}</span>
                                            {isActive && <Check size={14} className="text-emerald-500" />}
                                        </button>
                                    )
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Result Count */}
                <span className="text-xs text-zinc-400">
                    <span className="font-bold text-zinc-600 dark:text-zinc-300">{filteredCustomers.length}</span> Ergebnisse
                </span>
            </div>

            {/* Customer List */}
            <div className="space-y-1.5">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-white/5">
                        <Users className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
                        <p className="text-sm font-medium text-zinc-500">Keine Kunden in dieser Kategorie</p>
                    </div>
                ) : (
                    filteredCustomers.map((c) => {
                        const tags = getTags(c)
                        const statusDot = tags[0]?.dot

                        return (
                            <div
                                key={c.id}
                                onClick={() => onSelectCustomer(c)}
                                className="group flex items-center gap-3 bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 rounded-xl px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all cursor-pointer active:scale-[0.99]"
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-sm">
                                        {(c.customer_name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    {statusDot && (
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${statusDot}`} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`font-medium text-zinc-900 dark:text-white text-sm truncate ${c.deleted_at ? 'line-through opacity-50' : ''}`}>
                                            {c.customer_name || `Kunde #${c.customer_number || '---'}`}
                                        </span>
                                        {tags.slice(1).map((t, i) => (
                                            <span key={i} className={`px-1 py-0.5 rounded text-[10px] font-bold ${t.color}`}>
                                                {t.label}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs text-zinc-400">
                                        {c.last_scan_at ? formatDistanceToNow(new Date(c.last_scan_at), { addSuffix: true, locale: de }) : 'Nie'}
                                    </span>
                                </div>

                                {/* Stamps */}
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-bold text-sm shrink-0">
                                    <Zap size={12} className="fill-current" />
                                    {c.current_state?.stamps || 0}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Bottom Spacer */}
            <div className="h-16" />
        </div>
    )
}
