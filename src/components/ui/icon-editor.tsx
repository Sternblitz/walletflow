'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, Sparkles, Palette, Check, Loader2, ZoomIn, ZoomOut, Move } from 'lucide-react'
import { Button } from './button'

interface IconEditorProps {
    isOpen: boolean
    onClose: () => void
    onSave: (iconUrl: string) => void
    backgroundColor?: string
    businessType?: string
}

// Template icons as SVG paths (simple, scalable)
const TEMPLATE_ICONS = {
    food: [
        { name: 'Burger', path: 'M4 12h16M4 12c0-4 4-8 8-8s8 4 8 8M4 12c0 2 2 4 8 4s8-2 8-4M6 16h12c1 0 2 1 2 2H4c0-1 1-2 2-2' },
        { name: 'Pizza', path: 'M12 2L2 22h20L12 2zM12 8a1 1 0 100 2 1 1 0 000-2zM8 14a1 1 0 100 2 1 1 0 000-2zM14 12a1 1 0 100 2 1 1 0 000-2z' },
        { name: 'Döner', path: 'M12 2c-2 0-4 2-4 6v8c0 2 2 4 4 4s4-2 4-4V8c0-4-2-6-4-6zM8 10h8M8 14h8' },
        { name: 'Bowl', path: 'M3 12h18M5 12c0 4 3 7 7 7s7-3 7-7M8 8c0-2 2-4 4-4s4 2 4 4' },
        { name: 'Fries', path: 'M6 22V10M10 22V8M14 22V10M18 22V8M4 10h16l-2-6H6l-2 6z' },
    ],
    drinks: [
        { name: 'Coffee', path: 'M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3' },
        { name: 'Cocktail', path: 'M8 22h8M12 17v5M5 2l7 9 7-9M12 11v6' },
        { name: 'Beer', path: 'M17 11h1a3 3 0 010 6h-1M5 6h12v11a3 3 0 01-3 3H8a3 3 0 01-3-3V6zM5 10h12' },
        { name: 'Boba', path: 'M8 2h8l-1 18H9L8 2zM6 6h12M10 12a1 1 0 100 2M14 14a1 1 0 100 2M12 16a1 1 0 100 2' },
        { name: 'Smoothie', path: 'M9 2h6l-1.5 18h-3L9 2zM7 6h10M12 2v-1' },
    ],
    services: [
        { name: 'Scissors', path: 'M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12' },
        { name: 'Nail', path: 'M12 2v6M9 8h6l1 12H8l1-12zM7 20h10' },
        { name: 'Spa', path: 'M12 22c-4 0-8-4-8-10 4 0 8 4 8 10zM12 22c4 0 8-4 8-10-4 0-8 4-8 10zM12 2v10' },
        { name: 'Gym', path: 'M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5M12 2v4M12 18v4M2 12h4M18 12h4' },
        { name: 'Heart', path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' },
    ],
    retail: [
        { name: 'Bag', path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
        { name: 'Tag', path: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01' },
        { name: 'Star', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
        { name: 'Gift', path: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z' },
        { name: 'Crown', path: 'M2 17l3-11 5 6 2-9 2 9 5-6 3 11H2zM2 21h20' },
    ],
}

// Color presets
const COLOR_PRESETS = [
    '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308',
    '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
]

export function IconEditor({ isOpen, onClose, onSave, backgroundColor = '#000000', businessType = '' }: IconEditorProps) {
    const [activeTab, setActiveTab] = useState<'logo' | 'ai' | 'templates'>('templates')

    // Logo editor state
    const [logoImage, setLogoImage] = useState<string | null>(null)
    const [logoZoom, setLogoZoom] = useState(1)
    const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
    const [logoBgColor, setLogoBgColor] = useState(backgroundColor)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // AI state
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiGenerating, setAiGenerating] = useState(false)
    const [aiResult, setAiResult] = useState<string | null>(null)

    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState<{ category: string; index: number } | null>(null)
    const [templateColor, setTemplateColor] = useState('#FFFFFF')
    const [templateBgColor, setTemplateBgColor] = useState(backgroundColor)

    // Business type suggestions for AI
    const businessTypes = [
        { value: 'doener', label: '🥙 Döner/Kebab' },
        { value: 'cafe', label: '☕ Café' },
        { value: 'restaurant', label: '🍽️ Restaurant' },
        { value: 'pizza', label: '🍕 Pizzeria' },
        { value: 'burger', label: '🍔 Burger' },
        { value: 'bar', label: '🍺 Bar' },
        { value: 'friseur', label: '✂️ Friseur' },
        { value: 'spa', label: '🧖 Spa/Wellness' },
        { value: 'fitness', label: '🏋️ Fitness' },
        { value: 'shop', label: '🛍️ Shop' },
    ]

    // Handle logo upload
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => {
                setLogoImage(ev.target?.result as string)
                setLogoZoom(1)
                setLogoPosition({ x: 0, y: 0 })
            }
            reader.readAsDataURL(file)
        }
    }

    // Generate logo icon
    const generateLogoIcon = useCallback(() => {
        if (!canvasRef.current || !logoImage) return null

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        const size = 174 // 2x for retina (87 * 2)
        canvas.width = size
        canvas.height = size

        // Background
        ctx.fillStyle = logoBgColor
        ctx.fillRect(0, 0, size, size)

        // Draw logo
        const img = new Image()
        img.src = logoImage

        return new Promise<string>((resolve) => {
            img.onload = () => {
                const scale = logoZoom
                const w = img.width * scale
                const h = img.height * scale
                const x = (size - w) / 2 + logoPosition.x
                const y = (size - h) / 2 + logoPosition.y

                ctx.drawImage(img, x, y, w, h)
                resolve(canvas.toDataURL('image/png'))
            }
        })
    }, [logoImage, logoZoom, logoPosition, logoBgColor])

    // Generate template icon
    const generateTemplateIcon = useCallback(() => {
        if (!selectedTemplate) return null

        const canvas = document.createElement('canvas')
        const size = 174
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        // Background
        ctx.fillStyle = templateBgColor
        ctx.fillRect(0, 0, size, size)

        // Draw icon
        const category = Object.keys(TEMPLATE_ICONS)[Object.keys(TEMPLATE_ICONS).indexOf(selectedTemplate.category)]
        const icon = (TEMPLATE_ICONS as any)[category]?.[selectedTemplate.index]

        if (icon) {
            ctx.strokeStyle = templateColor
            ctx.lineWidth = 8
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            // Scale and center the path
            ctx.translate(size / 2 - 48, size / 2 - 48)
            ctx.scale(4, 4)

            const path = new Path2D(icon.path)
            ctx.stroke(path)
        }

        return canvas.toDataURL('image/png')
    }, [selectedTemplate, templateColor, templateBgColor])

    // AI generation
    const generateAiIcon = async () => {
        setAiGenerating(true)
        try {
            const response = await fetch('/api/design/generate-notification-icon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessType: aiPrompt || businessType || 'shop',
                    businessName: 'Icon',
                    colors: { background: backgroundColor, accent: '#FFFFFF' }
                })
            })
            const data = await response.json()
            if (data.iconUrl) {
                setAiResult(data.iconUrl)
            }
        } catch (error) {
            console.error('AI generation failed:', error)
        }
        setAiGenerating(false)
    }

    // Save icon
    const handleSave = async () => {
        let iconDataUrl: string | null = null

        if (activeTab === 'logo' && logoImage) {
            iconDataUrl = await generateLogoIcon()
        } else if (activeTab === 'templates' && selectedTemplate) {
            iconDataUrl = generateTemplateIcon()
        } else if (activeTab === 'ai' && aiResult) {
            iconDataUrl = aiResult
        }

        if (iconDataUrl) {
            // Upload to Supabase
            try {
                const response = await fetch('/api/design/generate-icon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageData: iconDataUrl,
                        uploadOnly: true
                    })
                })
                const data = await response.json()
                if (data.iconUrl) {
                    onSave(data.iconUrl)
                    onClose()
                }
            } catch (error) {
                // Fallback: use data URL directly
                onSave(iconDataUrl)
                onClose()
            }
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-xl mx-4 overflow-hidden border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Icon Editor</h2>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'templates' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Palette size={16} />
                        Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('logo')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'logo' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Upload size={16} />
                        Logo
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Sparkles size={16} />
                        AI
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 min-h-[400px]">
                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            {/* Color pickers */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 mb-1 block">Icon-Farbe</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {COLOR_PRESETS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setTemplateColor(color)}
                                                className={`w-6 h-6 rounded-full border-2 ${templateColor === color ? 'border-green-500' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 mb-1 block">Hintergrund</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {COLOR_PRESETS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setTemplateBgColor(color)}
                                                className={`w-6 h-6 rounded-full border-2 ${templateBgColor === color ? 'border-green-500' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Template grid */}
                            {Object.entries(TEMPLATE_ICONS).map(([category, icons]) => (
                                <div key={category}>
                                    <h4 className="text-xs text-zinc-500 uppercase mb-2">{category}</h4>
                                    <div className="grid grid-cols-5 gap-2">
                                        {icons.map((icon, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedTemplate({ category, index: idx })}
                                                className={`aspect-square rounded-lg border-2 flex items-center justify-center p-2 ${selectedTemplate?.category === category && selectedTemplate?.index === idx
                                                        ? 'border-green-500 bg-green-500/10'
                                                        : 'border-white/10 hover:border-white/30'
                                                    }`}
                                                style={{ backgroundColor: templateBgColor }}
                                                title={icon.name}
                                            >
                                                <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={templateColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d={icon.path} />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Preview */}
                            {selectedTemplate && (
                                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden" style={{ backgroundColor: templateBgColor }}>
                                        <svg viewBox="0 0 24 24" className="w-full h-full p-2" fill="none" stroke={templateColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d={(TEMPLATE_ICONS as any)[selectedTemplate.category][selectedTemplate.index].path} />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">
                                            {(TEMPLATE_ICONS as any)[selectedTemplate.category][selectedTemplate.index].name}
                                        </p>
                                        <p className="text-xs text-zinc-400">87×87px • Quadratisch</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logo Tab */}
                    {activeTab === 'logo' && (
                        <div className="space-y-4">
                            {!logoImage ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                                >
                                    <Upload className="w-10 h-10 mx-auto text-zinc-500 mb-2" />
                                    <p className="text-sm text-zinc-400">Logo hochladen</p>
                                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG oder SVG</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Canvas preview */}
                                    <div
                                        className="relative mx-auto w-44 h-44 rounded-xl overflow-hidden"
                                        style={{ backgroundColor: logoBgColor }}
                                    >
                                        <img
                                            src={logoImage}
                                            alt="Logo"
                                            className="absolute"
                                            style={{
                                                transform: `scale(${logoZoom}) translate(${logoPosition.x}px, ${logoPosition.y}px)`,
                                                transformOrigin: 'center',
                                                maxWidth: 'none',
                                                left: '50%',
                                                top: '50%',
                                                marginLeft: '-50%',
                                                marginTop: '-50%',
                                            }}
                                            draggable={false}
                                        />
                                        {/* Crosshair overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                                            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-center gap-4">
                                        <button onClick={() => setLogoZoom(z => Math.max(0.5, z - 0.1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                            <ZoomOut size={18} />
                                        </button>
                                        <span className="text-sm text-zinc-400 w-16 text-center">{Math.round(logoZoom * 100)}%</span>
                                        <button onClick={() => setLogoZoom(z => Math.min(3, z + 0.1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                            <ZoomIn size={18} />
                                        </button>
                                    </div>

                                    {/* Position controls */}
                                    <div className="flex items-center justify-center gap-2">
                                        <Move size={14} className="text-zinc-500" />
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={logoPosition.x}
                                            onChange={(e) => setLogoPosition(p => ({ ...p, x: parseInt(e.target.value) }))}
                                            className="w-24"
                                        />
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={logoPosition.y}
                                            onChange={(e) => setLogoPosition(p => ({ ...p, y: parseInt(e.target.value) }))}
                                            className="w-24"
                                        />
                                    </div>

                                    {/* Background color */}
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-1 block">Hintergrundfarbe</label>
                                        <div className="flex gap-1">
                                            {COLOR_PRESETS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setLogoBgColor(color)}
                                                    className={`w-6 h-6 rounded-full border-2 ${logoBgColor === color ? 'border-green-500' : 'border-transparent'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setLogoImage(null)}
                                        className="text-xs text-zinc-500 hover:text-white"
                                    >
                                        Anderes Logo wählen
                                    </button>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    )}

                    {/* AI Tab */}
                    {activeTab === 'ai' && (
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-400">
                                Wähle einen Geschäftstyp oder gib ein Keyword ein, um ein passendes Icon zu generieren.
                            </p>

                            {/* Business type buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                {businessTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setAiPrompt(type.value)}
                                        className={`py-2 px-3 rounded-lg text-sm text-left ${aiPrompt === type.value
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-transparent'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom prompt */}
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Oder eigenes Keyword eingeben..."
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500"
                            />

                            {/* Generate button */}
                            <Button
                                onClick={generateAiIcon}
                                disabled={!aiPrompt || aiGenerating}
                                className="w-full"
                            >
                                {aiGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generiere...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Icon generieren
                                    </>
                                )}
                            </Button>

                            {/* AI Result */}
                            {aiResult && (
                                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                                    <img src={aiResult} alt="Generated Icon" className="w-16 h-16 rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">KI-generiertes Icon</p>
                                        <p className="text-xs text-zinc-400">Klicke "Speichern" um es zu verwenden</p>
                                    </div>
                                    <Check className="w-5 h-5 text-green-500" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-white/10">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            (activeTab === 'logo' && !logoImage) ||
                            (activeTab === 'templates' && !selectedTemplate) ||
                            (activeTab === 'ai' && !aiResult)
                        }
                        className="flex-1 bg-green-600 hover:bg-green-500"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Speichern
                    </Button>
                </div>
            </div>
        </div>
    )
}
