'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Camera, X, RotateCcw, Zap } from 'lucide-react'

export default function POSPage() {
    const params = useParams()
    const slug = params.slug as string

    const [mode, setMode] = useState<'idle' | 'scanning' | 'camera' | 'result'>('idle')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [manualId, setManualId] = useState('')
    const [cameraError, setCameraError] = useState<string | null>(null)
    const scannerRef = useRef<any>(null)

    // Clean up scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { })
            }
        }
    }, [])

    // Start camera scanner
    const startCamera = async () => {
        setCameraError(null)
        setMode('camera')

        try {
            const { Html5Qrcode } = await import('html5-qrcode')

            const scanner = new Html5Qrcode('qr-reader')
            scannerRef.current = scanner

            await scanner.start(
                { facingMode: 'environment' }, // Back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText) => {
                    // QR code scanned!
                    await scanner.stop()
                    handleScan(decodedText)
                },
                () => {
                    // Ignore scan errors (no QR found yet)
                }
            )
        } catch (err: any) {
            console.error('Camera error:', err)
            setCameraError(err.message || 'Kamera konnte nicht gestartet werden')
            setMode('idle')
        }
    }

    const stopCamera = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { })
            scannerRef.current = null
        }
        setMode('idle')
    }

    // Handle scanned QR code
    const handleScan = async (passId: string) => {
        setMode('scanning')
        setError(null)

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: passId.trim(), action: 'ADD_STAMP' })
            })

            const data = await res.json()

            if (res.ok) {
                setResult(data)
                setMode('result')
                // Vibrate on success (mobile)
                if (navigator.vibrate) navigator.vibrate(200)
            } else {
                setError(data.error || 'Scan fehlgeschlagen')
                setMode('idle')
            }
        } catch (e) {
            setError('Netzwerkfehler')
            setMode('idle')
        }
    }

    // Manual scan (text input)
    const handleManualScan = async () => {
        if (!manualId.trim()) return
        handleScan(manualId.trim())
    }

    const resetScanner = () => {
        setMode('idle')
        setResult(null)
        setManualId('')
        setError(null)
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        WalletFlow Scanner
                    </h1>
                    <p className="text-sm text-zinc-500">{slug || 'Demo'}</p>
                </div>
                <div className="text-xs text-zinc-600 bg-zinc-900 px-2 py-1 rounded">v2.0</div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 flex flex-col items-center justify-center gap-4">

                {mode === 'idle' && (
                    <div className="w-full max-w-sm space-y-6">
                        {/* Camera Button */}
                        <button
                            onClick={startCamera}
                            className="w-full py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/20"
                        >
                            <Camera size={28} />
                            QR-Code scannen
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-zinc-800" />
                            <span className="text-xs text-zinc-600">oder</span>
                            <div className="flex-1 h-px bg-zinc-800" />
                        </div>

                        {/* Manual Input */}
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Pass-ID manuell eingeben"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
                            />

                            <button
                                onClick={handleManualScan}
                                disabled={!manualId.trim()}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 rounded-xl font-medium transition-colors"
                            >
                                Stempel hinzufügen
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-center text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {mode === 'camera' && (
                    <div className="w-full max-w-sm space-y-4">
                        {/* Camera View */}
                        <div className="relative">
                            <div
                                id="qr-reader"
                                className="w-full aspect-square rounded-2xl overflow-hidden bg-black"
                            />
                            {/* Close Button */}
                            <button
                                onClick={stopCamera}
                                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-black/70"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-center text-zinc-500 text-sm">
                            Halte die Kamera auf den QR-Code des Kunden
                        </p>

                        {cameraError && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-center text-sm">
                                {cameraError}
                            </div>
                        )}
                    </div>
                )}

                {mode === 'scanning' && (
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Verarbeite Stempel...</p>
                    </div>
                )}

                {mode === 'result' && result && (
                    <div className="w-full max-w-sm text-center space-y-6 animate-in zoom-in-50 duration-300">
                        {/* Success Icon */}
                        <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto text-5xl shadow-2xl shadow-green-500/30">
                            ✅
                        </div>

                        {/* Message */}
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{result.message}</h2>
                            <p className="text-zinc-500 text-sm">Aktion: {result.action}</p>
                        </div>

                        {/* State Display */}
                        {result.newState && (
                            <div className="bg-zinc-900/80 backdrop-blur p-5 rounded-2xl space-y-3">
                                {result.newState.stamps !== undefined && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400">Stempel</span>
                                        <span className="text-2xl font-bold text-green-400">
                                            {result.newState.stamps} / {result.newState.max_stamps || 10}
                                        </span>
                                    </div>
                                )}
                                {result.newState.points !== undefined && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400">Punkte</span>
                                        <span className="text-2xl font-bold text-purple-400">
                                            {result.newState.points}
                                        </span>
                                    </div>
                                )}
                                {result.newState.tier && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400">Level</span>
                                        <span className="text-lg font-semibold capitalize text-amber-400">
                                            {result.newState.tier}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Next Button */}
                        <button
                            onClick={resetScanner}
                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                            <RotateCcw size={18} />
                            Nächster Kunde
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
