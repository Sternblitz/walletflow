'use client'

import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { GripVertical, User, Cake, Mail, Phone, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FieldConfig {
    id: string
    label: string
    icon: React.ElementType
    enabled: boolean
    required: boolean
    placeholder?: string
}

interface OnboardingFieldEditorProps {
    fields: FieldConfig[]
    onChange: (fields: FieldConfig[]) => void
}

const DEFAULT_FIELDS: FieldConfig[] = [
    { id: 'name', label: 'Name', icon: User, enabled: true, required: false, placeholder: 'Max Mustermann' },
    { id: 'birthday', label: 'Geburtstag', icon: Cake, enabled: true, required: false },
    { id: 'email', label: 'E-Mail', icon: Mail, enabled: false, required: false, placeholder: 'max@beispiel.de' },
    { id: 'phone', label: 'Telefon', icon: Phone, enabled: false, required: false, placeholder: '+49 123 456789' },
]

export function OnboardingFieldEditor({ fields, onChange }: OnboardingFieldEditorProps) {
    const [expandedField, setExpandedField] = useState<string | null>(null)

    const toggleField = (id: string) => {
        onChange(fields.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
    }

    const toggleRequired = (id: string) => {
        onChange(fields.map(f => f.id === id ? { ...f, required: !f.required } : f))
    }

    const updatePlaceholder = (id: string, placeholder: string) => {
        onChange(fields.map(f => f.id === id ? { ...f, placeholder } : f))
    }

    return (
        <div className="space-y-3">
            <Reorder.Group axis="y" values={fields} onReorder={onChange} className="space-y-2">
                {fields.map((field) => (
                    <Reorder.Item key={field.id} value={field}>
                        <motion.div
                            layout
                            className={cn(
                                "rounded-xl border transition-all",
                                field.enabled
                                    ? "bg-white/5 border-white/10"
                                    : "bg-white/[0.02] border-white/5"
                            )}
                        >
                            {/* Field Header */}
                            <div className="flex items-center gap-3 p-3">
                                {/* Drag Handle */}
                                <div className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 transition-colors">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Icon */}
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    field.enabled
                                        ? "bg-violet-500/20 text-violet-400"
                                        : "bg-white/5 text-white/30"
                                )}>
                                    <field.icon className="w-4 h-4" />
                                </div>

                                {/* Label */}
                                <span className={cn(
                                    "flex-1 text-sm font-medium transition-colors",
                                    field.enabled ? "text-white" : "text-white/40"
                                )}>
                                    {field.label}
                                </span>

                                {/* Expand Button */}
                                {field.enabled && (
                                    <button
                                        onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-all"
                                    >
                                        {expandedField === field.id ? (
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                )}

                                {/* Toggle */}
                                <button
                                    onClick={() => toggleField(field.id)}
                                    className={cn(
                                        "p-1 rounded-lg transition-colors",
                                        field.enabled
                                            ? "text-emerald-400 hover:text-emerald-300"
                                            : "text-white/20 hover:text-white/40"
                                    )}
                                >
                                    {field.enabled ? (
                                        <ToggleRight className="w-6 h-6" />
                                    ) : (
                                        <ToggleLeft className="w-6 h-6" />
                                    )}
                                </button>
                            </div>

                            {/* Expanded Options */}
                            {field.enabled && expandedField === field.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3"
                                >
                                    {/* Required Toggle */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/50">Pflichtfeld</span>
                                        <button
                                            onClick={() => toggleRequired(field.id)}
                                            className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                                                field.required
                                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                    : "bg-white/5 text-white/40 border border-white/10"
                                            )}
                                        >
                                            {field.required ? 'Erforderlich' : 'Optional'}
                                        </button>
                                    </div>

                                    {/* Placeholder (if applicable) */}
                                    {field.placeholder !== undefined && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-white/40">Platzhalter-Text</label>
                                            <Input
                                                value={field.placeholder}
                                                onChange={(e) => updatePlaceholder(field.id, e.target.value)}
                                                className="bg-white/5 border-white/10 h-8 text-xs"
                                                placeholder="Platzhalter..."
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            {/* Info */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <GripVertical className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] text-violet-300">Ziehe Felder um die Reihenfolge zu ändern</span>
            </div>
        </div>
    )
}

// Export default fields for initialization
export { DEFAULT_FIELDS }
