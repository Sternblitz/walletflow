
import { useState, useMemo } from 'react'
import { Search, Info, Users, Filter, ArrowUpDown, Tag, Zap, Mail, Phone, Cake } from 'lucide-react'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { de } from 'date-fns/locale'

interface CustomerListProps {
    customers: any[]
    onSelectCustomer: (customer: any) => void
    loading: boolean
}

type FilterType = 'all' | 'recent' | 'absent' | 'risk' | 'inactive'

const INACTIVITY_THRESHOLDS = {
    recent: 7,
    absent: 14,
    risk: 30,
    inactive: 60
}

export function CustomerList({ customers, onSelectCustomer, loading }: CustomerListProps) {
    const [filter, setFilter] = useState<FilterType>('all')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<'recent' | 'name' | 'stamps'>('recent')

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

    // Filtering & Sorting Logic
    const filteredCustomers = useMemo(() => {
        let result = [...customers]
        const now = new Date()

        // 1. Filter by Status
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

        // 2. Search
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(c =>
                (c.customer_name?.toLowerCase().includes(q)) ||
                (c.customer_email?.toLowerCase().includes(q)) ||
                (c.customer_phone?.includes(q))
            )
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sort === 'recent') return new Date(b.last_scan_at || 0).getTime() - new Date(a.last_scan_at || 0).getTime()
            if (sort === 'name') return (a.customer_name || '').localeCompare(b.customer_name || '')
            if (sort === 'stamps') return (b.current_state?.stamps || 0) - (a.current_state?.stamps || 0)
            return 0
        })

        return result
    }, [customers, filter, search, sort])


    // Helper for visual tags
    const getTags = (c: any) => {
        const tags = []
        const days = c.last_scan_at ? Math.floor((new Date().getTime() - new Date(c.last_scan_at).getTime()) / (1000 * 60 * 60 * 24)) : 999

        // Status Tags
        if (days < 7) tags.push({ label: 'Aktiv', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', dot: 'bg-emerald-500' })
        else if (days >= 14 && days < 30) tags.push({ label: '14 Tage nicht da', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400', dot: 'bg-blue-500' })
        else if (days >= 30 && days < 60) tags.push({ label: 'Gefährdet', color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', dot: 'bg-orange-500' })
        else if (days >= 60) tags.push({ label: 'Inaktiv', color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400', dot: 'bg-red-500' })

        // New Customer (< 24 hours)
        if (c.created_at && (new Date().getTime() - new Date(c.created_at).getTime()) < 1000 * 60 * 60 * 24) {
            tags.push({ label: 'Neu', color: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400', icon: '🆕' })
        }

        // Birthday check (next 7 days)
        if (c.customer_birthday) {
            const birthDate = new Date(c.customer_birthday);
            const today = new Date();
            birthDate.setFullYear(today.getFullYear());

            // Handle year wrap
            const diff = (birthDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

            if (diff >= 0 && diff <= 7) {
                tags.push({ label: 'Geburtstag', color: 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400', icon: '🎂' })
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

    return (
        <div className="space-y-4">
            {/* 1. Quick Info Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <FilterCard
                    label="Alle Kunden"
                    count={stats.all}
                    active={filter === 'all'}
                    onClick={() => setFilter('all')}
                    color="zinc"
                />
                <FilterCard
                    label="Aktiv (<7 Tage)"
                    count={stats.recent}
                    active={filter === 'recent'}
                    onClick={() => setFilter('recent')}
                    color="emerald"
                />
                <FilterCard
                    label="14 Tage nicht da"
                    count={stats.absent}
                    active={filter === 'absent'}
                    onClick={() => setFilter('absent')}
                    color="blue"
                />
                <FilterCard
                    label="Gefährdet (>30 Tage)"
                    count={stats.risk}
                    active={filter === 'risk'}
                    onClick={() => setFilter('risk')}
                    color="orange"
                />
                <FilterCard
                    label="Inaktiv (>60 Tage)"
                    count={stats.inactive}
                    active={filter === 'inactive'}
                    onClick={() => setFilter('inactive')}
                    color="red"
                />
            </div>

            {/* 2. Search & Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Suche nach Name, E-Mail..."
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <SortButton active={sort === 'recent'} onClick={() => setSort('recent')} label="Zuletzt" />
                    <SortButton active={sort === 'name'} onClick={() => setSort('name')} label="Name" />
                    <SortButton active={sort === 'stamps'} onClick={() => setSort('stamps')} label="Stempel" />
                </div>
            </div>

            {/* 3. Customer List */}
            <div className="space-y-3 pb-20">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/5">
                        <Users className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Keine Kunden gefunden</h3>
                        <p className="text-zinc-500 text-sm">Versuche die Filter anzupassen.</p>
                    </div>
                ) : (
                    filteredCustomers.map((c) => {
                        const tags = getTags(c)
                        const primaryTag = tags[0] // Main status tag

                        return (
                            <div
                                key={c.id}
                                onClick={() => onSelectCustomer(c)}
                                className={`group relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all cursor-pointer shadow-sm dark:shadow-none active:scale-[0.99]`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Avatar & Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Avatar with Status Dot */}
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-lg border border-zinc-200 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                                                {(c.customer_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            {primaryTag?.dot && (
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${primaryTag.dot}`} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className={`font-bold text-zinc-900 dark:text-white truncate ${c.deleted_at ? 'line-through opacity-50' : ''}`}>
                                                    {c.customer_name || `Kunde #${c.customer_number || '---'}`}
                                                </h3>
                                                {/* Extra visual tags */}
                                                {tags.slice(1).map((t, i) => (
                                                    <span key={i} className={`hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.color}`}>
                                                        {t.icon || t.label}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span>{c.last_scan_at ? formatDistanceToNow(new Date(c.last_scan_at), { addSuffix: true, locale: de }) : 'Nie'}</span>
                                                <span className="opacity-50">•</span>
                                                <span>{c.current_state?.stamps || 0} Stempel</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Stamps & Chevron */}
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-500 text-lg">
                                            <Zap size={16} className="fill-current" />
                                            {c.current_state?.stamps || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

function FilterCard({ label, count, active, onClick, color }: { label: string, count: number, active: boolean, onClick: () => void, color: string }) {
    const activeClasses = {
        blue: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black',
        emerald: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-black',
        yellow: 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-black',
        orange: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-black',
        red: 'bg-red-500 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-black',
    }[color] || 'bg-zinc-900 text-white'

    const inactiveClasses = 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'

    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-2xl flex flex-col items-start gap-1 transition-all w-full text-left ${active ? activeClasses : inactiveClasses}`}
        >
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
            <span className="text-xl font-black">{count}</span>
        </button>
    )
}

function SortButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${active
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white'
                : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500'
                }`}
        >
            {label}
        </button>
    )
}
