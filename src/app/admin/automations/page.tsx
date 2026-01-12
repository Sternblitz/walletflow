'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Zap, ArrowLeft, Loader2, Plus, Trash2, Settings, ChevronDown, ChevronUp,
    Cake, Calendar, UserX, Play, Pause, BarChart3, Clock, Send,
    RefreshCw, History, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// =============================================
// TYPES
// =============================================

type RuleType = 'birthday' | 'weekday_schedule' | 'inactivity' | 'custom'

interface AutomationRule {
    id: string
    campaign_id: string
    name: string
    rule_type: RuleType
    config: Record<string, any>
    message_template: string
    is_enabled: boolean
    created_at: string
    updated_at: string
}

interface Campaign {
    id: string
    name: string
    client: {
        name: string
        slug: string
    }
}

// =============================================
// CONSTANTS
// =============================================

const WEEKDAYS = [
    { value: 0, label: 'So', fullLabel: 'Sonntag' },
    { value: 1, label: 'Mo', fullLabel: 'Montag' },
    { value: 2, label: 'Di', fullLabel: 'Dienstag' },
    { value: 3, label: 'Mi', fullLabel: 'Mittwoch' },
    { value: 4, label: 'Do', fullLabel: 'Donnerstag' },
    { value: 5, label: 'Fr', fullLabel: 'Freitag' },
    { value: 6, label: 'Sa', fullLabel: 'Samstag' },
]

const RULE_TYPE_CONFIG: Record<RuleType, {
    icon: typeof Cake
    label: string
    color: string
    bgColor: string
    description: string
}> = {
    birthday: {
        icon: Cake,
        label: 'Geburtstag',
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
        description: 'Automatische Nachrichten zum Geburtstag'
    },
    weekday_schedule: {
        icon: Calendar,
        label: 'Wochentag',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        description: 'Nachrichten an bestimmten Wochentagen'
    },
    inactivity: {
        icon: UserX,
        label: 'Inaktivität',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        description: 'Erinnerungen bei Inaktivität'
    },
    custom: {
        icon: Zap,
        label: 'Benutzerdefiniert',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        description: 'Flexible eigene Regeln'
    },
}

// =============================================
// MAIN PAGE (with Suspense wrapper)
// =============================================

export default function AdminAutomationsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        }>
            <AdminAutomationsContent />
        </Suspense>
    )
}

function AdminAutomationsContent() {
    const searchParams = useSearchParams()
    const campaignId = searchParams.get('campaignId')

    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [selectedCampaign, setSelectedCampaign] = useState<string>(campaignId || '')
    const [rules, setRules] = useState<AutomationRule[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
    const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null)
    const [executingCron, setExecutingCron] = useState(false)

    // Fetch campaigns on mount
    useEffect(() => {
        fetchCampaigns()
    }, [])

    // Fetch rules when campaign changes
    useEffect(() => {
        if (selectedCampaign) {
            fetchRules()
        }
    }, [selectedCampaign])

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/admin/push-requests')
            if (res.ok) {
                // This API returns campaigns with pending requests, adapt as needed
                // For now we'll just use campaign IDs from rules
            }
        } catch (e) {
            console.error('Failed to fetch campaigns:', e)
        }
        setLoading(false)
    }

    const fetchRules = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/automations?campaignId=${selectedCampaign}`)
            if (res.ok) {
                const data = await res.json()
                setRules(data.rules || [])
            }
        } catch (e) {
            console.error('Failed to fetch rules:', e)
            toast.error('Fehler beim Laden der Automatisierungen')
        } finally {
            setLoading(false)
        }
    }

    const toggleRule = async (rule: AutomationRule) => {
        try {
            const res = await fetch('/api/automations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: rule.id, isEnabled: !rule.is_enabled })
            })

            if (res.ok) {
                setRules(prev => prev.map(r =>
                    r.id === rule.id ? { ...r, is_enabled: !r.is_enabled } : r
                ))
                toast.success(rule.is_enabled ? 'Deaktiviert' : 'Aktiviert')
            }
        } catch (e) {
            toast.error('Fehler')
        }
    }

    const deleteRule = async (ruleId: string) => {
        if (!confirm('Automatisierung wirklich löschen?')) return

        try {
            const res = await fetch(`/api/automations?id=${ruleId}`, { method: 'DELETE' })
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== ruleId))
                toast.success('Gelöscht')
            }
        } catch (e) {
            toast.error('Fehler beim Löschen')
        }
    }

    const handleSaveRule = async (ruleData: any) => {
        try {
            const isNew = !ruleData.id
            const method = isNew ? 'POST' : 'PUT'

            const body = isNew ? {
                campaignId: selectedCampaign,
                name: ruleData.name,
                ruleType: ruleData.ruleType,
                config: ruleData.config,
                messageTemplate: ruleData.message_template,
                isEnabled: ruleData.is_enabled ?? true
            } : {
                id: ruleData.id,
                name: ruleData.name,
                config: ruleData.config,
                messageTemplate: ruleData.message_template,
                isEnabled: ruleData.is_enabled
            }

            const res = await fetch('/api/automations', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(isNew ? 'Erstellt' : 'Aktualisiert')
                fetchRules()
                setShowCreate(false)
                setEditingRule(null)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Fehler')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        }
    }

    const triggerCronManually = async () => {
        setExecutingCron(true)
        try {
            const res = await fetch('/api/automations/execute', { method: 'POST' })
            const data = await res.json()

            if (res.ok) {
                toast.success(`Ausgeführt: ${data.executed} Regeln, ${data.skipped} übersprungen`)
            } else {
                toast.error(data.error || 'Fehler')
            }
        } catch (e) {
            toast.error('Fehler bei der Ausführung')
        } finally {
            setExecutingCron(false)
        }
    }

    const getScheduleDescription = (rule: AutomationRule) => {
        switch (rule.rule_type) {
            case 'birthday':
                const daysBefore = rule.config.days_before ?? 0
                const sendTime = rule.config.send_time ?? '09:00'
                return daysBefore === 0
                    ? `Am Geburtstag um ${sendTime}`
                    : `${daysBefore} Tag(e) vorher um ${sendTime}`

            case 'weekday_schedule':
                const weekdays = (rule.config.weekdays || [])
                    .map((d: number) => WEEKDAYS.find(w => w.value === d)?.label)
                    .filter(Boolean)
                    .join(', ')
                return `${weekdays || 'Keine Tage'} um ${rule.config.time || '12:00'}`

            case 'inactivity':
                return `Nach ${rule.config.days_inactive ?? 14} Tagen Inaktivität`

            case 'custom':
                return 'Benutzerdefiniert'

            default:
                return 'Unbekannt'
        }
    }

    // =============================================
    // RENDER
    // =============================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Automatisierungen
                            </h1>
                            <p className="text-xs text-zinc-400">Alle Kampagnen verwalten</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Manual Cron Trigger */}
                        <button
                            onClick={triggerCronManually}
                            disabled={executingCron}
                            className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                        >
                            {executingCron ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Play size={16} />
                            )}
                            Cron manuell ausführen
                        </button>

                        {/* Campaign Select */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-zinc-400">Kampagne:</label>
                            <input
                                type="text"
                                value={selectedCampaign}
                                onChange={e => setSelectedCampaign(e.target.value)}
                                placeholder="Campaign ID eingeben..."
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm w-64 outline-none focus:border-yellow-500/50"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {!selectedCampaign ? (
                    <div className="text-center py-20">
                        <Zap className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                        <h2 className="text-xl font-bold mb-2">Kampagne auswählen</h2>
                        <p className="text-zinc-400">Gib eine Campaign ID ein, um die Automatisierungen zu verwalten.</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <>
                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-yellow-500/10 rounded-xl">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <span className="text-zinc-400 text-sm">Gesamt</span>
                                </div>
                                <p className="text-3xl font-bold">{rules.length}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-500/10 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                    <span className="text-zinc-400 text-sm">Aktiv</span>
                                </div>
                                <p className="text-3xl font-bold">{rules.filter(r => r.is_enabled).length}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-pink-500/10 rounded-xl">
                                        <Cake className="w-5 h-5 text-pink-500" />
                                    </div>
                                    <span className="text-zinc-400 text-sm">Geburtstag</span>
                                </div>
                                <p className="text-3xl font-bold">{rules.filter(r => r.rule_type === 'birthday').length}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-500/10 rounded-xl">
                                        <UserX className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <span className="text-zinc-400 text-sm">Inaktivität</span>
                                </div>
                                <p className="text-3xl font-bold">{rules.filter(r => r.rule_type === 'inactivity').length}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Regeln</h2>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="px-4 py-2 bg-yellow-500 text-black rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors"
                            >
                                <Plus size={18} />
                                Neue Regel
                            </button>
                        </div>

                        {/* Rules List */}
                        {rules.length === 0 ? (
                            <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-white/10 rounded-2xl">
                                <Zap className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                                <p className="text-zinc-400">Keine Automatisierungen für diese Kampagne</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rules.map(rule => {
                                    const typeConfig = RULE_TYPE_CONFIG[rule.rule_type]
                                    const Icon = typeConfig.icon
                                    const isExpanded = expandedRuleId === rule.id

                                    return (
                                        <motion.div
                                            key={rule.id}
                                            layout
                                            className={`bg-zinc-900/50 border rounded-2xl transition-all ${rule.is_enabled ? 'border-white/10' : 'border-white/5 opacity-60'
                                                }`}
                                        >
                                            <div
                                                className="p-5 flex items-center gap-4 cursor-pointer"
                                                onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                                            >
                                                <div className={`w-12 h-12 rounded-xl ${typeConfig.bgColor} flex items-center justify-center`}>
                                                    <Icon className={`w-6 h-6 ${typeConfig.color}`} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold truncate">{rule.name}</h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}>
                                                            {typeConfig.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-zinc-400">{getScheduleDescription(rule)}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleRule(rule) }}
                                                        className={`w-14 h-7 rounded-full transition-colors relative ${rule.is_enabled ? 'bg-green-500' : 'bg-zinc-700'
                                                            }`}
                                                    >
                                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${rule.is_enabled ? 'left-8' : 'left-1'
                                                            }`} />
                                                    </button>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-black/30 rounded-xl p-4">
                                                                    <p className="text-xs text-zinc-500 mb-2">Nachricht</p>
                                                                    <p className="text-sm">{rule.message_template}</p>
                                                                </div>
                                                                <div className="bg-black/30 rounded-xl p-4">
                                                                    <p className="text-xs text-zinc-500 mb-2">Konfiguration</p>
                                                                    <pre className="text-xs text-zinc-400 overflow-auto">
                                                                        {JSON.stringify(rule.config, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setEditingRule(rule)}
                                                                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                                                >
                                                                    <Settings size={16} />
                                                                    Bearbeiten
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteRule(rule.id)}
                                                                    className="py-2.5 px-5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>

                                                            <div className="text-xs text-zinc-500 flex justify-between">
                                                                <span>Erstellt: {new Date(rule.created_at).toLocaleDateString('de-DE')}</span>
                                                                <span>Aktualisiert: {new Date(rule.updated_at).toLocaleDateString('de-DE')}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(showCreate || editingRule) && (
                    <AdminRuleEditor
                        rule={editingRule}
                        onSave={handleSaveRule}
                        onClose={() => {
                            setShowCreate(false)
                            setEditingRule(null)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

// =============================================
// ADMIN RULE EDITOR (with all options)
// =============================================

interface AdminRuleEditorProps {
    rule: AutomationRule | null
    onSave: (rule: any) => void
    onClose: () => void
}

function AdminRuleEditor({ rule, onSave, onClose }: AdminRuleEditorProps) {
    const isEditing = !!rule

    const [name, setName] = useState(rule?.name || '')
    const [ruleType, setRuleType] = useState<RuleType>(rule?.rule_type || 'birthday')
    const [message, setMessage] = useState(rule?.message_template || '')
    const [config, setConfig] = useState<Record<string, any>>(rule?.config || {})
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim() || !message.trim()) {
            toast.error('Name und Nachricht erforderlich')
            return
        }

        setSaving(true)
        await onSave({
            id: rule?.id,
            name,
            ruleType: isEditing ? undefined : ruleType,
            config,
            message_template: message,
            is_enabled: rule?.is_enabled ?? true
        })
        setSaving(false)
    }

    const updateConfig = (key: string, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6 border-b border-white/5">
                    <h4 className="text-xl font-bold">
                        {isEditing ? 'Regel bearbeiten' : 'Neue Automatisierung'}
                    </h4>
                    <p className="text-sm text-zinc-400 mt-1">Admin-Ansicht mit allen Optionen</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="z.B. Geburtstagsnachricht"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500/50"
                        />
                    </div>

                    {/* Type Selection (all types including custom) */}
                    {!isEditing && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Typ</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(RULE_TYPE_CONFIG) as [RuleType, typeof RULE_TYPE_CONFIG[RuleType]][]).map(([type, cfg]) => {
                                    const Icon = cfg.icon
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setRuleType(type)}
                                            className={`p-4 rounded-xl border transition-all text-left ${ruleType === type
                                                ? `${cfg.bgColor} border-current ${cfg.color}`
                                                : 'bg-black/30 border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 mb-2 ${cfg.color}`} />
                                            <p className="font-medium">{cfg.label}</p>
                                            <p className="text-xs text-zinc-500 mt-1">{cfg.description}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Type-specific config */}
                    <div className="space-y-4">
                        {ruleType === 'birthday' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Tage vorher</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={config.days_before ?? 0}
                                        onChange={e => updateConfig('days_before', parseInt(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Uhrzeit</label>
                                    <input
                                        type="time"
                                        value={config.send_time || '09:00'}
                                        onChange={e => updateConfig('send_time', e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {ruleType === 'weekday_schedule' && (
                            <>
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Wochentage</label>
                                    <div className="flex gap-1">
                                        {WEEKDAYS.map(day => {
                                            const selected = (config.weekdays || []).includes(day.value)
                                            return (
                                                <button
                                                    key={day.value}
                                                    onClick={() => {
                                                        const current = config.weekdays || []
                                                        const updated = selected
                                                            ? current.filter((d: number) => d !== day.value)
                                                            : [...current, day.value]
                                                        updateConfig('weekdays', updated)
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${selected ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'
                                                        }`}
                                                >
                                                    {day.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Uhrzeit</label>
                                    <input
                                        type="time"
                                        value={config.time || '12:00'}
                                        onChange={e => updateConfig('time', e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {ruleType === 'inactivity' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Tage ohne Scan</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={config.days_inactive ?? 14}
                                        onChange={e => updateConfig('days_inactive', parseInt(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Check-Stunde</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={config.check_hour ?? 10}
                                        onChange={e => updateConfig('check_hour', parseInt(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {ruleType === 'custom' && (
                            <div className="space-y-4">
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                    <p className="text-sm text-purple-300 mb-3">
                                        Benutzerdefinierte Regeln für spezielle Trigger
                                    </p>
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-1 block">Always Run (für Tests)</label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={config.always_run ?? false}
                                                onChange={e => updateConfig('always_run', e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">Bei jedem Cron-Lauf ausführen</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Nachricht
                        </label>
                        <p className="text-xs text-zinc-500 mb-2">
                            Platzhalter: {'{{name}}'}, {'{{stamps}}'}, {'{{points}}'}, {'{{reward}}'}
                        </p>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="🎂 Alles Gute, {{name}}!"
                            className="w-full h-28 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none resize-none focus:border-yellow-500/50"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim() || !message.trim()}
                        className="flex-1 py-3 bg-yellow-500 rounded-xl font-bold text-black disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : 'Speichern'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
