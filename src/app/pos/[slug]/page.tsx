'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Camera, X, RotateCcw, Zap, BarChart3, Send, Users, TrendingUp, Wallet, Settings } from 'lucide-react'

type Role = 'none' | 'staff' | 'chef'
type Mode = 'idle' | 'scanning' | 'camera' | 'result'

export default function POSPage() {
    const params = useParams()
    const slug = params.slug as string

    // Authentication state
    const [role, setRole] = useState<Role>('none')
    const [pin, setPin] = useState('')
    const [authError, setAuthError] = useState<string | null>(null)
    const [campaignData, setCampaignData] = useState<any>(null)

    // Scanner state
    const [mode, setMode] = useState<Mode>('idle')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [manualId, setManualId] = useState('')
    const [cameraError, setCameraError] = useState<string | null>(null)
    const scannerRef = useRef<any>(null)

    // Dashboard state
    const [stats, setStats] = useState<any>(null)
    const [view, setView] = useState<'scanner' | 'dashboard' | 'push'>('scanner')

    // Push request state
    const [pushMessage, setPushMessage] = useState('')
    const [pushSchedule, setPushSchedule] = useState('')
    const [pushSubmitting, setPushSubmitting] = useState(false)
    const [pushSuccess, setPushSuccess] = useState(false)

    // Load campaign data
    useEffect(() => {
        loadCampaignData()
    }, [slug])

    // Load stats when entering dashboard
    useEffect(() => {
        if (role === 'chef' && view === 'dashboard') {
            loadStats()
        }
    }, [role, view])

    const loadCampaignData = async () => {
        try {
            const res = await fetch(`/api/campaign/${slug}`)
            if (res.ok) {
                const data = await res.json()
                setCampaignData(data)
            }
        } catch (e) {
            console.error('Failed to load campaign:', e)
        }
    }

    const loadStats = async () => {
        try {
            const res = await fetch(`/api/pos/stats?slug=${slug}`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e) {
            console.error('Failed to load stats:', e)
        }
    }

    // PIN Authentication
    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthError(null)

        try {
            const res = await fetch(`/api/pos/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, pin })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setRole(data.role)
                setPin('')
            } else {
                setAuthError(data.error || 'Falscher PIN')
            }
        } catch (e) {
            setAuthError('Netzwerkfehler')
        }
    }

    const handleLogout = () => {
        setRole('none')
        setPin('')
        setView('scanner')
    }

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
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText) => {
                    await scanner.stop()
                    handleScan(decodedText)
                },
                () => { }
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

    // Push request submission
    const handlePushRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pushMessage.trim()) return

        setPushSubmitting(true)
        try {
            const res = await fetch('/api/pos/push-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    message: pushMessage,
                    scheduledAt: pushSchedule || null
                })
            })

            if (res.ok) {
                setPushSuccess(true)
                setPushMessage('')
                setPushSchedule('')
                setTimeout(() => setPushSuccess(false), 3000)
            }
        } catch (e) {
            console.error('Push request failed:', e)
        }
        setPushSubmitting(false)
    }

    // ========================================
    // RENDER: PIN Login Screen
    // ========================================
    if (role === 'none') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-sm space-y-8">
                    {/* Logo */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                            <Zap className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold">Passify POS</h1>
                        <p className="text-zinc-500 text-sm mt-1">{slug}</p>
                    </div>

                    {/* PIN Form */}
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">PIN eingeben</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                                className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
                                autoFocus
                            />
                        </div>

                        {authError && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-center text-sm">
                                {authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pin.length < 4}
                            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-semibold transition-all"
                        >
                            Anmelden
                        </button>
                    </form>

                    <p className="text-center text-zinc-600 text-xs">
                        Standard: 1234 (Kellner) • 9999 (Chef)
                    </p>
                </div>
            </div>
        )
    }

    // ========================================
    // RENDER: Chef Dashboard
    // ========================================
    if (role === 'chef' && view === 'dashboard') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
                {/* Header */}
                <header className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            Dashboard
                        </h1>
                        <p className="text-sm text-zinc-500">{slug}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('scanner')}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                        >
                            Scanner
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-1.5 text-zinc-500 hover:text-white text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <main className="flex-1 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Total Passes */}
                        <div className="bg-zinc-900 rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <Wallet className="w-4 h-4" />
                                Aktive Karten
                            </div>
                            <div className="text-3xl font-bold">{stats?.totalPasses || 0}</div>
                        </div>

                        {/* Today's Scans */}
                        <div className="bg-zinc-900 rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <TrendingUp className="w-4 h-4" />
                                Heute Stempel
                            </div>
                            <div className="text-3xl font-bold text-green-400">{stats?.todayStamps || 0}</div>
                        </div>

                        {/* Apple vs Google */}
                        <div className="bg-zinc-900 rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <Wallet className="w-4 h-4" />
                                Apple Wallet
                            </div>
                            <div className="text-2xl font-bold">{stats?.appleCount || 0}</div>
                        </div>

                        <div className="bg-zinc-900 rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                <Wallet className="w-4 h-4" />
                                Google Wallet
                            </div>
                            <div className="text-2xl font-bold">{stats?.googleCount || 0}</div>
                        </div>

                        {/* Redemptions */}
                        <div className="col-span-2 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-4 border border-purple-500/20">
                            <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
                                <Users className="w-4 h-4" />
                                Einlösungen (Gesamt)
                            </div>
                            <div className="text-3xl font-bold text-purple-300">{stats?.totalRedemptions || 0}</div>
                        </div>
                    </div>

                    {/* Push Request Button */}
                    <button
                        onClick={() => setView('push')}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        Push-Nachricht beantragen
                    </button>
                </main>
            </div>
        )
    }

    // ========================================
    // RENDER: Push Request Form (Chef only)
    // ========================================
    if (role === 'chef' && view === 'push') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
                <header className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-500" />
                            Push beantragen
                        </h1>
                    </div>
                    <button
                        onClick={() => setView('dashboard')}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                    >
                        Zurück
                    </button>
                </header>

                <main className="flex-1 p-4">
                    <form onSubmit={handlePushRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Nachricht</label>
                            <textarea
                                value={pushMessage}
                                onChange={(e) => setPushMessage(e.target.value)}
                                placeholder="z.B. Happy Hour heute ab 17 Uhr! 🍻"
                                rows={4}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Wann senden? (optional)</label>
                            <input
                                type="datetime-local"
                                value={pushSchedule}
                                onChange={(e) => setPushSchedule(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {pushSuccess && (
                            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-center">
                                ✅ Anfrage gesendet! Wir prüfen deine Nachricht.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!pushMessage.trim() || pushSubmitting}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                            {pushSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Zur Genehmigung senden
                                </>
                            )}
                        </button>

                        <p className="text-center text-zinc-600 text-xs">
                            Nachrichten werden von Passify geprüft bevor sie versendet werden.
                        </p>
                    </form>
                </main>
            </div>
        )
    }

    // ========================================
    // RENDER: Scanner (Staff & Chef)
    // ========================================
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        Passify Scanner
                    </h1>
                    <p className="text-sm text-zinc-500">{slug} • {role === 'chef' ? '👑 Chef' : '👤 Staff'}</p>
                </div>
                <div className="flex gap-2">
                    {role === 'chef' && (
                        <button
                            onClick={() => setView('dashboard')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm flex items-center gap-1"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Dashboard
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 text-zinc-500 hover:text-white text-sm"
                    >
                        Logout
                    </button>
                </div>
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
                        <div className="relative">
                            <div
                                id="qr-reader"
                                className="w-full aspect-square rounded-2xl overflow-hidden bg-black"
                            />
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
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto text-5xl shadow-2xl ${result.celebration
                                ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/30'
                                : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
                            }`}>
                            {result.celebration ? '🎉' : '✅'}
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
                                {result.newState.customer_name && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400">Kunde</span>
                                        <span className="text-lg font-semibold">
                                            {result.newState.customer_name}
                                        </span>
                                    </div>
                                )}
                                {result.newState.redemptions > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400">Einlösungen</span>
                                        <span className="text-lg font-semibold text-purple-400">
                                            {result.newState.redemptions}
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
                Powered by PASSIFY
            </footer>
        </div>
    )
}
