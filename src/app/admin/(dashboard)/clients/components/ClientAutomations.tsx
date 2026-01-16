"use client"

import { Zap, Play, Pause, BarChart3, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ClientAutomationsProps {
    clientId: string | null
    clientName?: string
}

const MOCK_AUTOMATIONS = [
    { id: '1', name: 'Geburtstags-Überraschung', trigger: 'Birthday', active: true, executions: 45 },
    { id: '2', name: 'Inaktivitäts-Reminder', trigger: '30 Days Inactive', active: true, executions: 12 },
    { id: '3', name: 'Review Booster', trigger: '5th Visit', active: false, executions: 89 },
]

export function ClientAutomations({ clientId, clientName }: ClientAutomationsProps) {
    if (!clientId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-900/30 border border-white/5 rounded-3xl border-dashed opacity-50">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                    <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-zinc-500 font-medium">Automations</h3>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-white">Automations</h2>
                    <p className="text-xs text-zinc-500">Live Workflows</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {MOCK_AUTOMATIONS.map(auto => (
                    <div key={auto.id} className="group relative bg-zinc-900/80 border border-white/5 rounded-xl p-4 overflow-hidden hover:border-indigo-500/30 transition-all">
                        {auto.active && (
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-transparent blur-2xl -mr-8 -mt-8 pointer-events-none" />
                        )}

                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div>
                                <h3 className="font-medium text-white text-sm group-hover:text-indigo-200 transition-colors">{auto.name}</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">Trigger: {auto.trigger}</p>
                            </div>
                            <div className={`p-1.5 rounded-lg ${auto.active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-600'}`}>
                                <Zap className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                            <div className="text-xs text-zinc-400">
                                <span className="text-white font-bold">{auto.executions}</span> Executions
                            </div>
                            <div className="ml-auto flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-500 hover:text-white">
                                    <Settings2 className="w-3 h-3" />
                                </Button>
                                {auto.active ? (
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                                        <Pause className="w-3 h-3" />
                                    </Button>
                                ) : (
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-500 hover:text-white">
                                        <Play className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/5 text-center transition-colors hover:bg-white/10 cursor-pointer group">
                    <Plus className="w-6 h-6 text-zinc-500 mx-auto mb-2 group-hover:text-white group-hover:scale-110 transition-all" />
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-200">Neue Automation</span>
                </div>
            </div>
        </div>
    )
}

import { Plus } from "lucide-react"
