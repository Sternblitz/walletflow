'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Zap, Camera, Users, LayoutDashboard, LogOut, ChevronRight, Send, X, Sparkles, TrendingUp, Clock, Calendar, Trophy, Target, Bell, Check, RotateCcw, Cake, Mail, Phone, BarChart3, Settings, ArrowRight, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { ActivityChart } from '@/components/app/POSCharts'
import { Background } from '@/components/app/Background'
import { AutomationManager } from '@/components/app/AutomationManager'
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
    const [view, setView] = useState<'scanner' | 'dashboard' | 'push' | 'customers'>('scanner')

    // Push request state
    const [pushMode, setPushMode] = useState<'now' | 'schedule'>('now')
    const [pushMessage, setPushMessage] = useState('')
    const [pushScheduleTime, setPushScheduleTime] = useState('')
    const [pushLoading, setPushLoading] = useState(false)
    const [scheduledPushes, setScheduledPushes] = useState<any[]>([])

    // Load campaign data
    useEffect(() => {
        loadCampaignData()
    }, [slug])

    // Load stats when entering dashboard
    useEffect(() => {
        if (role === 'chef' && view === 'dashboard') {
            loadStats()
        }
        if (role === 'chef' && view === 'dashboard' && campaignData?.campaign?.id) {
            loadReviews()
        }
        if (role === 'chef' && view === 'customers') {
            loadCustomers()
        }
    }, [role, view, campaignData, statsRange, customersRange])

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
            const res = await fetch(`/api/app/customer-list?slug=${slug}&range=${customersRange}`)
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

    useEffect(() => {
        if (role === 'chef' && view === 'push') {
            loadScheduledPushes()
        }
    }, [role, view, campaignData])

    // PIN Authentication
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
                setView('dashboard')
                loadStats()
            } else {
                toast.error('Fehler beim Senden')
            }
        } catch (e) {
            toast.error('Ein Fehler ist aufgetreten')
        } finally {
            setPushLoading(false)
        }
    } // --- Components ---

    // ========================================
    // RENDER: PIN Login Screen
    // ========================================
    if (role === 'none') {
        return (
            <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-background text-foreground transition-colors duration-500">
                <div className="absolute top-4 right-4 z-50">
                    <ThemeToggle />
                </div>
                <Background />
                <div className="relative z-10 w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                    {/* Logo */}
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 rotate-3 transform hover:rotate-6 transition-transform">
                            <Zap className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">QARD POS</h1>
                            <p className="text-emerald-500 font-medium mt-1 uppercase tracking-widest text-xs">{slug}</p>
                        </div>
                    </div>

                    {/* PIN Form */}
                    <div className="bg-white/50 dark:bg-black/30 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">Zugangspin eingeben</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-full px-4 py-4 bg-transparent border-2 border-dashed border-black/10 dark:border-white/20 rounded-xl text-center text-3xl tracking-[0.6em] placeholder:tracking-normal focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all font-mono"
                                    autoFocus
                                />
                            </div>

                            {authError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-center text-sm font-medium animate-in slide-in-from-top-2">
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={pin.length < 4}
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

    // ========================================
    // RENDER: Chef Dashboard
    // ========================================
    if (role === 'chef' && view === 'dashboard') {
        const formatDate = (dateString: string) => {
            const date = new Date(dateString)
            return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(date)
        }

        return (
            <div className="dark min-h-screen bg-black text-foreground flex flex-col relative overflow-hidden transition-colors duration-500">
                <Background />

                {/* Header */}
                <header className="relative z-10 px-6 py-6 flex items-center justify-between backdrop-blur-sm bg-background/50 border-b border-white/5 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">Dashboard</h1>
                            <p className="text-xs text-muted-foreground font-medium">Willkommen zurück, Chef 👋</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setView('scanner')}
                            className="h-10 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors gap-2 text-sm font-semibold"
                        >
                            <Camera className="w-4 h-4" />
                            Scanner
                        </button>
                        <button
                            onClick={() => setView('customers')}
                            className="h-10 px-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-500/20 transition-colors gap-2 text-sm font-semibold"
                        >
                            <Users className="w-4 h-4" />
                            Kunden
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">

                    {/* Range Selector & Insight */}
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
                                    {r}
                                </button>
                            ))}
                        </div>
                        {stats?.insight && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 px-4 py-2 rounded-xl text-sm text-purple-200">
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
                                <span className="text-xs text-emerald-500">+{stats?.summary?.stamps || 0}</span>
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
                                <div>
                                    <span className="text-2xl font-bold text-white">{stats?.summary?.totalInstalled || 0}</span>
                                    <p className="text-[10px] text-zinc-500 mt-1">Installierte Karten</p>
                                </div>
                                <div className="flex gap-2 text-[10px] text-zinc-400">
                                    <span>🍏 {stats?.summary?.apple || 0}</span>
                                    <span>🤖 {stats?.summary?.google || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart (Activity) */}
                        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 min-h-[300px] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-white">Verlauf</h3>
                                <div className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
                                    Letzte {statsRange}
                                </div>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ActivityChart data={stats?.history || []} />
                            </div>
                        </div>


                        {/* Feed */}
                        <div className="bg-card dark:bg-zinc-900/50 border border-border dark:border-white/10 rounded-3xl p-6 h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-emerald-500" />
                                    Live Feed
                                </h3>
                                <button className="text-xs text-emerald-500 font-medium hover:underline">View All</button>
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
                                                    {activity.action === 'redeem' ? <Users size={18} /> : <Check size={18} />}
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
                                                {formatDate(activity.created_at)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-muted-foreground">
                                        <p>Noch keine Scans heute</p>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 mt-auto border-t border-white/5">
                                <button
                                    onClick={() => setView('push')}
                                    className="w-full py-3 bg-zinc-900 border border-zinc-800 hover:bg-black text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={16} />
                                    Manuelle Push-Nachricht
                                </button>
                            </div>
                        </div>
                    </div>


                    <button
                        onClick={handleLogout}
                        className="mx-auto block mt-8 mb-8 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                    >
                        Abmelden
                    </button>

                </main>
            </div>
        )
    }

    // ========================================
    // RENDER: Push Request Form
    // ========================================
    // ========================================
    // RENDER: Push Request Form
    // ========================================
    if (role === 'chef' && view === 'push') {
        return (
            <div className="dark min-h-screen bg-black text-foreground flex flex-col relative overflow-hidden">
                <Background />

                {/* Header */}
                <header className="relative z-10 px-6 py-4 flex items-center gap-4 border-b border-white/5 bg-black/50 backdrop-blur-md">
                    <button onClick={() => setView('dashboard')} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="text-lg font-bold">Nachricht senden</h1>
                </header>

                <main className="relative z-10 flex-1 p-6 overflow-y-auto w-full max-w-2xl mx-auto space-y-8">

                    {/* Mode Toggle as Big Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setPushMode('now')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'now'
                                ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}
                        >
                            <div className={`p-3 rounded-full ${pushMode === 'now' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Send className="w-5 h-5" />
                            </div>
                            <span className={`text-sm font-bold ${pushMode === 'now' ? 'text-white' : 'text-zinc-400'}`}>Jetzt senden</span>
                        </button>

                        <button
                            onClick={() => setPushMode('schedule')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'schedule'
                                ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/20'
                                : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}
                        >
                            <div className={`p-3 rounded-full ${pushMode === 'schedule' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Calendar className="w-5 h-5" />
                            </div>
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
                                className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 transition-colors resize-none"
                            />
                        </div>

                        {pushMode === 'schedule' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-zinc-400 ml-1">Zeitpunkt</label>
                                <input
                                    type="datetime-local"
                                    value={pushScheduleTime}
                                    onChange={(e) => setPushScheduleTime(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50 transition-colors"
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

                    {/* Overview: Automations & Planned */}
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
                </main>
            </div>
        )
    }

    // ========================================
    // RENDER: Customers View
    // ========================================
    if (role === 'chef' && view === 'customers') {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col relative">
                <Background />
                <header className="relative z-10 p-6 flex items-center justify-between border-b border-border">
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
                        className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full"
                    >
                        <X size={16} />
                    </button>
                </header>

                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
                    {customersLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Noch keine Kunden</p>
                            <p className="text-sm mt-1">Kunden erscheinen hier, sobald sie ihre Karte scannen.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {customers.map((customer: any) => (
                                <div
                                    key={customer.id}
                                    className={`p-4 bg-card border border-border rounded-2xl hover:bg-accent/5 transition-colors ${customer.deletedAt ? 'bg-red-500/5 border-red-500/20' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`font-semibold truncate ${customer.deletedAt ? 'text-muted-foreground line-through' : ''}`}>
                                                    {customer.name || `Kunde #${customer.customerNumber}`}
                                                </h3>
                                                {customer.deletedAt ? (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium border border-red-500/20">
                                                        Gelöscht
                                                    </span>
                                                ) : (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${customer.platform === 'apple'
                                                        ? 'bg-white/10 text-white'
                                                        : 'bg-zinc-700 text-zinc-300'
                                                        }`}>
                                                        {customer.platform === 'apple' ? 'Apple' : 'Google'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                {customer.lastActivity && (
                                                    <span className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5">
                                                        <Clock className="w-3 h-3 text-zinc-400" />
                                                        {(() => {
                                                            const d = new Date(customer.lastActivity)
                                                            const now = new Date()
                                                            const diff = now.getTime() - d.getTime()
                                                            const mins = Math.floor(diff / 60000)
                                                            if (mins < 60) return `${mins} Min`
                                                            const hours = Math.floor(mins / 60)
                                                            if (hours < 24) return `${hours} Std`
                                                            return `${Math.floor(hours / 24)} Tage`
                                                        })()}
                                                    </span>
                                                )}

                                                <span className="w-px h-3 bg-white/20 hidden sm:block"></span>

                                                {customer.birthday && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Cake className="w-3 h-3 text-purple-400" />
                                                        {new Date(customer.birthday).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}.
                                                    </span>
                                                )}
                                                {customer.email && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail className="w-3 h-3" />
                                                        {customer.email}
                                                    </span>
                                                )}
                                                {customer.phone && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3" />
                                                        {customer.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-bold text-emerald-500">
                                                {customer.stamps}/{customer.maxStamps}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                                Stempel
                                            </div>
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
                            <LayoutDashboard className="w-5 h-5" />
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
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">QARD Point of Sale</p>
            </footer>
        </div>
    )
}
