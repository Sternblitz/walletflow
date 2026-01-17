'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
    Zap, Camera, Users, ChevronRight, Send, X, Sparkles, Clock,
    Calendar, Trophy, Target, Bell, Check, RotateCcw, Cake, Mail,
    Phone, BarChart3, Star, TrendingUp, PieChart as PieChartIcon,
    Settings, LogOut, ArrowRight
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
    const [statsRange, setStatsRange] = useState<'24h' | '7d' | '30d'>('7d')
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
    const [customers, setCustomers] = useState<any[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [customersRange, setCustomersRange] = useState<'24h' | '7d' | '30d' | 'all'>('all')
    const [view, setView] = useState<'scanner' | 'dashboard' | 'customers'>('scanner')

    // Push Request Logic (Modal)
    const [showPushModal, setShowPushModal] = useState(false)
    const [pushMode, setPushMode] = useState<'now' | 'schedule'>('now')
    const [pushMessage, setPushMessage] = useState('')
    const [pushScheduleTime, setPushScheduleTime] = useState('')
    const [pushLoading, setPushLoading] = useState(false)
    const [scheduledPushes, setScheduledPushes] = useState<any[]>([])

    // ===============================================
    // LOADERS
    // ===============================================

    useEffect(() => {
        loadCampaignData()
    }, [slug])

    // Reload stats when parameters change
    useEffect(() => {
        if (role === 'chef' && view === 'dashboard') {
            loadStats()
            if (campaignData?.campaign?.id) {
                loadReviews()
                loadScheduledPushes()
            }
        }
    }, [role, view, campaignData, statsRange])

    // Load customers when view is customers
    useEffect(() => {
        if (role === 'chef' && view === 'customers') {
            loadCustomers()
        }
    }, [role, view, customersRange])

    const loadCampaignData = async () => {
        try {
            const res = await fetch(`/api/campaign/by-slug/${slug}`)
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
            const res = await fetch(`/api/app/stats?slug=${slug}&range=${statsRange}`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
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
            // FIXED: use 'customers' endpoint
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
    // AUTHENTICATION
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
    // SCANNER LOGIC
    // ===============================================

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { })
            }
        }
    }, [])

    const startCamera = async () => {
        setCameraError(null)
        setMode('camera')

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
                toast.success('Stempel erfolgreich!')
            } else {
                setError(data.error || 'Scan fehlgeschlagen')
                setMode('idle')
                toast.error(data.error || 'Scan failed')
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

    // ===============================================
    // PUSH LOGIC
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
                loadStats()
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
                            {authError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-center text-sm font-medium">
                                    {authError}
                                </div>
                            )}
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

    // ===============================================
    // RENDER: CHEF DASHBOARD
    // ===============================================

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
                            <p className="text-xs text-muted-foreground font-medium">Willkommen zurück, Chef 👋</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* PUSH BUTTON (Separate, opens Modal) */}
                        <button
                            onClick={() => setShowPushModal(true)}
                            className="h-10 px-4 bg-white/10 border border-white/5 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors gap-2 text-sm font-semibold"
                        >
                            <Send className="w-4 h-4" />
                            Nachricht
                        </button>

                        <button
                            onClick={() => setView('customers')}
                            className="h-10 px-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-500/20 transition-colors gap-2 text-sm font-semibold"
                        >
                            <Users className="w-4 h-4" />
                            Kunden
                        </button>
                        <button
                            onClick={() => setView('scanner')}
                            className="h-10 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors gap-2 text-sm font-semibold"
                        >
                            <Camera className="w-4 h-4" />
                            Scanner
                        </button>
                    </div>
                </header>

                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 custom-scrollbar pb-24">

                    {/* Range Selector */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex bg-zinc-900 border border-white/10 rounded-xl p-1">
                            {(['24h', '7d', '30d'] as const).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setStatsRange(r)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statsRange === r
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {rangeLabels[r]}
                                </button>
                            ))}
                        </div>
                        {stats?.insight && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 px-4 py-2 rounded-xl text-sm text-purple-200 animate-in fade-in">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                {stats.insight}
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Stamps */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100" />
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Stempel</span>
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Zap className="w-4 h-4" /></div>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">{stats?.summary?.stamps || 0}</span>
                            </div>
                        </div>

                        {/* 2. Redemptions */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100" />
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Einlösungen</span>
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Trophy className="w-4 h-4" /></div>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">{stats?.summary?.redemptions || 0}</span>
                            </div>
                        </div>

                        {/* 3. New Customers */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100" />
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Neue Kunden</span>
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Users className="w-4 h-4" /></div>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">{stats?.summary?.newPasses || 0}</span>
                            </div>
                        </div>

                        {/* 4. Total Installed / Ratio */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Gesamt Aktiv</span>
                                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><Target className="w-4 h-4" /></div>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-white">{stats?.summary?.totalInstalled || 0}</span>
                                <div className="flex gap-2 text-[10px] text-zinc-400">
                                    <span>🍏 {stats?.summary?.apple || 0}</span>
                                    <span>🤖 {stats?.summary?.google || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Review Widget (Inserted here) */}
                        <div className="col-span-2 lg:col-span-1">
                            {reviewStats ? <ReviewWidget stats={reviewStats} /> : (
                                <div className="h-full w-full bg-zinc-900/50 rounded-xl flex items-center justify-center p-4 border border-white/5">
                                    <div className="animate-pulse w-8 h-8 rounded-full bg-zinc-800" />
                                </div>
                            )}
                        </div>

                        {/* Retention Bar (Custom Implementation) */}
                        <div className="col-span-2 lg:col-span-1 bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex flex-col justify-center">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Kundenbindung</h3>
                                    <div className="text-2xl font-bold text-white mt-1">
                                        {stats?.summary?.stamps > 0 ? Math.round(((stats?.summary?.redemptions || 0) / (stats.summary.stamps)) * 100) : 0}%
                                    </div>
                                </div>
                                <PieChartIcon className="w-6 h-6 text-zinc-700" />
                            </div>
                            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(((stats?.summary?.redemptions || 0) / (Math.max(stats?.summary?.stamps, 1))) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Activity Chart */}
                        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 min-h-[300px] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-white">Verlauf</h3>
                                <div className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
                                    {rangeLabels[statsRange]}
                                </div>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ActivityChart data={stats?.history || []} />
                            </div>
                        </div>

                        {/* Recent Activity (Renamed from Live Feed) */}
                        <div className="bg-card dark:bg-zinc-900/50 border border-border dark:border-white/10 rounded-3xl p-6 h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-emerald-500" />
                                    Letzte Aktivitäten
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                                {stats?.recentActivity?.length > 0 ? (
                                    stats.recentActivity.map((activity: any) => (
                                        <div key={activity.id} className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-border dark:border-white/5 hover:bg-background transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.action === 'redeem'
                                                    ? 'bg-purple-500/10 text-purple-500'
                                                    : 'bg-emerald-500/10 text-emerald-500'
                                                    }`}>
                                                    {activity.action === 'redeem' ? <Trophy size={18} /> : <Check size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {activity.action === 'redeem' ? 'Prämie eingelöst' : 'Stempel gesammelt'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Pass #{activity.passes?.serial_number?.slice(-4) || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {new Date(activity.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-muted-foreground">
                                        <p>Noch keine Scans in diesem Zeitraum</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CALENDAR & AUTOMATIONS (Bottom Section) */}
                    <div className="pt-8 border-t border-white/5 space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-400" />
                            Kalender & Regeln
                        </h3>

                        {/* Scheduled Pushes List */}
                        {scheduledPushes.length > 0 && (
                            <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Geplante Nachrichten</h4>
                                {scheduledPushes.map((push) => (
                                    <div key={push.id} className="flex gap-3 items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{push.message}</p>
                                            <p className="text-xs text-zinc-500">
                                                Geplant für: {new Date(push.scheduled_at).toLocaleString('de-DE')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <AutomationRulesManager slug={slug} />
                    </div>

                    <button onClick={handleLogout} className="mx-auto block mt-8 mb-8 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                        Abmelden
                    </button>
                </main>

                {/* PUSH MODAL Overlay */}
                <AnimatePresence>
                    {showPushModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-3xl p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Send size={18} className="text-emerald-500" /> Nachricht senden</h2>
                                    <button onClick={() => setShowPushModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                        <X size={18} className="text-zinc-400" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto space-y-6">
                                    {/* Mode Toggle */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setPushMode('now')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'now' ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}>
                                            <div className={`p-3 rounded-full ${pushMode === 'now' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}><Send className="w-5 h-5" /></div>
                                            <span className={`text-sm font-bold ${pushMode === 'now' ? 'text-white' : 'text-zinc-400'}`}>Jetzt senden</span>
                                        </button>
                                        <button onClick={() => setPushMode('schedule')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'schedule' ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/20' : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}>
                                            <div className={`p-3 rounded-full ${pushMode === 'schedule' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}><Calendar className="w-5 h-5" /></div>
                                            <span className={`text-sm font-bold ${pushMode === 'schedule' ? 'text-white' : 'text-zinc-400'}`}>Später planen</span>
                                        </button>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handlePushRequest} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400 ml-1">Nachricht</label>
                                            <textarea
                                                value={pushMessage}
                                                onChange={(e) => setPushMessage(e.target.value)}
                                                placeholder="Was möchtest du deinen Kunden mitteilen?"
                                                className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 transition-colors resize-none"
                                            />
                                        </div>

                                        {pushMode === 'schedule' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-sm font-medium text-zinc-400 ml-1">Zeitpunkt</label>
                                                <input
                                                    type="datetime-local"
                                                    value={pushScheduleTime}
                                                    onChange={(e) => setPushScheduleTime(e.target.value)}
                                                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50 transition-colors"
                                                />
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={pushLoading || !pushMessage.trim() || (pushMode === 'schedule' && !pushScheduleTime)}
                                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${pushMode === 'now'
                                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                                                : 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {pushLoading ? (
                                                <span className="animate-pulse">Sende...</span>
                                            ) : (
                                                <>
                                                    {pushMode === 'now' ? <Send className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                    {pushMode === 'now' ? 'Jetzt senden' : 'Einplanen'}
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // ===============================================
    // RENDER: CUSTOMERS VIEW
    // ===============================================

    if (role === 'chef' && view === 'customers') {
        return (
            <div className="dark min-h-screen bg-black text-foreground flex flex-col relative">
                <Background />
                <header className="relative z-10 p-6 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-cyan-500/10 rounded-xl">
                            <Users className="w-6 h-6 text-cyan-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Kundenliste</h1>
                            <p className="text-xs text-muted-foreground">{customers.length} Kunden</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setView('dashboard')}
                        className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </header>

                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full custom-scrollbar">
                    <div className="flex gap-2 mb-6">
                        {(['all', '24h', '7d', '30d'] as const).map(r => (
                            <button
                                key={r} onClick={() => setCustomersRange(r)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${customersRange === r ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
                            >
                                {r === 'all' ? 'Alle' : r}
                            </button>
                        ))}
                    </div>

                    {customersLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Noch keine Kunden</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {customers.map((customer: any) => (
                                <div key={customer.id} className={`p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-900 transition-colors ${customer.deletedAt ? 'opacity-50' : ''}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold truncate text-white">{customer.name || `Kunde #${customer.customerNumber}`}</h3>
                                                {customer.platform && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400">{customer.platform === 'apple' ? 'iOS' : 'Android'}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                                {customer.lastActivity && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(customer.lastActivity).toLocaleDateString()}</span>}
                                                {customer.birthday && <span className="flex items-center gap-1 text-purple-400"><Cake size={10} /> {new Date(customer.birthday).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}.</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-emerald-500">{customer.stamps}/{customer.maxStamps}</div>
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
    // RENDER: SCANNER VIEW (Default)
    // ===============================================

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                {role === 'chef' && (
                    <button onClick={() => setView('dashboard')} className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </button>
                )}
                <ThemeToggle />
            </div>
            <Background />

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
                {/* ... Scanner UI (Simplified for brevity, but functional structure) ... */}
                {mode === 'idle' && (
                    <div className="space-y-8 w-full text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 animate-in zoom-in duration-500">
                            <Zap className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold">QARD POS</h1>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={startCamera} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                                <Camera className="w-6 h-6" /> Code Scannen
                            </button>
                            <div className="flex gap-2">
                                <input
                                    value={manualId} onChange={e => setManualId(e.target.value)}
                                    placeholder="Manuelle ID (z.B. 123)"
                                    className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-center text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500"
                                />
                                <button onClick={handleManualScan} disabled={!manualId} className="px-6 bg-zinc-800 rounded-xl font-bold disabled:opacity-50">OK</button>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-white mt-8">
                            Abmelden
                        </button>
                    </div>
                )}

                {mode === 'camera' && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <div id="qr-reader" className="w-full overflow-hidden rounded-3xl border-2 border-emerald-500 shadow-2xl bg-black relative aspect-square" />
                        <button onClick={stopCamera} className="mt-8 px-8 py-3 bg-zinc-800 rounded-full font-medium">Abbrechen</button>
                    </div>
                )}

                {mode === 'result' && result && (
                    <div className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center animate-in zoom-in">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Stempel hinzugefügt!</h2>
                        <p className="text-zinc-400 mb-6">Neuer Stand: {result.newStamps} / {result.maxStamps}</p>
                        <button onClick={resetScanner} className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold">Nächster Scan</button>
                    </div>
                )}

            </main>
        </div>
    )
}
