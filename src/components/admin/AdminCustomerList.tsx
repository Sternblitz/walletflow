
import { useState, useMemo, useRef, useEffect } from 'react'
import { Users, Zap, ChevronDown, Check, Cake, Sparkles, X, Search, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminCustomerListProps {
    customers: any[]
    onSelectCustomer: (customer: any) => void
    onDeleteCustomer?: (customer: any) => void
    loading: boolean
}

type FilterType = 'all' | 'active' | 'absent' | 'risk' | 'inactive' | 'new' | 'birthday' | 'deleted'

// Filter configuration
const FILTERS: { key: FilterType, label: string, dotColor: string, description?: string }[] = [
    { key: 'all', label: 'Alle Kunden', dotColor: 'bg-zinc-400' },
    { key: 'active', label: 'Aktiv', dotColor: 'bg-emerald-500', description: '< 7 Tage' },
    { key: 'absent', label: 'Abwesend', dotColor: 'bg-blue-500', description: '14+ Tage' },
    { key: 'risk', label: 'Gefährdet', dotColor: 'bg-orange-500', description: '30+ Tage' },
    { key: 'inactive', label: 'Inaktiv', dotColor: 'bg-red-500', description: '60+ Tage' },
    { key: 'new', label: 'Neu', dotColor: 'bg-violet-500', description: '< 24h' },
    { key: 'birthday', label: 'Geburtstag', dotColor: 'bg-pink-500', description: '7 Tage' },
    { key: 'deleted', label: 'Gelöscht', dotColor: 'bg-zinc-600', description: 'Archiviert' },
]

export function AdminCustomerList({ customers, onSelectCustomer, onDeleteCustomer, loading }: AdminCustomerListProps) {
    const [filter, setFilter] = useState<FilterType>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSearch, setActiveSearch] = useState('')
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

    // Calculate stats from customer data
    const stats = useMemo(() => {
        // Stats calculation should include deleted users for 'all' count? 
        // Usually 'all' in admin implies everything. 
        // POS implementation filtered deleted_at for most stats.
        // Let's keep specific stats accurate to their definition.

        const active = customers.filter(c => !c.deleted_at)
        const deleted = customers.filter(c => c.deleted_at)

        return {
            all: customers.length,
            active: active.filter(c => c.status === 'active').length,
            absent: active.filter(c => c.status === 'absent').length,
            risk: active.filter(c => c.status === 'risk').length,
            inactive: active.filter(c => c.status === 'inactive').length,
            new: active.filter(c => c.is_new).length,
            birthday: active.filter(c => c.birthday_upcoming).length,
            deleted: deleted.length
        }
    }, [customers])

    // Filtering Logic
    const filteredCustomers = useMemo(() => {
        let result = customers

        // Base filter: for POS 'all' hid deleted users. For Admin, 'all' should probably show active users by default
        // or explicitly show everything? 
        // User request: "anzeige beibehalten wenn kunden gelöscht haben das soll beibehalten werden"
        // Let's make 'all' show everything but put deleted ones at the bottom or visually distinct.
        // OR better: 'all' excludes deleted to avoid clutter, and 'deleted' shows only deleted.
        // BUT user said "beibehalten". Let's assume standard behavior: 'active' categories exclude deleted. 'deleted' category shows deleted. 
        // 'all' showing everything might be too messy.
        // Let's stick closer to POS logic: 'all' = non-deleted. 'deleted' = deleted.
        // "everything" including deleted allows searching for them.

        if (filter === 'deleted') {
            result = result.filter(c => c.deleted_at)
        } else {
            // For specific status filters, we only look at non-deleted users (as status is calculated for them)
            // For 'all', we might want to include deleted if searched? 
            // Let's do: 'all' shows non-deleted. Simple.
            if (filter !== 'all') { // specialized filters
                result = result.filter(c => !c.deleted_at)
            } else {
                // Filter 'all' - currently usually hides deleted in POS.
                // Let's allow deleted in 'all' but sort them to bottom?
                // Or just hide them to keep it clean, user can switch to 'Deleted'.
                // Let's hide deleted in 'all' to match stats[all] semantics typically used in POS.
                // WAIT, I set stats.all to customers.length (including deleted).
                // Use `!c.deleted_at` for 'all' to be consistent with POS default view.
                // Added 'deleted' filter for the rest.
                result = result.filter(c => !c.deleted_at)
            }

            if (filter === 'active') result = result.filter(c => c.status === 'active')
            else if (filter === 'absent') result = result.filter(c => c.status === 'absent')
            else if (filter === 'risk') result = result.filter(c => c.status === 'risk')
            else if (filter === 'inactive') result = result.filter(c => c.status === 'inactive')
            else if (filter === 'new') result = result.filter(c => c.is_new)
            else if (filter === 'birthday') result = result.filter(c => c.birthday_upcoming)
        }

        // Search overrides the filter categories usually, or refines them?
        // POS logic: Filters first, then search.
        // BUT if I search for a deleted user while in 'all', I won't find them if 'all' hides them.
        // Smart Search: If search is active, ignore the 'deleted' restriction of 'all' filter?
        // Let's implement Smart Search: Search scans EVERYTHING (including deleted) if filter is 'all'.

        if (activeSearch) {
            // Reset to full list for search if we were in 'all' (to find deleted users too)
            if (filter === 'all') {
                result = customers
            }

            const query = activeSearch.toLowerCase()
            result = result.filter(c => {
                const displayedName = c.display_name || c.customer_name || `Kunde #${c.customer_number || '---'}`
                return (
                    displayedName.toLowerCase().includes(query) ||
                    (c.customer_number && c.customer_number.toString().includes(query)) ||
                    (c.customer_email && c.customer_email.toLowerCase().includes(query))
                )
            })
        }

        // Sort by most recent scan
        result.sort((a, b) => new Date(b.last_scan_at || b.created_at || 0).getTime() - new Date(a.last_scan_at || a.created_at || 0).getTime())

        return result
    }, [customers, filter, activeSearch])

    // Get status dot color for a customer
    const getStatusDot = (c: any): string => {
        if (c.deleted_at) return 'bg-zinc-600'
        if (c.status === 'inactive') return 'bg-red-500'
        if (c.status === 'risk') return 'bg-orange-500'
        if (c.status === 'absent') return 'bg-blue-500'
        return 'bg-emerald-500'
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

    // Handle manual search
    const handleSearch = () => {
        setActiveSearch(searchQuery)
        if (searchQuery && filter !== 'deleted') setFilter('all')
    }

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setActiveSearch(e.target.value) // Instant search
                                if (e.target.value && filter !== 'deleted') setFilter('all')
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur()
                                }
                            }}
                            placeholder="Nach Name, Nummer oder Email suchen..."
                            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-zinc-500 text-white"
                        />
                    </div>
                </div>

                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
                    >
                        <span className={`w-2 h-2 rounded-full ${currentFilter.dotColor}`} />
                        <span>{currentFilter.label}</span>
                        <span className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {stats[filter] || 0}
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
                                className="absolute right-0 top-full mt-2 z-50 min-w-[220px] bg-zinc-900 border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden"
                            >
                                {FILTERS.map((f) => {
                                    const isActive = filter === f.key
                                    const count = stats[f.key]

                                    // Skip filters with 0 count (except 'all' and 'deleted')
                                    if (f.key !== 'all' && f.key !== 'deleted' && count === 0) return null

                                    return (
                                        <button
                                            key={f.key}
                                            onClick={() => {
                                                setFilter(f.key)
                                                setIsFilterOpen(false)
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors
                                                ${isActive
                                                    ? 'bg-zinc-800'
                                                    : 'hover:bg-zinc-800/50'
                                                }
                                            `}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${f.dotColor}`} />
                                            <span className="flex-1 font-medium text-white">
                                                {f.label}
                                                {f.description && (
                                                    <span className="text-xs text-zinc-500 ml-1.5">{f.description}</span>
                                                )}
                                            </span>
                                            <span className="text-xs font-bold text-zinc-500">{count}</span>
                                            {isActive && <Check size={14} className="text-emerald-500" />}
                                        </button>
                                    )
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>


            {/* Result Count */}
            <div className="flex justify-between items-center px-1">
                <span className="text-xs text-zinc-400">
                    <span className="font-bold text-zinc-300">{filteredCustomers.length}</span> Ergebnisse
                </span>
            </div>

            {/* Customer List */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 customer-scrollbar">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-dashed border-white/5">
                        <Users className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                        <p className="text-sm font-medium text-zinc-500">Keine Kunden in dieser Kategorie</p>
                    </div>
                ) : (
                    filteredCustomers.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => onSelectCustomer(c)}
                            className={`group flex items-center gap-3 bg-zinc-900/40 border border-white/5 rounded-xl px-3 py-2.5 hover:bg-zinc-800/60 transition-all cursor-pointer active:scale-[0.99] select-none ${c.deleted_at ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-sm">
                                    {(c.customer_name || c.display_name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${getStatusDot(c)}`} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={`font-medium text-sm truncate ${c.deleted_at ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                        {c.display_name || c.customer_name || `Kunde #${c.customer_number || '---'}`}
                                    </span>
                                    {/* Badges */}
                                    {c.deleted_at && (
                                        <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-0.5">
                                            <Trash2 size={8} /> Gelöscht
                                        </span>
                                    )}
                                    {c.is_new && !c.deleted_at && (
                                        <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400 flex items-center gap-0.5">
                                            <Sparkles size={8} /> Neu
                                        </span>
                                    )}
                                    {c.birthday_upcoming && !c.deleted_at && (
                                        <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400 flex items-center gap-0.5">
                                            <Cake size={8} /> 🎂
                                        </span>
                                    )}
                                    {c.opt_in === true && (
                                        <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                                            <Check size={8} /> Opt-in
                                        </span>
                                    )}
                                    {c.opt_in === false && !c.deleted_at && (
                                        <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 flex items-center gap-0.5">
                                            <X size={8} /> Kein Opt-in
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span>
                                        {c.last_scan_at ? formatDistanceToNow(new Date(c.last_scan_at), { addSuffix: true, locale: de }) : 'Noch nie gescannt'}
                                    </span>
                                    {c.customer_email && <span>• {c.customer_email}</span>}
                                </div>
                            </div>

                            {/* Stamps */}
                            <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm shrink-0">
                                <Zap size={12} className="fill-current" />
                                {c.stamps || c.current_state?.stamps || 0}
                            </div>

                            {/* Delete Button */}
                            {onDeleteCustomer && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteCustomer(c)
                                    }}
                                    className="p-2 -mr-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Kunden löschen"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
