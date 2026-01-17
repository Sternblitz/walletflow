'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
    Zap, Camera, Users, ChevronRight, Send, X, Sparkles, Clock,
    Calendar, Trophy, Target, Bell, Check, RotateCcw, Cake, Mail,
    Phone, BarChart3, Star, TrendingUp, PieChart as PieChartIcon,
    Settings, LogOut, ArrowRight, Sun, CloudRain, Flame, Crown, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { ActivityChart } from '@/components/app/POSCharts'
import { Background } from '@/components/app/Background'
import { AutomationRulesManager } from '@/components/app/AutomationRulesManager'
import { ThemeToggle } from '@/components/app/ThemeToggle'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getReviewStats, ReviewStats } from "@/lib/reviews"
import { ReviewWidget } from "@/components/analytics/ReviewWidget"

type Role = 'none' | 'staff' | 'chef'
type Mode = 'idle' | 'camera' | 'result'

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
    const [statsRange, setStatsRange] = useState<'24h' | '7d' | '30d'>('7d')
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
    const [customers, setCustomers] = useState<any[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [customersRange, setCustomersRange] = useState<'24h' | '7d' | '30d' | 'all'>('all')
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
        if (role === 'chef' && view === 'dashboard') {
            loadStats()
            if (campaignData?.campaign?.id) {
                loadReviews()
                loadScheduledPushes()
            }
        }
    }, [role, view, campaignData, statsRange])

    useEffect(() => {
        if (role === 'chef' && view === 'customers') {
            loadCustomers()
        }
    }, [role, view, customersRange])

    const loadCampaignData = async () => {
        try {
            const res = await fetch(`/api/campaign/by-slug/${slug}`)
            if (res.ok) setCampaignData(await res.json())
        } catch (e) {
            console.error('Failed to load campaign:', e)
        }
    }

    const loadStats = async () => {
        try {
            const res = await fetch(`/api/app/stats?slug=${slug}&range=${statsRange}`)
            if (res.ok) setStats(await res.json())
        } catch (e) {
            console.error('Failed to load stats:', e)
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
        setCustomersLoading(true)
        try {
            const res = await fetch(`/api/app/customers?slug=${slug}&range=${customersRange}`)
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
    // SCANNER (RESTORED)
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
            // Prevent multiple scans
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
    // LOGIC: DASHBOARD HELPERS
    // ===============================================

    const getDailyGoal = () => {
        // Simplified Daily Goal Logic (Mocked Goal: 30)
        // In real app, this could be dynamic or user-set
        const todayStamps = stats?.history?.slice(-1)[0]?.stamps || 0
        const goal = 30
        const progress = Math.min((todayStamps / goal) * 100, 100)
        return { current: todayStamps, goal, progress }
    }

    const daily = getDailyGoal()

    // ===============================================
    // RENDER
    // ===============================================

    if (role === 'none') {
        // ... Login Screen (Same as before) ...
        return (
            <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-background text-foreground transition-colors duration-500">
                <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
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
                    <div className="bg-white/50 dark:bg-black/30 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">Zugangspin eingeben</label>
                                <input
                                    type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                                    value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-full px-4 py-4 bg-transparent border-2 border-dashed border-black/10 dark:border-white/20 rounded-xl text-center text-3xl tracking-[0.6em] placeholder:tracking-normal focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all font-mono"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit" disabled={pin.length < 4}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                            >
                                Anmelden
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    if (role === 'chef' && view === 'dashboard') {
        const rangeLabels: Record<string, string> = { '24h': 'Letzte 24 Stunden', '7d': 'Letzte 7 Tage', '30d': 'Letzte 30 Tage' }

        return (
            <div className="dark min-h-screen bg-black text-foreground flex flex-col relative overflow-hidden transition-colors duration-500">
                <Background />

                {/* Header */}
                <header className="relative z-10 px-6 py-6 flex items-center justify-between backdrop-blur-sm bg-black/50 border-b border-white/5 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">Dashboard</h1>
                            <p className="text-xs text-muted-foreground font-medium">{greeting}, Chef 👋</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Only Utilities here, Push is now Hero */}
                        <button onClick={() => setView('customers')} className="h-10 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-full flex items-center justify-center transition-colors gap-2 text-sm font-semibold">
                            <Users className="w-4 h-4" /> Kunden
                        </button>
                        <button onClick={() => setView('scanner')} className="h-10 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors gap-2 text-sm font-semibold">
                            <Camera className="w-4 h-4" /> Scanner
                        </button>
                    </div>
                </header>

                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 custom-scrollbar pb-24">

                    {/* HERO SECTION: "100x Better" */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Daily Goal Card */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:bg-zinc-900/70 transition-all">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Flame size={16} className="text-orange-500" /> Tagesziel</h3>
                            <div className="flex items-center gap-6">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90"><circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" /><circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * daily.progress) / 100} className="text-orange-500 transition-all duration-1000 ease-out" /></svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-white">{Math.round(daily.progress)}%</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-2xl font-bold text-white mb-1">{daily.current} <span className="text-base font-medium text-zinc-500">/ {daily.goal} Scans</span></div>
                                    <p className="text-xs text-orange-400">Nur noch {Math.max(0, daily.goal - daily.current)} bis zum Ziel! 🔥</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. PUSH HERO (Big Button) */}
                        <button onClick={() => setShowPushModal(true)} className="col-span-1 md:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-6 relative overflow-hidden group shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all text-left">
                            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl w-fit mb-4">
                                    <Send className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Kunden erreichen</h3>
                                    <p className="text-emerald-100 text-sm">Sende eine Push-Nachricht an alle {stats?.summary?.totalInstalled || 'aktiven'} Kunden.</p>
                                </div>
                            </div>
                        </button>

                        {/* 3. Weather / Insight */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2"><CloudRain size={16} className="text-blue-400" /> Umgebung</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-lg font-medium text-white">Regnerisches Wetter 🌧️</p>
                                    <p className="text-xs text-zinc-500 mt-1">Perfekt für: "Komm rein ins Warme & genieß einen Kaffee!"</p>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-2"><Crown size={12} className="text-yellow-500" /> Top Kunden</h4>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] text-zinc-400">#{i}</div>)}
                                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 border-2 border-black flex items-center justify-center text-[10px] text-zinc-500">+12</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Range Selector */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex bg-zinc-900 border border-white/10 rounded-xl p-1">
                            {(['24h', '7d', '30d'] as const).map(r => (
                                <button key={r} onClick={() => setStatsRange(r)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statsRange === r ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>{rangeLabels[r]}</button>
                            ))}
                        </div>
                        {stats?.insight && (
                            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl text-sm text-purple-200">
                                <Sparkles className="w-4 h-4 text-purple-400" />{stats.insight}
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Stempel" value={stats?.summary?.stamps || 0} icon={<Zap size={16} />} color="emerald" />
                        <StatCard label="Einlösungen" value={stats?.summary?.redemptions || 0} icon={<Trophy size={16} />} color="purple" />
                        <StatCard label="Neue Kunden" value={stats?.summary?.newPasses || 0} icon={<Users size={16} />} color="blue" />

                        {/* Retention / Info Card */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Kundenbindung</span>
                                <PieChartIcon className="w-4 h-4 text-cyan-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white mb-2">{stats?.summary?.stamps > 0 ? Math.round(((stats?.summary?.redemptions || 0) / (stats.summary.stamps)) * 100) : 0}%</div>
                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500" style={{ width: `${Math.min(((stats?.summary?.redemptions || 0) / (Math.max(stats?.summary?.stamps, 1))) * 100, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts & Review & Feed */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Chart */}
                        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 min-h-[300px] flex flex-col relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <h3 className="font-bold text-lg text-white">Verlauf</h3>
                                <div className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">{rangeLabels[statsRange]}</div>
                            </div>
                            <div className="flex-1 w-full relative z-10">
                                <ActivityChart data={stats?.history || []} />
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-emerald-500" /> Letzte Aktivitäten
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                {stats?.recentActivity?.length > 0 ? (
                                    stats.recentActivity.map((activity: any) => (
                                        <div key={activity.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.action === 'redeem' ? 'bg-purple-500/20 text-purple-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                    {activity.action === 'redeem' ? <Trophy size={14} /> : <Zap size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{activity.action === 'redeem' ? 'Prämie' : 'Stempel'}</p>
                                                    <p className="text-[10px] text-zinc-500">{new Date(activity.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-muted-foreground"><p>Keine Aktivitäten</p></div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Integrated Review Widget */}
                    {reviewStats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-full">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 block ml-2">Bewertungen</label>
                                <ReviewWidget stats={reviewStats} variant="card" />
                            </div>
                        </div>
                    )}

                    {/* Automations */}
                    <div className="pt-8 border-t border-white/5 space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-400" /> Kalender & Regeln</h3>
                        {scheduledPushes.length > 0 && (
                            <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Geplante Nachrichten</h4>
                                {scheduledPushes.map((push) => (
                                    <div key={push.id} className="flex gap-3 items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Clock className="w-4 h-4" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{push.message}</p>
                                            <p className="text-xs text-zinc-500">Geplant: {new Date(push.scheduled_at).toLocaleString('de-DE')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <AutomationRulesManager slug={slug} />
                    </div>

                    <button onClick={handleLogout} className="mx-auto block mt-8 mb-8 text-xs text-zinc-500 hover:text-white transition-colors">Abmelden</button>
                </main>

                {/* PUSH MODAL */}
                <AnimatePresence>
                    {showPushModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Send size={18} className="text-emerald-500" /> Nachricht senden</h2>
                                    <button onClick={() => setShowPushModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={18} className="text-zinc-400" /></button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setPushMode('now')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'now' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-zinc-900/50 border-white/5'}`}>
                                            <div className={`p-3 rounded-full ${pushMode === 'now' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}><Send className="w-5 h-5" /></div>
                                            <span className="text-sm font-bold">Jetzt senden</span>
                                        </button>
                                        <button onClick={() => setPushMode('schedule')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'schedule' ? 'bg-blue-500/20 border-blue-500' : 'bg-zinc-900/50 border-white/5'}`}>
                                            <div className={`p-3 rounded-full ${pushMode === 'schedule' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}><Calendar className="w-5 h-5" /></div>
                                            <span className="text-sm font-bold">Später planen</span>
                                        </button>
                                    </div>
                                    <form onSubmit={handlePushRequest} className="space-y-4">
                                        <textarea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} placeholder="Deine Nachricht..." className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 resize-none" />
                                        {pushMode === 'schedule' && <input type="datetime-local" value={pushScheduleTime} onChange={(e) => setPushScheduleTime(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50" />}
                                        <button type="submit" disabled={pushLoading || !pushMessage.trim()} className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50">{pushLoading ? 'Sende...' : (pushMode === 'now' ? 'Jetzt senden' : 'Einplanen')}</button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // Customers View ... (Standard implementation)
    if (role === 'chef' && view === 'customers') {
        return (
            <div className="dark min-h-screen bg-black text-foreground flex flex-col relative w-full">
                <Background />
                <header className="relative z-10 p-6 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md">
                    <h1 className="text-xl font-bold flex items-center gap-2"><Users className="text-cyan-500" /> Kundenliste</h1>
                    <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-800 rounded-full"><X size={16} /></button>
                </header>
                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full custom-scrollbar">
                    {/* Same list content as before ... */}
                    <div className="flex gap-2 mb-6">
                        {(['all', '24h', '7d', '30d'] as const).map(r => (
                            <button key={r} onClick={() => setCustomersRange(r)} className={`px-3 py-1 rounded-full text-xs font-medium border ${customersRange === r ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-transparent border-zinc-800 text-zinc-500'}`}>{r === 'all' ? 'Alle' : r}</button>
                        ))}
                    </div>
                    {customersLoading ? <div className="text-center py-20"><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" /></div> :
                        customers.length === 0 ? <div className="text-center py-20 text-muted-foreground">Keine Kunden</div> :
                            <div className="space-y-3">{customers.map((c: any) => (
                                <div key={c.id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-white">{c.name || `Kunde #${c.customerNumber}`}</h3>
                                        <div className="flex gap-2 text-xs text-zinc-500 mt-1"><span>{c.platform === 'apple' ? 'iOS' : 'Android'}</span>{c.lastActivity && <span>• {new Date(c.lastActivity).toLocaleDateString()}</span>}</div>
                                    </div>
                                    <div className="text-lg font-bold text-emerald-500">{c.stamps}/{c.maxStamps}</div>
                                </div>
                            ))}</div>}
                </main>
            </div>
        )
    }

    // SCANNER VIEW (Restored Design)
    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                {role === 'chef' && <button onClick={() => setView('dashboard')} className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10"><ArrowRight className="w-5 h-5" /></button>}
                <ThemeToggle />
            </div>
            <Background />
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
                {mode === 'idle' && (
                    <div className="space-y-8 w-full text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20"><Zap className="w-12 h-12 text-white" /></div>
                        <h1 className="text-3xl font-bold">QARD POS</h1>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={startCamera} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"><Camera className="w-6 h-6" /> Code Scannen</button>
                            <div className="flex gap-2">
                                <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="Manuelle ID" className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-center outline-none focus:border-emerald-500" />
                                <button onClick={handleManualScan} disabled={!manualId} className="px-6 bg-zinc-800 rounded-xl font-bold disabled:opacity-50">OK</button>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-white mt-8">Abmelden</button>
                    </div>
                )}
                {mode === 'camera' && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <div id="qr-reader" className="w-full overflow-hidden rounded-3xl border-2 border-emerald-500 shadow-2xl bg-black relative aspect-square" />
                        {cameraError && <p className="text-red-500 mt-4 text-center">{cameraError}</p>}
                        <button onClick={stopCamera} className="mt-8 px-8 py-3 bg-zinc-800 rounded-full font-medium">Abbrechen</button>
                    </div>
                )}
                {mode === 'result' && result && (
                    <div className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center animate-in zoom-in">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-10 h-10" /></div>
                        <h2 className="text-2xl font-bold mb-2">Stempel hinzugefügt!</h2>
                        <p className="text-zinc-400 mb-6">Neuer Stand: {result.newStamps} / {result.maxStamps}</p>
                        <button onClick={resetScanner} className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold">Nächster Scan</button>
                    </div>
                )}
            </main>
        </div>
    )
}

function StatCard({ label, value, icon, color }: any) {
    const colors: any = { emerald: 'text-emerald-500 bg-emerald-500/10', purple: 'text-purple-500 bg-purple-500/10', blue: 'text-blue-500 bg-blue-500/10' }
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{label}</span>
                <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
        </div>
    )
}
