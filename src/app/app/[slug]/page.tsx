'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
    Zap, Camera, Users, ChevronRight, Send, X, Sparkles, Clock,
    Calendar, Trophy, Target, Bell, Check, RotateCcw, Cake, Mail,
    Phone, BarChart3, Star, TrendingUp, PieChart as PieChartIcon,
    Settings, LogOut, ArrowRight, Crown, AlertTriangle, Layers, Gift
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { ActivityChart } from '@/components/app/POSCharts'
import { Background } from '@/components/app/Background'
import { AutomationRulesManager } from '@/components/app/AutomationRulesManager'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getReviewStats, ReviewStats } from "@/lib/reviews"
import { ReviewWidget } from "@/components/analytics/ReviewWidget"

type Role = 'none' | 'staff' | 'chef'
type Mode = 'idle' | 'camera' | 'result'

// Helper: Format birthday as "15. März" (day first, never year)
function formatBirthday(dateStr: string | null | undefined): string {
    if (!dateStr) return ''
    try {
        const date = new Date(dateStr)
        const day = date.getDate()
        const month = date.toLocaleString('de-DE', { month: 'long' })
        return `${day}. ${month}`
    } catch {
        return ''
    }
}

// Helper: Format last scan
function formatLastScan(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Noch nie'
    try {
        const date = new Date(dateStr)
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Noch nie'
    }
}

export default function POSPage() {
    const params = useParams()
    const slug = params.slug as string
    const isProcessing = useRef(false)

    // Auth
    const [role, setRole] = useState<Role>('none')
    const [pin, setPin] = useState('')
    const [authError, setAuthError] = useState<string | null>(null)
    const [campaignData, setCampaignData] = useState<any>(null)
    const [label, setLabel] = useState<string>('')

    // Scanner
    const [mode, setMode] = useState<Mode>('idle')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [manualId, setManualId] = useState('')
    const [cameraError, setCameraError] = useState<string | null>(null)
    const scannerRef = useRef<any>(null)

    // Dashboard
    const [stats, setStats] = useState<any>(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [statsRange, setStatsRange] = useState<'24h' | '7d' | '30d'>('7d')
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
    const [customers, setCustomers] = useState<any[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [view, setView] = useState<'scanner' | 'dashboard' | 'customers'>('scanner')
    const [greeting, setGreeting] = useState('')

    // Push
    const [showPushModal, setShowPushModal] = useState(false)
    const [pushMode, setPushMode] = useState<'now' | 'schedule'>('now')
    const [pushMessage, setPushMessage] = useState('')
    const [pushScheduleTime, setPushScheduleTime] = useState('')
    const [pushLoading, setPushLoading] = useState(false)
    const [scheduledPushes, setScheduledPushes] = useState<any[]>([])

    // ===============================================
    // LOADERS & EFFECTS
    // ===============================================

    useEffect(() => {
        loadCampaignData()
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Guten Morgen')
        else if (hour < 18) setGreeting('Guten Tag')
        else setGreeting('Guten Abend')
    }, [slug])

    useEffect(() => {
        if (role === 'chef' && view === 'dashboard' && campaignData?.campaign?.id) {
            loadStats()
            loadReviews()
            loadScheduledPushes()
        }
    }, [role, view, campaignData, statsRange])

    useEffect(() => {
        if (role === 'chef' && view === 'customers' && campaignData?.campaign?.id) {
            loadCustomers()
        }
    }, [role, view, campaignData])

    const loadCampaignData = async () => {
        try {
            const res = await fetch(`/api/campaign/by-slug/${slug}`)
            if (res.ok) setCampaignData(await res.json())
        } catch (e) {
            console.error('Failed to load campaign:', e)
        }
    }

    const loadStats = async () => {
        if (!campaignData?.campaign?.id) return
        setStatsLoading(true)
        try {
            const res = await fetch(`/api/campaign/${campaignData.campaign.id}/stats?period=${statsRange}`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e) {
            console.error('Failed to load stats:', e)
        } finally {
            setStatsLoading(false)
        }
    }

    const loadReviews = async () => {
        if (!campaignData?.campaign?.id) return
        try {
            const supabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const stats = await getReviewStats(supabase, campaignData.campaign.id)
            setReviewStats(stats)
        } catch (e) {
            console.error('Failed to load reviews:', e)
        }
    }

    const loadCustomers = async () => {
        if (!campaignData?.campaign?.id) return
        setCustomersLoading(true)
        try {
            const res = await fetch(`/api/campaign/${campaignData.campaign.id}/customers`)
            if (res.ok) {
                const data = await res.json()
                setCustomers(data.customers || [])
            }
        } catch (e) {
            console.error('Failed to load customers:', e)
        } finally {
            setCustomersLoading(false)
        }
    }

    const loadScheduledPushes = async () => {
        if (!campaignData?.campaign?.id) return
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data } = await supabase
            .from('push_requests')
            .select('*')
            .eq('campaign_id', campaignData.campaign.id)
            .eq('status', 'scheduled')
            .gt('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })

        if (data) setScheduledPushes(data)
    }

    // ===============================================
    // AUTH
    // ===============================================

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthError(null)
        try {
            const res = await fetch(`/api/app/auth`, {
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

    // ===============================================
    // SCANNER
    // ===============================================

    useEffect(() => {
        return () => {
            if (scannerRef.current) scannerRef.current.stop().catch(() => { })
            isProcessing.current = false
        }
    }, [])

    const startCamera = async () => {
        setCameraError(null)
        setMode('camera')
        setTimeout(async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode')
                const scanner = new Html5Qrcode('qr-reader')
                scannerRef.current = scanner
                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText) => {
                        await scanner.stop()
                        handleScan(decodedText)
                    },
                    () => { }
                )
            } catch (err: any) {
                console.error('Camera error:', err)
                setCameraError(err.message || 'Error starting camera')
                setMode('idle')
            }
        }, 100)
    }

    const stopCamera = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { })
            scannerRef.current = null
        }
        setMode('idle')
    }

    const handleScan = async (decodedText: string) => {
        if (isProcessing.current) return
        isProcessing.current = true
        setError(null)

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: decodedText, action: 'ADD_STAMP' })
            })
            const data = await res.json()
            if (res.ok) {
                setResult(data)
                setMode('result')
                toast.success('Stempel erfolgreich!')
            } else {
                setError(data.error || 'Scan failed')
                setMode('idle')
                toast.error(data.error || 'Scan failed')
            }
        } catch (e) {
            setError('Netzwerkfehler')
            setMode('idle')
        } finally {
            setTimeout(() => { isProcessing.current = false }, 2000)
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

    // ===============================================
    // PUSH
    // ===============================================

    const handlePushRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pushMessage.trim()) return
        setPushLoading(true)
        try {
            const res = await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    message: pushMessage,
                    scheduleTime: pushMode === 'schedule' ? pushScheduleTime : null
                })
            })
            if (res.ok) {
                toast.success(pushMode === 'schedule' ? 'Nachricht eingeplant!' : 'Nachricht gesendet!')
                setPushMessage('')
                setPushScheduleTime('')
                setShowPushModal(false)
                loadScheduledPushes()
            } else {
                toast.error('Fehler beim Senden')
            }
        } catch (e) {
            toast.error('Ein Fehler ist aufgetreten')
        } finally {
            setPushLoading(false)
        }
    }

    // ===============================================
    // RENDER: LOGIN
    // ===============================================

    if (role === 'none') {
        return (
            <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-black text-white">
                <Background />
                <div className="relative z-10 w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 rotate-3 transform hover:rotate-6 transition-transform">
                            <Zap className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">QARD POS</h1>
                            <p className="text-emerald-500 font-medium mt-1 uppercase tracking-widest text-xs">{slug}</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3 text-center">Zugangspin eingeben</label>
                                <input
                                    type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                                    value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-full px-4 py-4 bg-transparent border-2 border-dashed border-white/20 rounded-xl text-center text-3xl tracking-[0.6em] placeholder:tracking-normal focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all font-mono"
                                    autoFocus
                                />
                            </div>
                            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
                            <button
                                type="submit" disabled={pin.length < 4}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Anmelden
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // ===============================================
    // RENDER: CHEF DASHBOARD
    // ===============================================

    if (role === 'chef' && view === 'dashboard') {
        const rangeLabels: Record<string, string> = { '24h': '24h', '7d': '7 Tage', '30d': '30 Tage' }
        const loyalty = stats?.loyalty

        return (
            <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
                <Background />

                {/* Header */}
                <header className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/40 border-b border-white/5 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight tracking-tight">Dashboard</h1>
                            <p className="text-xs text-zinc-500 font-medium">{greeting}, Chef 👋</p>
                        </div>
                    </div>
                    {/* Time Range Selector */}
                    <div className="flex bg-zinc-900/80 border border-white/10 rounded-lg p-1">
                        {(['24h', '7d', '30d'] as const).map(r => (
                            <button key={r} onClick={() => setStatsRange(r)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statsRange === r ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'text-zinc-500 hover:text-white'}`}>{rangeLabels[r]}</button>
                        ))}
                    </div>
                </header>

                <main className="relative z-10 flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto space-y-6 pb-32">

                    {/* LOYALTY SCORE - ALWAYS SHOWN */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-cyan-600/20 border border-emerald-500/20 p-6"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Crown className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-black text-white">{loyalty?.score || 50}%</span>
                                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1">
                                            <TrendingUp size={12} /> Steigend
                                        </span>
                                    </div>
                                    <p className="text-emerald-100/80 text-sm font-medium">{loyalty?.message || "Dein Loyalty-Programm ist bereit! 🚀"}</p>
                                </div>
                            </div>
                            {/* Milestones */}
                            {loyalty?.milestones && loyalty.milestones.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {loyalty.milestones.slice(0, 3).map((m: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/10">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-4 h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${loyalty?.score || 50}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* GOOGLE REVIEWS */}
                    {reviewStats && (
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                            <ReviewWidget stats={reviewStats} variant="card" />
                        </div>
                    )}

                    {/* KEY STATS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Stempel" value={stats?.stats?.stamps || 0} icon={<Zap size={18} />} color="emerald" />
                        <StatCard label="Einlösungen" value={stats?.stats?.redemptions || 0} icon={<Gift size={18} />} color="purple" />
                        <StatCard label="Neue Kunden" value={stats?.stats?.newPasses || 0} icon={<Users size={18} />} color="blue" />
                        <StatCard label="Aktive Pässe" value={stats?.stats?.totalPasses || 0} icon={<Check size={18} />} color="zinc" />
                    </div>

                    {/* CHART + ACTIONS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Activity Chart */}
                        <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden backdrop-blur-sm min-h-[300px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-white flex items-center gap-2"><BarChart3 size={20} className="text-emerald-500" /> Aktivität</h3>
                                <span className="text-xs font-mono text-zinc-500">{rangeLabels[statsRange]}</span>
                            </div>
                            <div className="flex-1 w-full">
                                {statsLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <ActivityChart data={stats?.chartData || []} />
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <button onClick={() => setShowPushModal(true)} className="flex-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 hover:from-violet-500/30 hover:to-fuchsia-500/30 transition-all shadow-lg shadow-violet-900/20 group text-left p-6 flex flex-col justify-between min-h-[140px]">
                                <div className="absolute top-0 right-0 p-24 bg-violet-500/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none group-hover:bg-violet-500/20 transition-all" />
                                <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl w-fit relative z-10 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/30">
                                    <Send className="w-6 h-6 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white">Push Senden</h3>
                                    <div className="flex items-center gap-2 text-violet-200 text-xs font-medium opacity-80 mt-1">
                                        <Users size={14} /> <span>Alle Kunden erreichen</span>
                                    </div>
                                </div>
                            </button>

                            <div className="grid grid-cols-2 gap-4 h-[100px]">
                                <button onClick={() => setView('scanner')} className="bg-zinc-900/40 hover:bg-zinc-800 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-all group hover:border-emerald-500/30">
                                    <Camera size={20} className="group-hover:text-emerald-500 transition-colors" />
                                    <span className="text-xs font-bold">Scanner</span>
                                </button>
                                <button onClick={() => setView('customers')} className="bg-zinc-900/40 hover:bg-zinc-800 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-all group hover:border-blue-500/30">
                                    <Users size={20} className="group-hover:text-blue-500 transition-colors" />
                                    <span className="text-xs font-bold">Kunden</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SCHEDULED PUSHES - Only if exists */}
                    {scheduledPushes.length > 0 && (
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Geplante Nachrichten</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {scheduledPushes.map((push) => (
                                    <div key={push.id} className="flex gap-4 items-center bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0"><Clock className="w-5 h-5" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{push.message}</p>
                                            <p className="text-xs text-zinc-500 font-mono mt-1">{new Date(push.scheduled_at).toLocaleString('de-DE')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AUTOMATIONS */}
                    <AutomationRulesManager slug={slug} />

                    <button onClick={handleLogout} className="mx-auto block mt-8 text-xs text-zinc-600 hover:text-white transition-colors uppercase tracking-widest font-bold">Abmelden</button>
                </main>

                {/* PUSH MODAL */}
                <AnimatePresence>
                    {showPushModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative">
                                <button onClick={() => setShowPushModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors z-20"><X size={18} className="text-zinc-400" /></button>

                                <div className="p-8 relative">
                                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                                    <h2 className="text-2xl font-bold text-white mb-2 relative z-10 flex items-center gap-3"><Send className="text-emerald-500" /> Nachricht senden</h2>
                                    <p className="text-zinc-400 text-sm mb-8 relative z-10">Erreiche deine Kunden direkt auf dem Sperrbildschirm.</p>

                                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                        <button onClick={() => setPushMode('now')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'now' ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:bg-white/5'}`}>
                                            <Zap className={pushMode === 'now' ? 'text-emerald-500' : 'text-zinc-600'} />
                                            <span className="text-sm font-bold">⚡ Jetzt senden</span>
                                        </button>
                                        <button onClick={() => setPushMode('schedule')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'schedule' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:bg-white/5'}`}>
                                            <Calendar className={pushMode === 'schedule' ? 'text-blue-500' : 'text-zinc-600'} />
                                            <span className="text-sm font-bold">📅 Später planen</span>
                                        </button>
                                    </div>

                                    <form onSubmit={handlePushRequest} className="space-y-4 relative z-10">
                                        <div className="relative">
                                            <textarea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} placeholder="Deine Nachricht hier schreiben..." className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 resize-none transition-all" />
                                            <div className="absolute bottom-3 right-3 text-xs text-zinc-600 font-mono">{pushMessage.length} Zeichen</div>
                                        </div>
                                        {pushMode === 'schedule' && <input type="datetime-local" value={pushScheduleTime} onChange={(e) => setPushScheduleTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50 font-mono text-sm" />}
                                        <button type="submit" disabled={pushLoading || !pushMessage.trim()} className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 shadow-lg shadow-white/5">{pushLoading ? 'Wird gesendet...' : (pushMode === 'now' ? '⚡ Jetzt absenden' : '📅 Einplanen')}</button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div >
        )
    }

    // ===============================================
    // RENDER: CUSTOMERS VIEW
    // ===============================================

    if (role === 'chef' && view === 'customers') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col relative w-full">
                <Background />
                <header className="relative z-10 p-6 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md">
                    <h1 className="text-xl font-bold flex items-center gap-2"><Users className="text-cyan-500" /> Kundenliste</h1>
                    <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"><X size={16} /></button>
                </header>
                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
                    {customersLoading ? (
                        <div className="text-center py-20"><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" /></div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">Keine Kunden gefunden</div>
                    ) : (
                        <div className="space-y-3">
                            {customers.map((c: any) => (
                                <div key={c.id} className={`p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-900/80 transition-colors ${c.deleted_at ? 'opacity-50' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            {/* Name or Customer Number */}
                                            <h3 className={`font-semibold ${c.deleted_at ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                                {c.customer_name || `Kunde #${c.current_state?.customer_number || c.serial_number?.slice(0, 6)}`}
                                            </h3>

                                            {/* Contact Info - Only show what exists */}
                                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
                                                {c.customer_email && (
                                                    <span className="flex items-center gap-1"><Mail size={12} /> {c.customer_email}</span>
                                                )}
                                                {c.customer_phone && (
                                                    <span className="flex items-center gap-1"><Phone size={12} /> {c.customer_phone}</span>
                                                )}
                                                {c.customer_birthday && (
                                                    <span className="flex items-center gap-1"><Cake size={12} /> {formatBirthday(c.customer_birthday)}</span>
                                                )}
                                            </div>

                                            {/* Last Scan & Platform */}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                                                <span>{c.wallet_type === 'google' || c.is_installed_on_android ? '🤖 Android' : '🍎 iOS'}</span>
                                                <span>• Letzter Scan: {formatLastScan(c.last_scan_at)}</span>
                                                {c.deleted_at && <span className="text-red-400">• Gelöscht</span>}
                                            </div>
                                        </div>

                                        {/* Stamps/Points */}
                                        <div className="text-lg font-bold text-emerald-500 flex items-center gap-1 shrink-0">
                                            <Zap size={14} /> {c.current_state?.stamps || 0}/{c.current_state?.max_stamps || 10}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        )
    }

    // ===============================================
    // RENDER: SCANNER VIEW
    // ===============================================

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                {role === 'chef' && <button onClick={() => setView('dashboard')} className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all"><ArrowRight className="w-5 h-5" /></button>}
            </div>
            <Background />
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
                {mode === 'idle' && (
                    <div className="space-y-8 w-full text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20"><Zap className="w-12 h-12 text-white" /></div>
                        <h1 className="text-3xl font-bold">QARD POS</h1>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={startCamera} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><Camera className="w-6 h-6" /> Code Scannen</button>
                            <div className="flex gap-2">
                                <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="Manuelle ID" className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-center outline-none focus:border-emerald-500 transition-colors" />
                                <button onClick={handleManualScan} disabled={!manualId} className="px-6 bg-zinc-800 rounded-xl font-bold disabled:opacity-50 hover:bg-zinc-700 transition-colors">OK</button>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-white mt-8 transition-colors">Abmelden</button>
                    </div>
                )}
                {mode === 'camera' && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <div id="qr-reader" className="w-full overflow-hidden rounded-3xl border-2 border-emerald-500 shadow-2xl bg-black relative aspect-square" />
                        {cameraError && <p className="text-red-500 mt-4 text-center">{cameraError}</p>}
                        <button onClick={stopCamera} className="mt-8 px-8 py-3 bg-zinc-800 rounded-full font-medium hover:bg-zinc-700 transition-colors">Abbrechen</button>
                    </div>
                )}
                {mode === 'result' && result && (
                    <div className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center animate-in zoom-in">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-10 h-10" /></div>
                        <h2 className="text-2xl font-bold mb-2">Stempel hinzugefügt!</h2>
                        <p className="text-zinc-400 mb-6">Neuer Stand: {result.newStamps} / {result.maxStamps}</p>
                        <button onClick={resetScanner} className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-400 transition-colors">Nächster Scan</button>
                    </div>
                )}
            </main>
        </div>
    )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-500 bg-emerald-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        zinc: 'text-zinc-400 bg-zinc-800'
    }
    return (
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:bg-zinc-900/60 transition-all backdrop-blur-sm">
            <div className="flex justify-between items-start mb-3">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{label}</span>
                <div className={`p-2 rounded-lg ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
        </div>
    )
}
