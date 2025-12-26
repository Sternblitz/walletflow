'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Check } from 'lucide-react'

interface FadeEditorModalProps {
    isOpen: boolean
    onClose: () => void
    imageUrl: string
    backgroundColor: string
    onSave: (newUrl: string) => void
}

export function FadeEditorModal({ isOpen, onClose, imageUrl, backgroundColor, onSave }: FadeEditorModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Settings
    const [height, setHeight] = useState(35) // Percentage 0-100
    const [opacityStart, setOpacityStart] = useState(100) // Percentage 0-100
    const [opacityEnd, setOpacityEnd] = useState(0) // Percentage 0-100
    const [direction, setDirection] = useState<'top-down' | 'bottom-up'>('top-down')
    const [easing, setEasing] = useState<'linear' | 'ease-in' | 'ease-out'>('linear')

    // Easing Functions
    const getEase = (t: number, type: 'linear' | 'ease-in' | 'ease-out') => {
        if (type === 'ease-in') return t * t // Quadratic Ease In
        if (type === 'ease-out') return t * (2 - t) // Quadratic Ease Out
        return t // Linear
    }

    // Preview Logic
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = imageUrl

        img.onload = () => {
            // Set canvas to image dimensions
            canvas.width = img.width
            canvas.height = img.height

            // 1. Draw Original Image
            ctx.drawImage(img, 0, 0)

            // 2. Calculate Fade Gradient
            // Parse Hex to RGB
            let hex = backgroundColor.replace('#', '')
            if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]

            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)

            const fadeHeightPx = img.height * (height / 100)

            let grad: CanvasGradient
            let rectY = 0

            if (direction === 'top-down') {
                grad = ctx.createLinearGradient(0, 0, 0, fadeHeightPx)
                rectY = 0
            } else {
                grad = ctx.createLinearGradient(0, img.height, 0, img.height - fadeHeightPx)
                rectY = img.height - fadeHeightPx
            }

            // Add Color Stops with Easing (approx 20 stops for smoothness)
            const steps = 20
            for (let i = 0; i <= steps; i++) {
                const t = i / steps // 0 to 1
                const easedT = getEase(t, easing) // Adjusted progress based on curve

                // Interpolate Alpha where:
                // 0 (start) -> opacityStart
                // 1 (end)   -> opacityEnd

                // direction 'top-down': t=0 is top (start), t=1 is bottom (end of fade area)
                // For bottom-up: t=0 is bottom edge (start), t=1 is top edge of fade area (end)
                // The linear gradient coordinate system handles the spatial direction.
                // We just need to map 't' (distance from start point) to alpha.

                const alpha = (opacityStart / 100) + easedT * ((opacityEnd / 100) - (opacityStart / 100))

                grad.addColorStop(t, `rgba(${r},${g},${b}, ${alpha})`)
            }

            ctx.fillStyle = grad
            ctx.fillRect(0, rectY, img.width, fadeHeightPx)
        }

    }, [isOpen, imageUrl, backgroundColor, height, opacityStart, opacityEnd, direction, easing])

    const handleSave = () => {
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL('image/png'))
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#1a1a1a]">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        Fade Editor Pro
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Controls */}
                    <div className="w-80 bg-[#151515] border-r border-[#333] p-6 flex flex-col gap-6 overflow-y-auto">

                        {/* Height Control */}
                        <div className="control-group">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                                Höhe ({height}%)
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={height}
                                onChange={e => setHeight(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        {/* Opacity Controls */}
                        <div className="control-group">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                                Start Deckkraft ({opacityStart}%)
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={opacityStart}
                                onChange={e => setOpacityStart(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="control-group">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                                End Deckkraft ({opacityEnd}%)
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={opacityEnd}
                                onChange={e => setOpacityEnd(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        {/* Direction */}
                        <div className="control-group">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                                Richtung
                            </label>
                            <div className="flex gap-2 p-1 bg-black/40 rounded-lg">
                                <button
                                    className={`flex-1 text-xs py-2 rounded ${direction === 'top-down' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setDirection('top-down')}
                                >
                                    Oben → Unten
                                </button>
                                <button
                                    className={`flex-1 text-xs py-2 rounded ${direction === 'bottom-up' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setDirection('bottom-up')}
                                >
                                    Unten → Oben
                                </button>
                            </div>
                        </div>

                        {/* Easing Curve Selector */}
                        <div className="control-group">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block flex justify-between">
                                Verlauf (Kurve)
                                {/* Visual Curve Preview */}
                                <svg width="20" height="20" viewBox="0 0 20 20" className="opacity-50">
                                    <path
                                        d={
                                            easing === 'linear' ? "M0,20 L20,0" :
                                                easing === 'ease-in' ? "M0,20 Q10,20 20,0" :
                                                    "M0,20 Q0,0 20,0"
                                        }
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </label>
                            <div className="flex gap-1 p-1 bg-black/40 rounded-lg">
                                {[
                                    { id: 'linear', label: 'Linear' },
                                    { id: 'ease-in', label: 'Soft' }, // Ease In feels softer at start
                                    { id: 'ease-out', label: 'Hard' } // Ease Out feels harder/punchier
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        className={`flex-1 text-[10px] py-2 rounded ${easing === opt.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setEasing(opt.id as any)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Preview */}
                        <div className="control-group">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                                Fade Farbe
                            </label>
                            <div className="flex items-center gap-2 p-2 bg-black/40 rounded-lg border border-white/10">
                                <div
                                    className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                                    style={{ backgroundColor }}
                                />
                                <span className="text-sm text-gray-300 font-mono">{backgroundColor}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Farbe basiert auf der Karten-Hintergrundfarbe</p>
                        </div>

                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-[#050505] p-8 flex items-center justify-center relative overflow-hidden">
                        {/* Checkerboard Background for Transparency */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                            }}
                        />

                        <div className="relative shadow-2xl border border-white/10 rounded-lg overflow-hidden max-w-full max-h-full">
                            <canvas
                                ref={canvasRef}
                                className="max-w-full max-h-[70vh] object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#333] bg-[#1a1a1a] flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                    >
                        <Check size={16} />
                        Speichern
                    </button>
                </div>

            </div>
        </div>
    )
}
