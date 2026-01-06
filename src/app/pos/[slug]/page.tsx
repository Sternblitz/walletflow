'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Camera, X, RotateCcw, Zap, BarChart3, Send, Users, TrendingUp, Wallet, Settings, LogOut, ChevronRight, Check, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    const [label, setLabel] = useState<string>('')

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
                setLabel(data.label || (data.role === 'chef' ? 'Chef' : 'Mitarbeiter'))
                setPin('')
            } else {
                setAuthError(data.error || 'Falscher PIN')
                // Shake effect could be added here
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
                if (navigator.vibrate) navigator.vibrate([100, 50, 100])
            } else {
                setError(data.error || 'Scan fehlgeschlagen')
                setMode('idle')
                if (navigator.vibrate) navigator.vibrate(500)
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

    // --- Components ---

    const Background = () => (
        <div className="fixed inset-0 z-0 bg-black">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        </div>
    )

    // ========================================
    // RENDER: PIN Login Screen
    // ========================================
    if (role === 'none') {
        return (
            <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
                <Background />
                <div className="relative z-10 w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                    {/* Logo */}
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 rotate-3 transform hover:rotate-6 transition-transform">
                            <Zap className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight">Passify POS</h1>
                            <p className="text-emerald-400 font-medium mt-1 uppercase tracking-widest text-xs">{slug}</p>
                        </div>
                    </div>

                    {/* PIN Form */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3 text-center">Zugangspin eingeben</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-full px-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white text-center text-3xl tracking-[0.6em] placeholder:tracking-normal placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    autoFocus
                                />
                            </div>

                            {authError && (
                                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-center text-sm font-medium animate-in slide-in-from-top-2">
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={pin.length < 4}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                            >
                                Anmelden
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-zinc-600 text-xs">
                        Powered by <span className="text-zinc-400 font-semibold">PASSIFY</span>
                    </p>
                </div>
            </div>
        )
    }

    // ========================================
    // RENDER: Chef Dashboard
    // ========================================
    if (role === 'chef' && view === 'dashboard') {
        const formatDate = (dateString: string) => {
            const date = new Date(dateString)
            return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(date)
        }

        return (
            <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black pointer-events-none" />

                {/* Header */}
                <header className="relative z-10 px-6 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Dashboard
                        </h1>
                        <p className="text-sm text-purple-400 font-medium">Hallo {label || 'Chef'} 👋</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setView('scanner')}
                            className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Main Grid */}
                <main className="relative z-10 flex-1 px-4 pb-6 space-y-6 overflow-y-auto">

                    {/* Top Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Daily Stamps */}
                        <div className="col-span-2 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-5 opacity-20">
                                <Sparkles className="w-16 h-16 text-emerald-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-zinc-500 text-sm font-medium mb-1">Stempel Heute</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-5xl font-bold text-white tracking-tight">{stats?.todayStamps || 0}</p>
                                    <span className="text-sm text-emerald-500 font-medium">
                                        + {stats?.weekStamps || 0} diese Woche
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active Installs */}
                        <div className="col-span-2 bg-white/5 border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Installierte Pässe</p>
                                <p className="text-3xl font-bold mt-1 text-white">{stats?.totalPasses || 0}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-center justify-center bg-black/40 w-12 h-12 rounded-xl border border-white/5">
                                    <Wallet className="w-4 h-4 text-white mb-1" />
                                    <span className="text-[10px] font-bold">{stats?.appleCount || 0}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-black/40 w-12 h-12 rounded-xl border border-white/5">
                                    <Wallet className="w-4 h-4 text-zinc-400 mb-1" />
                                    <span className="text-[10px] font-bold text-zinc-400">{stats?.googleCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Redemptions Banner */}
                    <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-6 shadow-lg shadow-purple-500/20 relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Eingelöste Prämien</p>
                                <p className="text-4xl font-bold text-white tracking-tight">{stats?.totalRedemptions || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider px-1">Letzte Aktivitäten</h3>
                        {stats?.recentActivity?.length > 0 ? (
                            <div className="space-y-2">
                                {stats.recentActivity.map((activity: any) => (
                                    <div key={activity.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.action === 'redeem'
                                                    ? 'bg-purple-500/10 text-purple-400'
                                                    : 'bg-emerald-500/10 text-emerald-400'
                                                }`}>
                                                {activity.action === 'redeem' ? <Users size={18} /> : <Check size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {activity.action === 'redeem' ? 'Prämie eingelöst' : 'Stempel gesammelt'}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    Karte #{activity.passes?.serial_number?.slice(-4) || 'Unknown'}
                                                    {activity.passes?.wallet_type === 'apple' && ' '}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">{formatDate(activity.created_at)}</p>
                                            {activity.stamps_after && (
                                                <p className="text-xs text-zinc-500">{activity.stamps_after} Stempel</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-zinc-500 text-sm">Noch keine Aktivitäten heute</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                            onClick={() => setView('push')}
                            className="col-span-2 py-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all border border-white/5"
                        >
                            <Send className="w-5 h-5 text-blue-400" />
                            Push-Nachricht senden
                        </button>

                        <button
                            onClick={handleLogout}
                            className="col-span-2 py-4 bg-black/50 border border-white/10 text-zinc-400 hover:text-white rounded-2xl font-medium text-sm transition-all"
                        >
                            Abmelden
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    // ========================================
    // RENDER: Push Request Form (Chef only)
    // ========================================
    if (role === 'chef' && view === 'push') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col relative">
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />

                <header className="relative z-10 p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Nachricht schreiben
                        </h1>
                    </div>
                    <button
                        onClick={() => setView('dashboard')}
                        className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full"
                    >
                        <X size={16} />
                    </button>
                </header>

                <main className="relative z-10 flex-1 p-6">
                    <form onSubmit={handlePushRequest} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Deine Nachricht</label>
                            <div className="relative">
                                <textarea
                                    value={pushMessage}
                                    onChange={(e) => setPushMessage(e.target.value)}
                                    placeholder="z.B. 2-für-1 auf alle Cocktails heute Abend! 🍹"
                                    rows={5}
                                    className="w-full px-5 py-4 bg-zinc-900/80 border border-white/10 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-lg"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-zinc-600 font-mono">
                                    {pushMessage.length} Zeichen
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Zeitpunkt (Optional)</label>
                            <input
                                type="datetime-local"
                                value={pushSchedule}
                                onChange={(e) => setPushSchedule(e.target.value)}
                                className="w-full px-5 py-4 bg-zinc-900/80 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {pushSuccess && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-4 rounded-2xl flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <Check size={16} />
                                </div>
                                <div>
                                    <p className="font-bold">Gesendet!</p>
                                    <p className="text-xs opacity-80">Nachricht wird geprüft.</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!pushMessage.trim() || pushSubmitting}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-lg shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        >
                            {pushSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Absenden
                                </>
                            )}
                        </button>
                    </form>
                </main>
            </div>
        )
    }

    // ========================================
    // RENDER: Scanner (Staff & Chef)
    // ========================================
    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            <Background />

            {/* Header */}
            <header className="relative z-10 px-6 py-5 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50">
                        <Zap className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="font-bold leading-none">Scanner</h1>
                        <p className="text-xs text-emerald-400 font-medium mt-1 uppercase tracking-wide">{label || role}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {role === 'chef' && (
                        <button
                            onClick={() => setView('dashboard')}
                            className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center hover:bg-purple-500/20 transition-colors"
                        >
                            <BarChart3 className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <LogOut className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 p-6 flex flex-col items-center justify-center">

                {mode === 'idle' && (
                    <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-300">

                        {/* Status Card */}
                        <div className="text-center space-y-2 mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                System Bereit
                            </div>
                        </div>

                        {/* Camera Button */}
                        <button
                            onClick={startCamera}
                            className="group relative w-full aspect-square max-h-[300px] rounded-[3rem] bg-zinc-900 border border-white/10 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all shadow-2xl overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                                <Camera size={40} className="text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Kunde scannen</span>
                        </button>

                        {/* Manual Input */}
                        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-1 border border-white/10 flex items-center">
                            <input
                                type="text"
                                placeholder="#ID eingeben"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                                className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder:text-zinc-600 font-mono text-lg"
                            />
                            <button
                                onClick={handleManualScan}
                                disabled={!manualId.trim()}
                                className="bg-zinc-800 hover:bg-emerald-600 disabled:opacity-0 disabled:pointer-events-none text-white p-3 rounded-xl transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-center text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {mode === 'camera' && (
                    <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-300">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            <div
                                id="qr-reader"
                                className="w-full aspect-square bg-black"
                            />
                            <div className="absolute inset-0 border-[3px] border-emerald-500/50 rounded-3xl pointer-events-none" />

                            {/* Scanning Overlay */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/50 rounded-2xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-lg" />
                            </div>

                            <button
                                onClick={stopCamera}
                                className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/60 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-center text-zinc-400 font-medium">QR-Code im Rahmen platzieren</p>
                    </div>
                )}

                {mode === 'scanning' && (
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full border-4 border-zinc-800 border-t-emerald-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold animate-pulse">Verarbeite...</h2>
                    </div>
                )}

                {mode === 'result' && result && (
                    <div className="w-full max-w-sm text-center space-y-6 animate-in zoom-in-50 duration-300">
                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto text-6xl shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] ${result.celebration
                                ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/40'
                                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40'
                                }`}
                        >
                            {result.celebration ? '🎉' : <Check className="w-16 h-16 text-white" strokeWidth={3} />}
                        </motion.div>

                        {/* Message */}
                        <div>
                            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400">{result.message}</h2>
                            <div className="inline-block px-3 py-1 bg-white/10 rounded-lg text-sm text-zinc-300">
                                {result.action === 'ADD_STAMP' ? 'Stempel erhalten' : result.action}
                            </div>
                        </div>

                        {/* State Display Card */}
                        {result.newState && (
                            <div className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                                {result.newState.stamps !== undefined && (
                                    <div className="flex justify-between items-center p-2">
                                        <span className="text-zinc-400 font-medium">Neuer Stand</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-1">
                                                {Array.from({ length: Math.min(5, result.newState.stamps) }).map((_, i) => (
                                                    <div key={i} className="w-2 h-2 rounded-full bg-emerald-500" />
                                                ))}
                                            </div>
                                            <span className="text-3xl font-bold text-emerald-400 font-mono">
                                                {result.newState.stamps}/{result.newState.max_stamps || 10}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {result.newState.customer_name && (
                                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                        <span className="text-zinc-500 text-sm">Kunde</span>
                                        <span className="text-lg font-semibold text-white">
                                            {result.newState.customer_name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Next Button */}
                        <button
                            onClick={resetScanner}
                            className="w-full py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
                        >
                            <RotateCcw size={20} />
                            Nächster Kunde
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 p-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Passify Point of Sale</p>
            </footer>
        </div>
    )
}
