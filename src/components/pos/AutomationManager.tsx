'use client'

import { useState } from 'react'
import { Clock, Calendar, MessageSquare, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Automation {
    id: string
    day: string
    time: string
    message: string
    active: boolean
}

export function AutomationManager() {
    // Mock Data
    const [automations, setAutomations] = useState<Automation[]>([
        { id: '1', day: 'Thursday', time: '18:00', message: '🎉 Thirsty Thursday! 2-für-1 Drinks bis 20 Uhr.', active: true }
    ])

    const [isCreating, setIsCreating] = useState(false)
    const [newAuto, setNewAuto] = useState({ day: 'Friday', time: '12:00', message: '' })

    const addAutomation = () => {
        if (!newAuto.message) return
        setAutomations([...automations, {
            id: Math.random().toString(),
            ...newAuto,
            active: true
        }])
        setIsCreating(false)
        setNewAuto({ day: 'Friday', time: '12:00', message: '' })
    }

    const deleteAutomation = (id: string) => {
        setAutomations(automations.filter(a => a.id !== id))
    }

    const toggleAutomation = (id: string) => {
        setAutomations(automations.map(a => a.id === id ? { ...a, active: !a.active } : a))
    }

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Automatisierungen
                    </h3>
                    <p className="text-xs text-zinc-400">Automatische Push-Nachrichten planen</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                <AnimatePresence>
                    {automations.map(auto => (
                        <motion.div
                            key={auto.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`p-4 rounded-2xl border transition-all ${auto.active
                                    ? 'bg-blue-500/5 border-blue-500/20'
                                    : 'bg-zinc-900/50 border-white/5 opacity-60'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${auto.active ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-400'
                                            }`}>
                                            {auto.day} • {auto.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-300 line-clamp-2">{auto.message}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => toggleAutomation(auto.id)}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${auto.active ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
                                            }`}
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteAutomation(auto.id)}
                                        className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {automations.length === 0 && (
                        <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-white/10 rounded-2xl">
                            Keine aktiven Regeln
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Creation Modal (Simplified Overlay for UI) */}
            {isCreating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-3xl">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-900 border border-white/10 w-full max-w-sm p-6 rounded-3xl space-y-4 shadow-2xl"
                    >
                        <h4 className="font-bold text-lg">Neue Regel</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-zinc-500 ml-1">Tag</label>
                                <select
                                    value={newAuto.day}
                                    onChange={e => setNewAuto({ ...newAuto, day: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 ml-1">Uhrzeit</label>
                                <input
                                    type="time"
                                    value={newAuto.time}
                                    onChange={e => setNewAuto({ ...newAuto, time: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 ml-1">Nachricht</label>
                            <textarea
                                value={newAuto.message}
                                onChange={e => setNewAuto({ ...newAuto, message: e.target.value })}
                                placeholder="Nachricht eingeben..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none h-20 resize-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium text-zinc-400 hover:text-white"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={addAutomation}
                                className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20"
                            >
                                Erstellen
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
