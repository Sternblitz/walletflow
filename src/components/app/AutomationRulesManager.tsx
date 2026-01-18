'use client'

import { useState, useEffect } from 'react'
import {
    Cake, Calendar, Clock, Bell, Plus, Trash2, Play, Pause,
    Settings, ChevronDown, ChevronUp, Loader2, CheckCircle2,
    AlertCircle, Zap, UserX
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

interface AutomationRulesManagerProps {
    slug: string
    showCustomType?: boolean // Only show custom type in admin
}

// =============================================
// WEEKDAY HELPERS
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
    icon: typeof Cake,
    label: string,
    color: string,
    description: string
}> = {
    birthday: {
        icon: Cake,
        label: 'Geburtstag',
        color: 'pink',
        description: 'Automatische Nachrichten zum Geburtstag'
    },
    weekday_schedule: {
        icon: Calendar,
        label: 'Wochentag',
        color: 'blue',
        description: 'Nachrichten an bestimmten Wochentagen'
    },
    inactivity: {
        icon: UserX,
        label: 'Inaktivität',
        color: 'amber',
        description: 'Erinnerungen bei Inaktivität'
    },
    custom: {
        icon: Zap,
        label: 'Benutzerdefiniert',
        color: 'purple',
        description: 'Flexible eigene Regeln'
    },
}

// POS-visible rule types (no custom)
const POS_RULE_TYPES: RuleType[] = ['birthday', 'weekday_schedule', 'inactivity']

// =============================================
// MAIN COMPONENT
// =============================================

export function AutomationRulesManager({ slug, showCustomType = false }: AutomationRulesManagerProps) {
    const [rules, setRules] = useState<AutomationRule[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
    const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null)

    // Fetch rules on mount
    useEffect(() => {
        if (slug) fetchRules()
    }, [slug])

    const fetchRules = async () => {
        try {
            const res = await fetch(`/api/automations?slug=${slug}`)
            if (res.ok) {
                const data = await res.json()
                setRules(data.rules || [])
            }
        } catch (e) {
            console.error('Failed to fetch automation rules:', e)
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
                toast.success(rule.is_enabled ? 'Automatisierung deaktiviert' : 'Automatisierung aktiviert')
            }
        } catch (e) {
            toast.error('Fehler beim Umschalten')
        }
    }

    const deleteRule = async (ruleId: string) => {
        if (!confirm('Möchtest du diese Automatisierung wirklich löschen?')) return

        try {
            const res = await fetch(`/api/automations?id=${ruleId}`, { method: 'DELETE' })
            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== ruleId))
                toast.success('Automatisierung gelöscht')
            }
        } catch (e) {
            toast.error('Fehler beim Löschen')
        }
    }

    const handleSaveRule = async (rule: Partial<AutomationRule> & { ruleType?: RuleType }) => {
        try {
            const isNew = !rule.id
            const method = isNew ? 'POST' : 'PUT'

            const body = isNew ? {
                slug,
                name: rule.name,
                ruleType: rule.ruleType || rule.rule_type,
                config: rule.config,
                messageTemplate: rule.message_template,
                isEnabled: rule.is_enabled ?? true
            } : {
                id: rule.id,
                name: rule.name,
                config: rule.config,
                messageTemplate: rule.message_template,
                isEnabled: rule.is_enabled
            }

            const res = await fetch('/api/automations', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(isNew ? 'Automatisierung erstellt' : 'Automatisierung aktualisiert')
                fetchRules()
                setShowCreate(false)
                setEditingRule(null)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Fehler beim Speichern')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        }
    }

    // =============================================
    // RENDER
    // =============================================

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 h-full flex flex-col shadow-sm dark:shadow-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Automatisierungen
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Geplante Push-Nachrichten</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center hover:bg-yellow-500 hover:text-white transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Rules List */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl">
                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Keine Automatisierungen eingerichtet</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-3 text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300"
                        >
                            + Erste Automatisierung erstellen
                        </button>
                    </div>
                ) : (
                    <AnimatePresence>
                        {rules.map(rule => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                expanded={expandedRuleId === rule.id}
                                onToggle={() => toggleRule(rule)}
                                onExpand={() => setExpandedRuleId(
                                    expandedRuleId === rule.id ? null : rule.id
                                )}
                                onEdit={() => setEditingRule(rule)}
                                onDelete={() => deleteRule(rule.id)}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(showCreate || editingRule) && (
                    <RuleEditor
                        rule={editingRule}
                        showCustomType={showCustomType}
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
// RULE CARD COMPONENT
// =============================================

interface RuleCardProps {
    rule: AutomationRule
    expanded: boolean
    onToggle: () => void
    onExpand: () => void
    onEdit: () => void
    onDelete: () => void
}

function RuleCard({ rule, expanded, onToggle, onExpand, onEdit, onDelete }: RuleCardProps) {
    const typeConfig = RULE_TYPE_CONFIG[rule.rule_type]
    const Icon = typeConfig.icon

    const getScheduleDescription = () => {
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
                return `${weekdays} um ${rule.config.time || '12:00'}`

            case 'inactivity':
                return `Nach ${rule.config.days_inactive ?? 14} Tagen Inaktivität`

            default:
                return 'Benutzerdefiniert'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl border transition-all ${rule.is_enabled
                ? 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-white/10'
                : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-white/5 opacity-60'
                }`}
        >
            {/* Main Row */}
            <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={onExpand}
            >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-500/20`}>
                    <Icon className={`w-5 h-5 text-${typeConfig.color}-600 dark:text-${typeConfig.color}-400`} />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-zinc-900 dark:text-white truncate">{rule.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{getScheduleDescription()}</p>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onToggle() }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${rule.is_enabled ? 'bg-green-500' : 'bg-zinc-700'
                        }`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.is_enabled ? 'left-7' : 'left-1'
                        }`} />
                </button>

                {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-zinc-100 dark:border-white/5 pt-3 space-y-3">
                            <div className="bg-white dark:bg-black/30 border border-zinc-100 dark:border-none rounded-xl p-3">
                                <p className="text-xs text-zinc-500 mb-1">Nachricht</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-200">{rule.message_template}</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={onEdit}
                                    className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <Settings size={14} /> Bearbeiten
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="py-2 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// =============================================
// RULE EDITOR MODAL
// =============================================

interface RuleEditorProps {
    rule: AutomationRule | null
    showCustomType?: boolean
    onSave: (rule: Partial<AutomationRule> & { ruleType?: RuleType }) => void
    onClose: () => void
}

function RuleEditor({ rule, showCustomType = false, onSave, onClose }: RuleEditorProps) {
    const isEditing = !!rule

    const [name, setName] = useState(rule?.name || '')
    const [ruleType, setRuleType] = useState<RuleType>(rule?.rule_type || 'birthday')
    const [message, setMessage] = useState(rule?.message_template || '')
    const [config, setConfig] = useState<Record<string, any>>(rule?.config || {})
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim() || !message.trim()) {
            toast.error('Name und Nachricht sind erforderlich')
            return
        }

        setSaving(true)
        await onSave({
            id: rule?.id,
            name,
            ruleType: isEditing ? undefined : ruleType,
            rule_type: rule?.rule_type,
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 w-full max-w-md rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-white/5">
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {isEditing ? 'Automatisierung bearbeiten' : 'Neue Automatisierung'}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Automatische Push-Nachrichten an deine Kunden
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="z.B. Geburtstagsnachricht"
                            className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-yellow-500/50"
                        />
                    </div>

                    {/* Rule Type (only for new) */}
                    {!isEditing && (
                        <div>
                            <label className="text-xs text-zinc-400 mb-1.5 block">Typ</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(RULE_TYPE_CONFIG) as [RuleType, typeof RULE_TYPE_CONFIG[RuleType]][])
                                    .filter(([type]) => showCustomType || type !== 'custom')
                                    .map(([type, cfg]) => {
                                        const Icon = cfg.icon
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setRuleType(type)}
                                                className={`p-3 rounded-xl border transition-all text-left ${ruleType === type
                                                    ? `bg-${cfg.color}-100 dark:bg-${cfg.color}-500/20 border-${cfg.color}-500/50`
                                                    : 'bg-zinc-50 dark:bg-black/30 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 mb-1 text-${cfg.color}-600 dark:text-${cfg.color}-400`} />
                                                <p className="text-sm font-medium text-zinc-900 dark:text-white">{cfg.label}</p>
                                                <p className="text-[10px] text-zinc-500">{cfg.description}</p>
                                            </button>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Type-specific config */}
                    <div className="space-y-4">
                        {ruleType === 'birthday' && (
                            <>
                                <div>
                                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Tage vorher senden</label>
                                    <select
                                        value={config.days_before ?? 0}
                                        onChange={e => updateConfig('days_before', parseInt(e.target.value))}
                                        className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none"
                                    >
                                        <option value={0}>Am Geburtstag</option>
                                        <option value={1}>1 Tag vorher</option>
                                        <option value={2}>2 Tage vorher</option>
                                        <option value={3}>3 Tage vorher</option>
                                        <option value={7}>1 Woche vorher</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Uhrzeit</label>
                                    <input
                                        type="time"
                                        value={config.send_time || '09:00'}
                                        onChange={e => updateConfig('send_time', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {ruleType === 'weekday_schedule' && (
                            <>
                                <div>
                                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Wochentage</label>
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
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${selected
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                                        }`}
                                                >
                                                    {day.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Uhrzeit</label>
                                    <input
                                        type="time"
                                        value={config.time || '12:00'}
                                        onChange={e => updateConfig('time', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {ruleType === 'inactivity' && (
                            <div>
                                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Tage ohne Scan</label>
                                <select
                                    value={config.days_inactive ?? 14}
                                    onChange={e => updateConfig('days_inactive', parseInt(e.target.value))}
                                    className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none"
                                >
                                    <option value={7}>7 Tage</option>
                                    <option value={14}>14 Tage</option>
                                    <option value={21}>21 Tage</option>
                                    <option value={30}>30 Tage</option>
                                    <option value={60}>60 Tage</option>
                                    <option value={90}>90 Tage</option>
                                </select>
                            </div>
                        )}

                        {ruleType === 'custom' && (
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                <p className="text-xs text-purple-300">
                                    Benutzerdefinierte Regeln werden manuell ausgelöst oder können mit externen Systemen verbunden werden.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                            Nachricht
                            <span className="text-zinc-400 dark:text-zinc-600 ml-2">
                                Platzhalter: {'{{name}}'}, {'{{stamps}}'}, {'{{points}}'}
                            </span>
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="z.B. 🎂 Alles Gute zum Geburtstag, {{name}}!"
                            className="w-full h-24 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none resize-none focus:border-yellow-500/50"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim() || !message.trim()}
                        className="flex-1 py-3 bg-yellow-500 rounded-xl font-bold text-black shadow-lg shadow-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : 'Speichern'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
