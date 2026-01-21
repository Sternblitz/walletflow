'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    QrCode,
    Copy,
    ExternalLink,
    Loader2,
    RefreshCw,
    Link2,
    ArrowRight,
    Check
} from 'lucide-react'
import { getDynamicQRURL, getStartURL } from '@/lib/domain-urls'
import { toast } from 'sonner'

interface DynamicRoute {
    id: string
    code: string
    target_slug: string
    is_active: boolean
    created_at: string
    updated_at: string
}

interface DynamicRouteManagerProps {
    clientId: string
    clientSlug: string
}

export function DynamicRouteManager({ clientId, clientSlug }: DynamicRouteManagerProps) {
    const [route, setRoute] = useState<DynamicRoute | null>(null)
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [newTargetSlug, setNewTargetSlug] = useState('')
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState<'dynamic' | 'direct' | null>(null)

    useEffect(() => {
        fetchRoute()
    }, [clientId])

    const fetchRoute = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/dynamic-routes?clientId=${clientId}`)
            const data = await res.json()
            setRoute(data.route)
        } catch (e) {
            console.error('Failed to fetch route:', e)
        } finally {
            setLoading(false)
        }
    }

    const createRoute = async () => {
        setCreating(true)
        try {
            const res = await fetch('/api/dynamic-routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, targetSlug: clientSlug })
            })
            const data = await res.json()
            if (data.route) {
                setRoute(data.route)
                toast.success('Dynamischer QR-Code erstellt!')
            }
        } catch (e) {
            console.error('Failed to create route:', e)
            toast.error('Fehler beim Erstellen')
        } finally {
            setCreating(false)
        }
    }

    const updateRoute = async () => {
        if (!newTargetSlug.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/dynamic-routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, targetSlug: newTargetSlug.trim() })
            })
            const data = await res.json()
            if (data.route) {
                setRoute(data.route)
                setShowEditModal(false)
                toast.success('Redirect-Ziel aktualisiert!')
            }
        } catch (e) {
            console.error('Failed to update route:', e)
            toast.error('Fehler beim Speichern')
        } finally {
            setSaving(false)
        }
    }

    const copyToClipboard = async (text: string, type: 'dynamic' | 'direct') => {
        await navigator.clipboard.writeText(text)
        setCopied(type)
        toast.success('Link kopiert!')
        setTimeout(() => setCopied(null), 2000)
    }

    const dynamicUrl = route ? getDynamicQRURL(route.code) : null
    const directUrl = getStartURL(clientSlug)

    if (loading) {
        return (
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white">Dein QR-Code</h2>
                        <p className="text-xs text-zinc-400">
                            {route ? 'Dynamischer QR-Code - permanent & anpassbar' : 'Kampagnen-Link & QR-Code'}
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-black/50 border border-white/5 space-y-4">
                    {route ? (
                        <>
                            {/* Dynamic QR Code Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 uppercase tracking-wider">
                                    <Link2 className="w-3 h-3" />
                                    Dynamischer QR-Code (empfohlen für Print)
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-zinc-900 rounded-md border border-emerald-500/30 px-3 py-2 text-sm text-emerald-300 font-mono truncate">
                                        {dynamicUrl}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="shrink-0 border-emerald-500/30 hover:bg-emerald-500/10"
                                        onClick={() => copyToClipboard(dynamicUrl!, 'dynamic')}
                                    >
                                        {copied === 'dynamic' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                    <a href={dynamicUrl!} target="_blank" rel="noopener noreferrer">
                                        <Button size="icon" variant="outline" className="shrink-0">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </a>
                                </div>

                                <div className="flex justify-center pt-2">
                                    <div className="p-3 bg-white rounded-xl shadow-lg">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicUrl!)}`}
                                            alt="QR Code"
                                            className="w-36 h-36"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-center text-zinc-500">
                                    Dieser QR-Code bleibt permanent gültig, auch wenn du das Ziel änderst.
                                </p>
                            </div>

                            {/* Current Redirect Target */}
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">Leitet aktuell weiter zu:</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                                        onClick={() => {
                                            setNewTargetSlug(route.target_slug)
                                            setShowEditModal(true)
                                        }}
                                    >
                                        <RefreshCw className="w-3 h-3 mr-2" />
                                        Ändern
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-zinc-900 rounded-lg border border-white/5">
                                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                                    <span className="text-sm text-white font-mono">/start/{route.target_slug}</span>
                                </div>
                            </div>

                            {/* Direct Link (fallback) */}
                            <div className="pt-4 border-t border-white/5 space-y-2">
                                <div className="text-xs text-zinc-500">Direkter Kampagnen-Link (ohne Redirect):</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-zinc-900 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-400 font-mono truncate">
                                        {directUrl}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="shrink-0"
                                        onClick={() => copyToClipboard(directUrl, 'direct')}
                                    >
                                        {copied === 'direct' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* No dynamic route yet - show direct link and create button */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-zinc-900 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 font-mono truncate">
                                    {directUrl}
                                </div>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={() => copyToClipboard(directUrl, 'direct')}
                                >
                                    {copied === 'direct' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <a href={directUrl} target="_blank" rel="noopener noreferrer">
                                    <Button size="icon" variant="outline" className="shrink-0">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </a>
                            </div>

                            <div className="flex justify-center pt-2">
                                <div className="p-2 bg-white rounded-xl">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(directUrl)}`}
                                        alt="QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <Button
                                    onClick={createRoute}
                                    disabled={creating}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500"
                                >
                                    {creating ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Link2 className="w-4 h-4 mr-2" />
                                    )}
                                    Dynamischen QR-Code erstellen
                                </Button>
                                <p className="text-xs text-zinc-500 text-center mt-2">
                                    Erstellt einen permanenten QR-Code, dessen Ziel du später ändern kannst.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="bg-zinc-950 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Redirect-Ziel ändern</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Gib den neuen Kampagnen-Slug ein, zu dem der QR-Code weiterleiten soll.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400">Neuer Ziel-Slug</label>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500 text-sm">/start/</span>
                                <Input
                                    value={newTargetSlug}
                                    onChange={(e) => setNewTargetSlug(e.target.value)}
                                    placeholder="neue-kampagne-slug"
                                    className="flex-1 bg-zinc-900 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-xs text-blue-300">
                                ℹ️ Der QR-Code selbst ändert sich nicht - nur das Ziel der Weiterleitung.
                                Bestehende gedruckte QR-Codes bleiben gültig.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowEditModal(false)}
                            className="text-zinc-400"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            onClick={updateRoute}
                            disabled={saving || !newTargetSlug.trim()}
                            className="bg-violet-600 hover:bg-violet-500"
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Speichern
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
