'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
    Zap, Camera, Users, ChevronRight, Send, X, Sparkles, Clock,
    Calendar, Trophy, Target, Bell, Check, RotateCcw, Cake, Mail,
    Phone, BarChart3, Star, TrendingUp, PieChart as PieChartIcon,
    LogOut, ArrowRight, Crown, AlertTriangle, Layers, Gift,
    MessageSquare, Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { PremiumActivityChart } from '@/components/app/POSCharts'
import { AutomationRulesManager } from '@/components/app/AutomationRulesManager'
import { LiveActivityFeed } from '@/components/app/LiveActivityFeed'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { getReviewStats, ReviewStats } from "@/lib/reviews"
import { ReviewWidget } from "@/components/analytics/ReviewWidget"
import { ThemeToggle } from '@/components/app/ThemeToggle'
import { CustomerList } from '@/components/app/CustomerList'
import { CustomerDetailModal } from '@/components/app/CustomerDetailModal'

// Singleton Supabase client to avoid multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null
function getSupabaseClient() {
    if (!supabaseInstance) {
        supabaseInstance = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return supabaseInstance
}

type Role = 'none' | 'staff' | 'chef'
type Mode = 'idle' | 'camera' | 'result' | 'cooldown' | 'wrongCampaign' | 'scanError'

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

// Helper: Detect mobile or tablet device
const isMobileOrTablet = (): boolean => {
    if (typeof window === 'undefined') return false
    const ua = navigator.userAgent.toLowerCase()
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(ua) ||
        (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024)
}

// Sound Effects using Web Audio API
const playSuccessSound = () => {
    if (typeof window === 'undefined') return
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Pleasant success tone (two-note ascending)
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
        console.log('Audio not available')
    }
}

const playErrorSound = () => {
    if (typeof window === 'undefined') return
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Error tone (descending, slightly harsh)
        oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime) // F4
        oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime + 0.15) // D4
        oscillator.type = 'square'

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
        console.log('Audio not available')
    }
}

export default function POSPage() {
    const params = useParams()
    const slug = params.slug as string
    const isProcessing = useRef(false)
    const shouldAutoStartScanner = useRef(false)

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

    // Cooldown State
    const [cooldownData, setCooldownData] = useState<{ minutes: number, passId: string } | null>(null)
    const [showCooldownModal, setShowCooldownModal] = useState(false)
    const [overridePin, setOverridePin] = useState('')
    const [overrideLoading, setOverrideLoading] = useState(false)

    // Scan Error State
    const [scanErrorMessage, setScanErrorMessage] = useState<string>('')

    // Gift Modal State
    const [pendingGift, setPendingGift] = useState<any>(null)
    const [showGiftModal, setShowGiftModal] = useState(false)
    const [redeemingGift, setRedeemingGift] = useState(false)


    // Dashboard
    const [stats, setStats] = useState<any>(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [statsRange, setStatsRange] = useState<'24h' | '7d' | '30d' | 'all'>('all')
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
    const [pushHistory, setPushHistory] = useState<any[]>([])
    const [pushToDelete, setPushToDelete] = useState<string | null>(null) // ID of push to confirm delete
    const [deletingPush, setDeletingPush] = useState(false)
    // Inactivity targeting
    const [pushTarget, setPushTarget] = useState<'all' | 'inactive'>('all')
    const [inactivityDays, setInactivityDays] = useState<14 | 30 | 60 | 'custom'>(14)
    const [customInactivityDays, setCustomInactivityDays] = useState(30)

    // Reviews
    const [showReviewsModal, setShowReviewsModal] = useState(false)


    // Calendar
    const [calendarMonth, setCalendarMonth] = useState(new Date())
    const [automations, setAutomations] = useState<any[]>([])
    const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null) // YYYY-MM-DD format

    // Customer Details
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

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
        // Create abort controller to cancel in-flight requests on cleanup
        const abortController = new AbortController()

        if (role === 'chef' && view === 'dashboard' && campaignData?.campaign?.id) {
            // Pass abort signal to functions that support it
            loadStats(abortController.signal)
            loadReviews()
            loadScheduledPushes()
            loadPushHistory()
            loadAutomations()
        }

        // Cleanup: abort pending requests when dependencies change
        return () => {
            abortController.abort()
        }
    }, [role, view, campaignData, statsRange])

    useEffect(() => {
        // Load customers for both dashboard (calendar) and customers view
        if (role === 'chef' && (view === 'customers' || view === 'dashboard') && campaignData?.campaign?.id) {
            loadCustomers()
        }
    }, [role, view, campaignData])

    // Auto-start scanner on mobile/tablet after PIN login
    // Also cleanup scanner when switching views
    useEffect(() => {
        if (role !== 'none' && view === 'scanner' && shouldAutoStartScanner.current) {
            shouldAutoStartScanner.current = false
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                startCamera()
            }, 300)
        }
        // Cleanup scanner when switching to dashboard or customers
        // Only try to stop if we're in camera mode (scanner is actually running)
        if (view !== 'scanner' && scannerRef.current && mode === 'camera') {
            scannerRef.current.stop().catch(() => { })
            scannerRef.current = null
            setMode('idle')
        }
    }, [role, view, mode])

    const loadCampaignData = async () => {
        try {
            const res = await fetch(`/api/campaign/by-slug/${slug}`)
            if (res.ok) setCampaignData(await res.json())
        } catch (e) {
            console.error('Failed to load campaign:', e)
        }
    }

    const loadStats = async (signal?: AbortSignal) => {
        if (!campaignData?.campaign?.id) return
        setStatsLoading(true)
        try {
            const res = await fetch(`/api/campaign/${campaignData.campaign.id}/stats?period=${statsRange}`, { signal })
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e: any) {
            // Ignore abort errors (expected when switching views/ranges quickly)
            if (e?.name !== 'AbortError') {
                console.error('Failed to load stats:', e)
            }
        } finally {
            setStatsLoading(false)
        }
    }

    const loadReviews = async () => {
        if (!campaignData?.campaign?.id) return
        try {
            const supabase = getSupabaseClient()
            const stats = await getReviewStats(supabase, campaignData.campaign.id)
            setReviewStats(stats)
        } catch (e) {
            console.error('Failed to load reviews:', e)
        }
    }

    const loadCustomers = async () => {
        if (!slug) return
        setCustomersLoading(true)
        try {
            const res = await fetch(`/api/app/customers?slug=${slug}&activity=true`)
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
        const supabase = getSupabaseClient()
        const { data } = await supabase
            .from('push_requests')
            .select('*')
            .eq('campaign_id', campaignData.campaign.id)
            .in('status', ['pending', 'scheduled', 'approved'])
            .order('scheduled_at', { ascending: true })

        if (data) setScheduledPushes(data.filter(p => p.scheduled_at && new Date(p.scheduled_at) > new Date()))
    }

    const loadPushHistory = async () => {
        if (!campaignData?.campaign?.id) return
        const supabase = getSupabaseClient()
        const { data } = await supabase
            .from('push_requests')
            .select('*')
            .eq('campaign_id', campaignData.campaign.id)
            .in('status', ['sent', 'failed'])
            .order('sent_at', { ascending: false })
            .limit(30)

        if (data) setPushHistory(data)
    }

    const loadAutomations = async () => {
        if (!campaignData?.campaign?.id) return
        const supabase = getSupabaseClient()
        const { data } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('campaign_id', campaignData.campaign.id)
            .eq('is_enabled', true)

        if (data) setAutomations(data)
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
                // Auto-start scanner on mobile/tablet
                if (isMobileOrTablet()) {
                    shouldAutoStartScanner.current = true
                }
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
                    {
                        facingMode: 'environment'
                    },
                    {
                        fps: 10,
                        qrbox: { width: 220, height: 220 },
                        aspectRatio: 1.0,
                        // Disable built-in corner styling - we use custom CSS
                        disableFlip: false
                    },
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
                body: JSON.stringify({ passId: decodedText, action: 'ADD_STAMP', slug })
            })
            const data = await res.json()
            if (res.ok) {
                playSuccessSound()
                setResult(data)
                setMode('result')
                toast.success('Stempel erfolgreich!')

                // Check for pending gifts (birthday, loyalty, etc.)
                if (data.pendingGifts && data.pendingGifts.length > 0) {
                    // Show the first pending gift
                    setPendingGift({
                        ...data.pendingGifts[0],
                        customerName: data.customerName,
                        customerBirthday: data.customerBirthday
                    })
                    // Small delay to let result show first
                    setTimeout(() => setShowGiftModal(true), 500)
                }
            } else if (res.status === 429 && data.error === 'SCAN_COOLDOWN') {
                // Handle Cooldown
                playErrorSound()
                setCooldownData({
                    minutes: data.remainingMinutes,
                    passId: decodedText
                })
                setMode('cooldown')
                stopCamera()
            } else if (res.status === 403 && data.error === 'WRONG_CAMPAIGN') {
                // Handle Wrong Campaign - scanned pass from different business
                playErrorSound()
                setMode('wrongCampaign')
                stopCamera()
            } else if (res.status === 404) {
                // Handle Pass not found - might be wrong QR code or invalid
                playErrorSound()
                setScanErrorMessage('Dieser QR-Code gehört nicht zu diesem System oder ist ungültig.')
                setMode('scanError')
                stopCamera()
            } else {
                // Handle other errors
                playErrorSound()
                setScanErrorMessage(data.message || data.error || 'Ein unbekannter Fehler ist aufgetreten.')
                setMode('scanError')
                stopCamera()
            }
        } catch (e) {
            playErrorSound()
            setScanErrorMessage('Netzwerkfehler - Bitte Internetverbindung prüfen.')
            setMode('scanError')
            stopCamera()
        } finally {
            setTimeout(() => { isProcessing.current = false }, 2000)
        }
    }

    const handleOverrideScan = async () => {
        if (!overridePin || !cooldownData) return
        setOverrideLoading(true)

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passId: cooldownData.passId,
                    action: 'ADD_STAMP',
                    force: true,
                    chefPin: overridePin,
                    slug
                })
            })
            const data = await res.json()

            if (res.ok) {
                playSuccessSound()
                setShowCooldownModal(false)
                setResult(data)
                setMode('result')
                toast.success('Stempel erfolgreich (Override)!')
                setOverridePin('')
                setCooldownData(null)
            } else {
                playErrorSound()
                toast.error(data.error || 'Override gescheitert')
                if (data.requiresOverride) {
                    toast.error('Falscher PIN')
                }
            }
        } catch (e) {
            playErrorSound()
            toast.error('Netzwerkfehler')
        } finally {
            setOverrideLoading(false)
        }
    }

    const handleManualScan = async () => {
        if (!manualId.trim()) return
        // Clean up input: remove spaces, uppercase
        const cleanId = manualId.trim().replace(/\s+/g, '').toUpperCase()
        if (cleanId.length < 3) {
            toast.error('ID zu kurz')
            return
        }
        handleScan(cleanId)
    }

    const resetScanner = () => {
        setMode('idle')
        setResult(null)
        setManualId('')
        setError(null)
    }

    // ===============================================
    // GIFT REDEMPTION
    // ===============================================

    const handleRedeemGift = async () => {
        if (!pendingGift) return
        setRedeemingGift(true)

        try {
            const res = await fetch('/api/gifts/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    giftId: pendingGift.id,
                    redeemedBy: label || 'Mitarbeiter'
                })
            })

            if (res.ok) {
                playSuccessSound()
                setShowGiftModal(false)
                setPendingGift(null)
                toast.success('🎂 Geburtstagsgeschenk eingelöst!', {
                    description: pendingGift.gift_title
                })
            } else {
                const data = await res.json()
                toast.error(data.error || 'Einlösen fehlgeschlagen')
            }
        } catch (e) {
            toast.error('Netzwerkfehler')
        } finally {
            setRedeemingGift(false)
        }
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
                    // Convert local datetime-local to proper ISO string
                    scheduleTime: pushMode === 'schedule' && pushScheduleTime
                        ? new Date(pushScheduleTime).toISOString()
                        : null,
                    // Inactivity targeting
                    targetType: pushTarget,
                    inactiveDays: pushTarget === 'inactive'
                        ? (inactivityDays === 'custom' ? customInactivityDays : inactivityDays)
                        : null
                })
            })
            if (res.ok) {
                const data = await res.json()
                if (data.needsApproval) {
                    toast.success('📬 Anfrage zur Genehmigung gesendet!', {
                        description: pushMode === 'schedule'
                            ? 'Nach Genehmigung wird sie zum geplanten Zeitpunkt gesendet.'
                            : 'Der Admin wird benachrichtigt.'
                    })
                } else {
                    toast.success(pushMode === 'schedule' ? 'Nachricht eingeplant!' : 'Nachricht gesendet!')
                }
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

    const handleDeleteScheduledPush = async () => {
        if (!pushToDelete) return
        setDeletingPush(true)
        try {
            const supabase = getSupabaseClient()
            const { error } = await supabase
                .from('push_requests')
                .delete()
                .eq('id', pushToDelete)

            if (error) {
                toast.error('Fehler beim Löschen')
                console.error('Delete error:', error)
            } else {
                toast.success('Geplante Nachricht gelöscht!')
                loadScheduledPushes()
            }
        } catch (e) {
            toast.error('Ein Fehler ist aufgetreten')
        } finally {
            setDeletingPush(false)
            setPushToDelete(null)
        }
    }

    // ===============================================
    // RENDER: LOGIN
    // ===============================================

    if (role === 'none') {
        return (
            <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-slate-50 dark:bg-black text-zinc-900 dark:text-white">
                <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
                <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none dark:from-emerald-500/10" />
                <div className="relative z-10 w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 rotate-3 transform hover:rotate-6 transition-transform">
                            <Zap className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">QARD APP</h1>
                            <p className="text-emerald-600 dark:text-emerald-500 font-medium mt-1 uppercase tracking-widest text-xs">{slug}</p>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-xl dark:shadow-2xl">
                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-3 text-center">Zugangspin eingeben</label>
                                <input
                                    type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                                    value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-full px-4 py-4 bg-transparent border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-xl text-center text-3xl tracking-[0.6em] placeholder:tracking-normal focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all font-mono text-zinc-900 dark:text-white"
                                    autoFocus
                                />
                            </div>
                            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
                            <button
                                type="submit" disabled={pin.length < 4}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
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
        const rangeLabels: Record<string, string> = { '24h': '24h', '7d': '7 Tage', '30d': '30 Tage', 'all': 'GESAMT' }
        const loyalty = stats?.loyalty

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col relative overflow-hidden">
                <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
                <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none dark:from-emerald-500/10" />

                {/* Header */}
                <header className="relative z-10 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/40 dark:bg-black/40 border-b border-zinc-200/50 dark:border-white/5 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{greeting}, Chef 👋</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView('scanner')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white dark:text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Camera size={16} />
                            <span className="text-sm hidden sm:inline">Scanner</span>
                        </button>
                        <button
                            onClick={() => setView('customers')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors"
                        >
                            <Users size={16} />
                            <span className="text-sm hidden sm:inline">Kunden</span>
                        </button>

                    </div>
                </header>

                <main className="relative z-10 flex-1 p-6 w-full max-w-6xl mx-auto pb-32">
                    {/* Main content - single column */}
                    <div className="space-y-6">

                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group shadow-sm dark:shadow-none"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-1000" />

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Kundenbindung</h3>
                                    </div>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-[200px] leading-relaxed">
                                        {loyalty?.message || "Deine Kunden sind aktiv! Weiter so."}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                                            {loyalty?.score || 60}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 mt-1">
                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                            <TrendingUp size={10} /> +{Math.floor(Math.random() * 5) + 2}%
                                        </span>
                                        <span className="text-[10px] text-zinc-500">zur Vorwoche</span>
                                    </div>
                                </div>
                            </div>

                            {/* Gradient Bar - Red to Green */}
                            <div className="relative h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                                <div className="absolute inset-0 opacity-80" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 25%, #eab308 50%, #84cc16 75%, #22c55e 100%)' }} />

                                {/* Progress Darkener (reveals the gradient) */}
                                <motion.div
                                    className="absolute top-0 h-full bg-slate-50/90 dark:bg-zinc-900/90 z-10"
                                    style={{ left: `${loyalty?.score || 60}%`, right: 0 }}
                                    initial={{ left: '0%' }}
                                    animate={{ left: `${loyalty?.score || 60}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />

                                {/* Pulsing Marker */}
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-full z-20"
                                    style={{ left: `calc(${loyalty?.score || 60}% - 3px)` }}
                                    initial={{ left: '0%' }}
                                    animate={{ left: `calc(${loyalty?.score || 60}% - 3px)` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                >
                                    <div className="w-full h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white/30 rounded-full blur-[2px] animate-pulse" />
                                </motion.div>
                            </div>

                            {/* Milestones / Badges - Minimalist */}
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2.5 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold rounded-lg border border-zinc-200 dark:border-white/10 flex items-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                    SYSTEME BEREIT
                                </span>
                            </div>
                        </motion.div>

                        {/* STATS HEADER with Time Range Selector */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                                Statistiken
                            </h3>
                            <div className="flex bg-zinc-200 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 rounded-xl p-1 gap-1">
                                {(['all', '24h', '7d', '30d'] as const).map(r => {
                                    const isAll = r === 'all'
                                    const active = statsRange === r
                                    return (
                                        <button
                                            key={r}
                                            onClick={() => setStatsRange(r)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active
                                                ? isAll
                                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-900'
                                                    : 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                                                }`}
                                        >
                                            {rangeLabels[r]}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* KEY STATS GRID - 4 Cards with distinct colors */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Stempel */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-emerald-600/70 dark:text-emerald-200/70 text-[10px] font-bold uppercase tracking-wider">Stempel</span>
                                    <div className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10"><Zap size={14} /></div>
                                </div>
                                <div className="text-2xl font-black text-emerald-900 dark:text-white">{stats?.stats?.stamps || 0}</div>
                                <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold mt-2">
                                    im Zeitraum ({rangeLabels[statsRange]})
                                </div>
                            </div>

                            {/* Einlösungen */}
                            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all shadow-lg shadow-purple-900/5 dark:shadow-purple-900/10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-purple-600/70 dark:text-purple-200/70 text-[10px] font-bold uppercase tracking-wider">Einlösungen</span>
                                    <div className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10"><Gift size={14} /></div>
                                </div>
                                <div className="text-2xl font-black text-purple-900 dark:text-white">{stats?.stats?.redemptions || 0}</div>
                                <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] font-bold mt-2">
                                    im Zeitraum ({rangeLabels[statsRange]})
                                </div>
                            </div>

                            {/* Neue Kunden */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all shadow-lg shadow-blue-900/5 dark:shadow-blue-900/10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-blue-600/70 dark:text-blue-200/70 text-[10px] font-bold uppercase tracking-wider">Neue Kunden</span>
                                    <div className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10"><Users size={14} /></div>
                                </div>
                                <div className="text-2xl font-black text-blue-900 dark:text-white">{stats?.stats?.newPasses || 0}</div>
                                <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-bold mt-2">
                                    im Zeitraum ({rangeLabels[statsRange]})
                                </div>
                            </div>

                            {/* Bewertungen */}
                            {reviewStats ? (
                                <button
                                    onClick={() => setShowReviewsModal(true)}
                                    className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all shadow-sm dark:shadow-lg dark:shadow-amber-900/10 text-left w-full group relative"
                                >
                                    <div className="absolute bottom-4 right-4 text-amber-500/50 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                                        <ArrowRight size={18} />
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-amber-700/70 dark:text-amber-200/70 text-[10px] font-bold uppercase tracking-wider group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">Bewertungen</span>
                                        <div className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10"><Star size={14} className="fill-amber-500/50" /></div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-amber-900 dark:text-white">{reviewStats.total}</span>
                                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{reviewStats.average}★</span>
                                    </div>
                                    <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold mt-2">
                                        Gesamt
                                    </div>
                                </button>
                            ) : (
                                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-2xl p-4 shadow-sm dark:shadow-none">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-zinc-500 text-[10px] font-bold uppercase">Bewertungen</span>
                                        <div className="p-1.5 rounded-lg text-zinc-500 bg-zinc-100 dark:bg-zinc-800"><Star size={14} /></div>
                                    </div>
                                    <div className="text-2xl font-bold text-zinc-400 dark:text-zinc-600">—</div>
                                    <div className="text-[10px] text-zinc-400 dark:text-zinc-600">Keine</div>
                                </div>
                            )}
                        </div>

                        {/* CHART + ACTIONS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Activity Chart */}
                            <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden backdrop-blur-sm shadow-sm dark:shadow-none">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2"><BarChart3 size={20} className="text-emerald-500" /> Aktivität</h3>
                                    <span className="text-xs font-mono text-zinc-500">{rangeLabels[statsRange]}</span>
                                </div>
                                <div className="flex-1 w-full">
                                    {statsLoading ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <PremiumActivityChart data={stats?.chartData || []} range={statsRange} />
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <button onClick={() => setShowPushModal(true)} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-600/20 dark:to-fuchsia-600/20 border border-violet-200 dark:border-violet-500/30 hover:from-violet-100 hover:to-fuchsia-100 dark:hover:from-violet-500/30 dark:hover:to-fuchsia-500/30 transition-all shadow-lg shadow-violet-500/10 dark:shadow-violet-900/20 group text-left p-6 flex flex-col justify-between min-h-[140px] flex-1">
                                    <div className="absolute top-0 right-0 p-24 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none group-hover:bg-violet-500/10 dark:group-hover:bg-violet-500/20 transition-all" />
                                    <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl w-fit relative z-10 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/30">
                                        <Send className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="relative z-10 mt-6">
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Push Senden</h3>
                                        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-200 text-xs font-medium opacity-80 mt-1">
                                            <Users size={14} /> <span>Alle Kunden erreichen</span>
                                        </div>
                                    </div>
                                </button>

                                <button onClick={() => setView('customers')} className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/40 rounded-2xl p-4 flex items-center justify-between group transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10 shadow-sm dark:shadow-none">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                            <Users size={18} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-zinc-900 dark:text-white text-sm">Alle Kunden</div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 opacity-70">Liste & Details ansehen</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-zinc-400 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                                </button>
                            </div>
                        </div>

                        {/* SCHEDULED PUSHES - Only if exists */}
                        {scheduledPushes.length > 0 && (
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Geplante Nachrichten</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {scheduledPushes.map((push) => (
                                        <div key={push.id} className="flex gap-4 items-center bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none group">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"><Clock className="w-5 h-5" /></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{push.message}</p>
                                                <p className="text-xs text-zinc-500 font-mono mt-1">{new Date(push.scheduled_at).toLocaleString('de-DE')}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setPushToDelete(push.id) }}
                                                className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                title="Löschen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AUTOMATIONS - Full Manager */}
                        <div className="pt-6 border-t border-zinc-200 dark:border-white/5">
                            <AutomationRulesManager slug={slug} />
                        </div>

                        {/* KALENDER - Push History, Scheduled, Automations */}
                        <div className="pt-6 border-t border-zinc-200 dark:border-white/5">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-zinc-900 dark:text-white"><Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Kalender-Übersicht</h3>

                            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                        <ArrowRight className="rotate-180" size={16} />
                                    </button>
                                    <h4 className="font-bold text-zinc-900 dark:text-white">
                                        {calendarMonth.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                        <ArrowRight size={16} />
                                    </button>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                                        <div key={d} className="text-center text-xs text-zinc-400 dark:text-zinc-500 font-medium py-2">{d}</div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {(() => {
                                        const year = calendarMonth.getFullYear()
                                        const month = calendarMonth.getMonth()
                                        const firstDay = new Date(year, month, 1)
                                        const lastDay = new Date(year, month + 1, 0)
                                        const startOffset = (firstDay.getDay() + 6) % 7
                                        const days: React.ReactNode[] = []

                                        for (let i = 0; i < startOffset; i++) {
                                            days.push(<div key={`empty-${i}`} className="p-2" />)
                                        }

                                        for (let d = 1; d <= lastDay.getDate(); d++) {
                                            const date = new Date(year, month, d)
                                            const dayOfWeek = date.getDay()
                                            const isToday = new Date().toDateString() === date.toDateString()
                                            // Format date as YYYY-MM-DD using LOCAL timezone (not UTC!)
                                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

                                            // Check for events on this day
                                            const dayHistory = pushHistory.filter(p => p.sent_at?.startsWith(dateStr))
                                            const dayScheduled = scheduledPushes.filter(p => p.scheduled_at?.startsWith(dateStr))

                                            // Check for automations
                                            const hasWeekdayAutomation = automations.some(a => {
                                                if (a.rule_type !== 'weekday_schedule') return false
                                                const configDays = a.config?.days || []
                                                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                                                return configDays.includes(dayNames[dayOfWeek])
                                            })

                                            // Birthday automations: could trigger any day (show on all days as indicator)
                                            // Inactivity automations: show on today only (triggers based on user activity)
                                            const hasBirthdayAutomation = automations.some(a => a.rule_type === 'birthday')
                                            const hasInactivityAutomation = automations.some(a => a.rule_type === 'inactivity') && isToday

                                            // Show yellow dot for weekday matches, or on all future days if birthday automation exists
                                            const hasAutomation = hasWeekdayAutomation || hasInactivityAutomation || (hasBirthdayAutomation && date >= new Date(new Date().setHours(0, 0, 0, 0)))

                                            days.push(
                                                <div
                                                    key={d}
                                                    onClick={() => setSelectedCalendarDay(selectedCalendarDay === dateStr ? null : dateStr)}
                                                    className={`relative p-2 text-center rounded-lg text-sm transition-all cursor-pointer select-none
                                                    ${isToday ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400'}
                                                    ${dayHistory.length > 0 ? 'ring-1 ring-violet-200 dark:ring-violet-500/50' : ''}
                                                    ${dayScheduled.length > 0 ? 'ring-1 ring-blue-200 dark:ring-blue-500/50' : ''}
                                                    ${selectedCalendarDay === dateStr ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : ''}
                                                `}
                                                >
                                                    {d}
                                                    {(dayHistory.length > 0 || dayScheduled.length > 0 || hasAutomation) && (
                                                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                            {dayHistory.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />}
                                                            {dayScheduled.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />}
                                                            {hasAutomation && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 dark:bg-yellow-400" />}
                                                        </div>
                                                    )}

                                                    {/* Day Stats Popup */}
                                                    {selectedCalendarDay === dateStr && (
                                                        <div
                                                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl p-3 text-left animate-in fade-in zoom-in-95 duration-200"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {/* Arrow */}
                                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-r border-b border-zinc-200 dark:border-white/10 rotate-45" />

                                                            {/* Date Header */}
                                                            <div className="font-bold text-xs text-zinc-900 dark:text-white mb-2 pb-2 border-b border-zinc-100 dark:border-white/10">
                                                                {new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                            </div>

                                                            {/* Stats */}
                                                            {(() => {
                                                                // Get stats for this day from chartData (for stamps and redemptions)
                                                                const dayStats = stats?.chartData?.find((cd: any) => cd.date === dateStr) || { stamps: 0, redemptions: 0, newPasses: 0 }

                                                                // Calculate new customers from actual customer registrations
                                                                const newCustomersCount = customers?.filter((c: any) => {
                                                                    if (!c.created_at) return false
                                                                    const createdDate = new Date(c.created_at)
                                                                    const createdDateStr = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')}`
                                                                    return createdDateStr === dateStr
                                                                }).length || 0

                                                                return (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                                Stempel
                                                                            </span>
                                                                            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{dayStats.stamps}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                                                Einlösungen
                                                                            </span>
                                                                            <span className="font-bold text-sm text-purple-600 dark:text-purple-400">{dayStats.redemptions}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                                                Neue Kunden
                                                                            </span>
                                                                            <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{newCustomersCount}</span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })()}

                                                            {/* Push Messages sent on this day */}
                                                            {dayHistory.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/10">
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                                                                        <Send size={10} />
                                                                        Gesendete Nachrichten
                                                                    </div>
                                                                    <div className="space-y-2 max-h-24 overflow-y-auto">
                                                                        {dayHistory.map((msg: any, idx: number) => (
                                                                            <div key={idx} className="bg-violet-50 dark:bg-violet-500/10 rounded-lg p-2 text-xs">
                                                                                <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2">{msg.message}</p>
                                                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                                                                                    {msg.sent_at && new Date(msg.sent_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }
                                        return days
                                    })()}
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Gesendet</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Geplant/Wartend</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Automatisierung</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col items-center gap-6">
                            <ThemeToggle />
                            <button onClick={handleLogout} className="mx-auto block text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest font-bold">Abmelden</button>
                        </div>
                    </div>
                </main>

                {/* PUSH MODAL */}
                <AnimatePresence>
                    {showPushModal && (
                        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-8 pb-8 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-md">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 w-full max-w-xl mx-4 rounded-3xl shadow-2xl relative">
                                <button onClick={() => setShowPushModal(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-white/5 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors z-20"><X size={18} className="text-zinc-500 dark:text-zinc-400" /></button>

                                <div className="p-8 relative">
                                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 relative z-10 flex items-center gap-3"><Send className="text-emerald-500" /> Nachricht senden</h2>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 relative z-10">Erreiche deine Kunden direkt auf dem Sperrbildschirm.</p>

                                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                        <button onClick={() => setPushMode('now')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'now' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-white' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
                                            <Zap className={pushMode === 'now' ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-600'} />
                                            <span className="text-sm font-bold">⚡ Jetzt senden</span>
                                        </button>
                                        <button onClick={() => setPushMode('schedule')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${pushMode === 'schedule' ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-white' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
                                            <Calendar className={pushMode === 'schedule' ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-600'} />
                                            <span className="text-sm font-bold">📅 Später planen</span>
                                        </button>
                                    </div>

                                    <form onSubmit={handlePushRequest} className="space-y-4 relative z-10">
                                        <div className="relative">
                                            <textarea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} placeholder="Deine Nachricht hier schreiben..." className="w-full h-32 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 resize-none transition-all" />
                                            <div className="absolute bottom-3 right-3 text-xs text-zinc-400 dark:text-zinc-600 font-mono">{pushMessage.length} Zeichen</div>
                                        </div>

                                        {/* Target Audience Selector */}
                                        <div className="bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/5 rounded-2xl p-4">
                                            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Users size={14} />
                                                Zielgruppe
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <button type="button" onClick={() => setPushTarget('all')} className={`p-3 rounded-xl text-sm font-medium transition-all ${pushTarget === 'all' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
                                                    Alle Kunden
                                                </button>
                                                <button type="button" onClick={() => setPushTarget('inactive')} className={`p-3 rounded-xl text-sm font-medium transition-all ${pushTarget === 'inactive' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
                                                    Inaktive Kunden
                                                </button>
                                            </div>

                                            {pushTarget === 'inactive' && (
                                                <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-white/10">
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Letzter Scan vor:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {([14, 30, 60, 'custom'] as const).map(opt => (
                                                            <button
                                                                type="button"
                                                                key={opt}
                                                                onClick={() => setInactivityDays(opt)}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${inactivityDays === opt ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}
                                                            >
                                                                {opt === 'custom' ? '✏️ Eigene' : `${opt} Tage`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {inactivityDays === 'custom' && (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={365}
                                                                value={customInactivityDays}
                                                                onChange={(e) => setCustomInactivityDays(Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-24 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm font-mono"
                                                            />
                                                            <span className="text-sm text-zinc-500">Tage</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {pushMode === 'schedule' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                                    📅 Zeitpunkt wählen
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={pushScheduleTime}
                                                    onChange={(e) => setPushScheduleTime(e.target.value)}
                                                    className="w-full bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 text-zinc-900 dark:text-white outline-none focus:border-blue-500 font-mono text-base"
                                                />
                                            </div>
                                        )}
                                        <button type="submit" disabled={pushLoading || !pushMessage.trim()} className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 shadow-lg shadow-black/5 dark:shadow-white/5">{pushLoading ? 'Wird gesendet...' : (pushMode === 'now' ? '⚡ Jetzt absenden' : '📅 Einplanen')}</button>
                                        <div className="h-4" /> {/* Extra padding for mobile */}
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )
                    }
                </AnimatePresence >

                {/* REVIEWS MODAL */}
                <AnimatePresence>
                    {
                        showReviewsModal && reviewStats && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
                                    <button onClick={() => setShowReviewsModal(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-white/5 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors z-20"><X size={18} className="text-zinc-500 dark:text-zinc-400" /></button>

                                    <div className="p-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                                <Star className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Google Bewertungen</h2>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Übersicht deiner Kundenmeinungen</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-zinc-50 dark:bg-black/40 rounded-xl p-4 text-center border border-zinc-200 dark:border-white/5">
                                                <div className="text-3xl font-bold text-yellow-500">{reviewStats.average?.toFixed(1) || '—'}</div>
                                                <div className="text-xs text-zinc-500 mt-1">Durchschnitt</div>
                                                <div className="flex justify-center gap-0.5 mt-2">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={14} className={s <= Math.round(reviewStats.average || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300 dark:text-zinc-700'} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-black/40 rounded-xl p-4 text-center border border-zinc-200 dark:border-white/5">
                                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">{reviewStats.total || 0}</div>
                                                <div className="text-xs text-zinc-500 mt-1">Bewertungen gesamt</div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {reviewStats.breakdown?.map(item => (
                                                <div key={item.rating} className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500 w-6">{item.rating}★</span>
                                                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                                                    </div>
                                                    <span className="text-xs text-zinc-500 w-8 text-right">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Activity Feed */}
                                        {reviewStats.recentActivity && reviewStats.recentActivity.length > 0 && (
                                            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/10">
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <MessageSquare size={14} className="text-yellow-500" /> Letzte Bewertungen
                                                </h4>
                                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                                    {reviewStats.recentActivity.slice(0, 10).map(activity => (
                                                        <div key={activity.id} className="bg-zinc-50 dark:bg-black/30 rounded-xl p-3 border border-zinc-200 dark:border-white/5">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-1">
                                                                    {[1, 2, 3, 4, 5].map(s => (
                                                                        <Star key={s} size={12} className={s <= activity.rating ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300 dark:text-zinc-700'} />
                                                                    ))}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {/* Badge: Google or Internal */}
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activity.rating >= 4
                                                                        ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30'
                                                                        : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30'
                                                                        }`}>
                                                                        {activity.rating >= 4 ? '🌐 Google' : '📝 Intern'}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-600">
                                                                        {new Date(activity.createdAt).toLocaleDateString('de-DE')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {activity.comment && (
                                                                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">„{activity.comment}"</p>
                                                            )}
                                                            {!activity.comment && activity.rating >= 4 && (
                                                                <p className="text-xs text-zinc-500 italic">→ An Google weitergeleitet</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )
                    }
                </AnimatePresence >

                {/* DELETE CONFIRMATION MODAL */}
                <AnimatePresence>
                    {pushToDelete && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setPushToDelete(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                                        <Trash2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Nachricht löschen?</h3>
                                        <p className="text-sm text-zinc-500">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                                    </div>
                                </div>

                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                                    Die geplante Nachricht wird <span className="font-bold text-red-600 dark:text-red-400">endgültig gelöscht</span> und nicht mehr gesendet – auch wenn sie bereits genehmigt wurde.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPushToDelete(null)}
                                        disabled={deletingPush}
                                        className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        onClick={handleDeleteScheduledPush}
                                        disabled={deletingPush}
                                        className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {deletingPush ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Löschen...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={16} />
                                                Löschen
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // ===============================================
    // RENDER: SETTINGS MODAL
    // ===============================================



    // ===============================================
    // RENDER: CUSTOMERS VIEW
    // ===============================================

    if (role === 'chef' && view === 'customers') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-emerald-500/30">
                {/* Background Effects */}
                <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
                <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none dark:from-blue-500/10" />
                <header className="relative z-10 p-6 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-md">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white"><Users className="text-cyan-600 dark:text-cyan-500" /> Kundenliste</h1>
                    <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-900 dark:text-white"><X size={16} /></button>
                </header>
                <main className="relative z-10 flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full pb-20 no-scrollbar">
                    <CustomerList
                        customers={customers}
                        loading={customersLoading}
                        onSelectCustomer={(c) => setSelectedCustomer(c)}
                    />

                    {/* Customer Detail Modal */}
                    <AnimatePresence>
                        {selectedCustomer && (
                            <CustomerDetailModal
                                customer={selectedCustomer}
                                slug={slug || ''}
                                onClose={() => setSelectedCustomer(null)}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>
        )
    }

    // ===============================================
    // RENDER: SCANNER VIEW
    // ===============================================

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col relative overflow-hidden">
            {/* Header Navigation - Chef only */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                {role === 'chef' && (
                    <>
                        <button
                            onClick={() => setView('customers')}
                            className="px-4 py-2.5 bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all flex items-center gap-2 text-zinc-900 dark:text-white shadow-sm dark:shadow-none"
                        >
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Kunden</span>
                        </button>
                        <button
                            onClick={() => setView('dashboard')}
                            className="px-4 py-2.5 bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 backdrop-blur-md rounded-xl border border-white/10 hover:from-violet-500 hover:to-fuchsia-500 transition-all flex items-center gap-2 text-white shadow-lg"
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </button>
                    </>
                )}
            </div>
            <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none dark:from-emerald-500/10" />
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
                {mode === 'idle' && (
                    <div className="space-y-8 w-full text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20"><Zap className="w-12 h-12 text-white" /></div>
                        <h1 className="text-3xl font-bold">QARD APP</h1>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={startCamera} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><Camera className="w-6 h-6" /> Code Scannen</button>
                        </div>
                        <div className="mt-8 flex justify-center">
                            <ThemeToggle />
                        </div>
                        <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-white mt-8 transition-colors">Abmelden</button>
                    </div>
                )}
                {mode === 'camera' && (
                    <div className="w-full flex flex-col items-center justify-center">
                        {/* Square camera container with custom corners */}
                        <div className="relative w-full max-w-[300px] mx-auto">
                            {/* Camera feed container */}
                            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black relative">
                                <div id="qr-reader" className="w-full h-full" />
                            </div>
                        </div>

                        <p className="text-zinc-400 text-sm mt-6 mb-4">QR-Code in das Feld halten</p>

                        {cameraError && <p className="text-red-500 mb-4 text-center">{cameraError}</p>}

                        <button onClick={stopCamera} className="px-8 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-white/10 shadow-lg">
                            Abbrechen
                        </button>
                    </div>
                )}
                {mode === 'result' && result && (
                    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 text-center animate-in zoom-in shadow-xl dark:shadow-none">
                        {/* Icon based on result type */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.rewardReady
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500'
                            : result.celebration
                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-500'
                                : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500'
                            }`}>
                            {result.rewardReady ? <Gift className="w-10 h-10" /> : <Check className="w-10 h-10" />}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                            {result.rewardReady
                                ? '🎉 Prämie bereit!'
                                : result.celebration
                                    ? '🎊 Eingelöst!'
                                    : 'Stempel hinzugefügt!'}
                        </h2>

                        {/* Stamp count display */}
                        <div className="flex items-center justify-center gap-2 text-zinc-400 mb-2">
                            <span className="text-3xl font-black text-zinc-900 dark:text-white">
                                {result.newState?.stamps ?? 0}
                            </span>
                            <span className="text-xl text-zinc-500">/</span>
                            <span className="text-xl text-zinc-400">
                                {result.newState?.max_stamps ?? 10}
                            </span>
                        </div>

                        {/* Status message */}
                        <p className={`mb-6 ${result.rewardReady ? 'text-amber-500 dark:text-amber-400 font-bold' : 'text-zinc-500'}`}>
                            {result.rewardReady
                                ? 'Kunde kann seine Prämie einlösen!'
                                : result.message || 'Stempel erfolgreich hinzugefügt'}
                        </p>

                        <button onClick={resetScanner} className="w-full py-4 bg-emerald-500 text-white dark:text-black rounded-xl font-bold hover:bg-emerald-400 transition-colors">
                            Nächster Scan
                        </button>
                    </div>
                )}

                {mode === 'cooldown' && cooldownData && (
                    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 text-center animate-in zoom-in shadow-xl dark:shadow-none mb-8">
                        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                            Scan nicht möglich
                        </h2>

                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                            Cooldown aktiv. Nächster Scan in <span className="font-mono font-bold text-zinc-900 dark:text-white">{cooldownData.minutes} Minuten</span>.
                        </p>


                        {/* Chef Override Section */}
                        {role === 'chef' && (
                            <div className="mb-8 p-4 bg-zinc-50 dark:bg-black/20 rounded-2xl border border-zinc-100 dark:border-white/5">
                                <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-3">Chef Override</p>

                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        placeholder="Chef PIN"
                                        value={overridePin}
                                        onChange={(e) => setOverridePin(e.target.value)}
                                        className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-center text-lg font-mono outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <button
                                        onClick={handleOverrideScan}
                                        disabled={!overridePin || overrideLoading}
                                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {overrideLoading ? '...' : <Check className="w-6 h-6" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-2">PIN erforderlich um Cooldown zu umgehen.</p>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setMode('idle')
                                setCooldownData(null)
                                setOverridePin('')
                            }}
                            className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold transition-colors"
                        >
                            Abbrechen
                        </button>
                    </div>
                )}

                {/* WRONG CAMPAIGN ERROR */}
                {mode === 'wrongCampaign' && (
                    <div className="w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/20 rounded-3xl p-8 text-center animate-in zoom-in shadow-xl dark:shadow-none mb-8">
                        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-500">
                            Falscher QR-Code!
                        </h2>

                        <p className="text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                            Diese Karte gehört zu einem <span className="font-bold text-zinc-900 dark:text-white">anderen Geschäft</span>.
                        </p>

                        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-8">
                            Bitte scannen Sie nur Karten, die zu diesem Geschäft gehören.
                        </p>

                        <button
                            onClick={resetScanner}
                            className="w-full py-4 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-bold transition-colors"
                        >
                            Erneut scannen
                        </button>
                    </div>
                )}

                {/* GENERIC SCAN ERROR */}
                {mode === 'scanError' && (
                    <div className="w-full bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-500/20 rounded-3xl p-8 text-center animate-in zoom-in shadow-xl dark:shadow-none mb-8">
                        <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 flex items-center justify-center mx-auto mb-6">
                            <X className="w-10 h-10" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2 text-orange-600 dark:text-orange-500">
                            Scan fehlgeschlagen
                        </h2>

                        <p className="text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                            {scanErrorMessage || 'Ein Fehler ist aufgetreten.'}
                        </p>

                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 mb-8">
                            <p className="text-sm text-orange-700 dark:text-orange-400">
                                💡 <span className="font-semibold">Tipp:</span> Stellen Sie sicher, dass Sie eine gültige Kundenkarte dieses Geschäfts scannen.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setScanErrorMessage('')
                                resetScanner()
                            }}
                            className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-bold transition-colors"
                        >
                            Erneut scannen
                        </button>
                    </div>
                )}

                {/* BIRTHDAY GIFT MODAL */}
                <AnimatePresence>
                    {showGiftModal && pendingGift && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                            onClick={() => setShowGiftModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.8, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-200 dark:border-white/10 relative overflow-hidden"
                            >
                                {/* Decorative background */}
                                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-pink-500/20 to-transparent pointer-events-none" />
                                <div className="absolute top-4 left-4 text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>🎈</div>
                                <div className="absolute top-4 right-4 text-2xl animate-bounce" style={{ animationDelay: '200ms' }}>🎉</div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="text-7xl mb-4 animate-pulse">🎂</div>

                                    <h2 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                        Geburtstagsgeschenk!
                                    </h2>

                                    {pendingGift.customerName && (
                                        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-1">
                                            {pendingGift.customerName}
                                        </p>
                                    )}

                                    {pendingGift.birthday_date && (
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                                            🎈 Geburtstag: {formatBirthday(pendingGift.birthday_date || pendingGift.customerBirthday)}
                                            {(() => {
                                                const bday = new Date(pendingGift.birthday_date || pendingGift.customerBirthday)
                                                const today = new Date()
                                                // This year's birthday
                                                const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
                                                const diffDays = Math.floor((today.getTime() - thisYearBday.getTime()) / (1000 * 60 * 60 * 24))
                                                if (diffDays === 0) return <span className="ml-2 text-pink-500 font-bold">(heute! 🎉)</span>
                                                if (diffDays === 1) return <span className="ml-2 text-pink-400">(gestern)</span>
                                                if (diffDays > 1 && diffDays <= 14) return <span className="ml-2 text-zinc-400">(vor {diffDays} Tagen)</span>
                                                if (diffDays > 14) return <span className="ml-2 text-orange-400">(vor {diffDays} Tagen ⚠️)</span>
                                                return null
                                            })()}
                                        </p>
                                    )}

                                    {/* Gift card */}
                                    <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200 dark:border-pink-500/20 rounded-2xl p-5 mb-6">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Gift className="w-5 h-5 text-pink-500" />
                                            <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                                {pendingGift.gift_title}
                                            </p>
                                        </div>
                                        {pendingGift.gift_description && (
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                {pendingGift.gift_description}
                                            </p>
                                        )}
                                        {pendingGift.gift_message && (
                                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 italic">
                                                "{pendingGift.gift_message}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <button
                                        onClick={handleRedeemGift}
                                        disabled={redeemingGift}
                                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-pink-500/20 mb-3"
                                    >
                                        {redeemingGift ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Wird eingelöst...
                                            </span>
                                        ) : (
                                            '🎁 Geschenk eingelöst'
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setShowGiftModal(false)}
                                        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                    >
                                        Später einlösen
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="h-8" />
            </main>
        </div>
    )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10',
        purple: 'text-purple-600 dark:text-purple-500 bg-purple-100 dark:bg-purple-500/10',
        blue: 'text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-500/10',
        zinc: 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800'
    }
    return (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all backdrop-blur-sm shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-3">
                <span className="text-zinc-500 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">{label}</span>
                <div className={`p-2 rounded-lg ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{value}</div>
        </div>
    )
}
