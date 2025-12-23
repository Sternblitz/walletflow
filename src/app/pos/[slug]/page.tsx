'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function POSPage() {
    const params = useParams()
    const slug = params.slug as string

    const [mode, setMode] = useState<'idle' | 'scanning' | 'result'>('idle')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [manualId, setManualId] = useState('')
    const videoRef = useRef<HTMLVideoElement>(null)

    // Manual scan (text input for testing)
    const handleManualScan = async () => {
        if (!manualId.trim()) return

        setMode('scanning')
        setError(null)

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: manualId.trim(), action: 'ADD_STAMP' })
            })

            const data = await res.json()

            if (res.ok) {
                setResult(data)
                setMode('result')
                // Play success sound
                new Audio('/sounds/success.mp3').play().catch(() => { })
            } else {
                setError(data.error || 'Scan failed')
                setMode('idle')
            }
        } catch (e) {
            setError('Network error')
            setMode('idle')
        }
    }

    const resetScanner = () => {
        setMode('idle')
        setResult(null)
        setManualId('')
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">📱 POS Scanner</h1>
                    <p className="text-sm text-zinc-500">{slug || 'Demo'}</p>
                </div>
                <div className="text-xs text-zinc-600">v1.0</div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 flex flex-col items-center justify-center gap-6">

                {mode === 'idle' && (
                    <>
                        {/* Manual Input (for testing without camera) */}
                        <div className="w-full max-w-sm space-y-4">
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-5xl">
                                    📷
                                </div>
                                <h2 className="text-lg font-semibold">Kunden-Pass scannen</h2>
                                <p className="text-zinc-500 text-sm">QR-Code des Kunden scannen oder ID eingeben</p>
                            </div>

                            <input
                                type="text"
                                placeholder="Pass-ID eingeben (zum Testen)"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
                            />

                            <button
                                onClick={handleManualScan}
                                disabled={!manualId.trim()}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-semibold text-lg transition-colors"
                            >
                                ✅ Stempel hinzufügen
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-center">
                                {error}
                            </div>
                        )}
                    </>
                )}

                {mode === 'scanning' && (
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Verarbeite...</p>
                    </div>
                )}

                {mode === 'result' && result && (
                    <div className="w-full max-w-sm text-center space-y-6 animate-in zoom-in-50">
                        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto text-6xl shadow-2xl shadow-green-500/30">
                            ✅
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-2">{result.message}</h2>
                            <p className="text-zinc-500">Aktion: {result.action}</p>
                        </div>

                        {result.newState && (
                            <div className="bg-zinc-900 p-4 rounded-xl space-y-2">
                                {result.newState.stamps !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Stempel:</span>
                                        <span className="font-bold text-green-400">{result.newState.stamps} / {result.newState.max_stamps || 10}</span>
                                    </div>
                                )}
                                {result.newState.points !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Punkte:</span>
                                        <span className="font-bold text-purple-400">{result.newState.points}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={resetScanner}
                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-colors"
                        >
                            Nächster Kunde →
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="p-4 border-t border-white/10 text-center text-xs text-zinc-600">
                Powered by WALLETFLOW
            </footer>
        </div>
    )
}
