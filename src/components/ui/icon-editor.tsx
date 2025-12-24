'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, Sparkles, Palette, Check, Loader2, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react'
import { Button } from './button'

interface IconEditorProps {
    isOpen: boolean
    onClose: () => void
    onSave: (iconUrl: string) => void
    backgroundColor?: string
    businessType?: string
}

// Extended Template Icons - 50+ options
const TEMPLATE_ICONS = {
    food: [
        { name: 'Burger', path: 'M4 15h16M4 15c0-4 4-8 8-8s8 4 8 8M6 18h12a2 2 0 002-2H4a2 2 0 002 2' },
        { name: 'Pizza', path: 'M12 2L3 20h18L12 2M12 7a1 1 0 100 2M8 13a1 1 0 100 2M15 11a1 1 0 100 2' },
        { name: 'Döner', path: 'M10 2v20M14 2v20M8 6h8M6 10h12M6 14h12M8 18h8' },
        { name: 'Bowl', path: 'M3 12h18M5 12c0 5 3 8 7 8s7-3 7-8M9 8c0-2 1-4 3-4s3 2 3 4' },
        { name: 'Fries', path: 'M7 22V12M10 22V10M13 22V12M16 22V10M5 12h14l-2-8H7z' },
        { name: 'Taco', path: 'M4 16c0-4 4-8 8-8s8 4 8 8c0 2-2 4-8 4s-8-2-8-4M8 12a2 2 0 100 4M14 10a2 2 0 100 4' },
        { name: 'Sushi', path: 'M4 12h16M4 12a4 4 0 014-4h8a4 4 0 014 4M4 12a4 4 0 004 4h8a4 4 0 004-4M8 14v2M12 14v2M16 14v2' },
        { name: 'Ramen', path: 'M5 10c0 6 3 10 7 10s7-4 7-10M3 10h18M8 6v2M12 4v4M16 6v2' },
        { name: 'Salad', path: 'M4 14c0 4 4 6 8 6s8-2 8-6c0-6-4-10-8-10s-8 4-8 10M8 12a2 2 0 104 0M12 8a2 2 0 104 0' },
        { name: 'Steak', path: 'M4 12c2-4 6-6 8-6s6 2 8 6c-2 4-6 6-8 6s-6-2-8-6M10 10a2 2 0 104 4' },
    ],
    drinks: [
        { name: 'Coffee', path: 'M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8M6 1v3M10 1v3M14 1v3' },
        { name: 'Cocktail', path: 'M8 22h8M12 17v5M5 2l7 9 7-9M5 2h14M12 11v6' },
        { name: 'Beer', path: 'M17 11h1a3 3 0 010 6h-1M5 6h12v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6M5 10h12' },
        { name: 'Boba', path: 'M8 2h8l-1 18H9L8 2M6 6h12M10 12a1 1 0 100 2M14 14a1 1 0 100 2M12 16a1 1 0 100 2' },
        { name: 'Smoothie', path: 'M9 2h6l-2 20h-2L9 2M7 6h10M12 2v-1' },
        { name: 'Wine', path: 'M8 22h8M12 14v8M8 2h8l-2 6a4 4 0 01-4 4 4 4 0 01-4-4l-2-6M8 2c0 2 2 4 4 4s4-2 4-4' },
        { name: 'Juice', path: 'M7 4h10v16a2 2 0 01-2 2H9a2 2 0 01-2-2V4M7 4L6 2h12l-1 2M7 10h10' },
        { name: 'Matcha', path: 'M4 10h16v6a6 6 0 01-6 6h-4a6 6 0 01-6-6v-6M6 6c0-2 2-4 6-4s6 2 6 4v4H6V6' },
        { name: 'Espresso', path: 'M18 10h1a2 2 0 010 4h-1M5 10h13v4a4 4 0 01-4 4H9a4 4 0 01-4-4v-4M7 6c0-2 2-2 5-2s5 0 5 2' },
        { name: 'Shake', path: 'M8 4h8v16a2 2 0 01-2 2h-4a2 2 0 01-2-2V4M6 4a2 2 0 012-2h8a2 2 0 012 2M10 8h4M10 12h4' },
    ],
    services: [
        { name: 'Scissors', path: 'M6 9a3 3 0 100-6 3 3 0 000 6M6 21a3 3 0 100-6 3 3 0 000 6M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12' },
        { name: 'Comb', path: 'M4 4v16M8 4v16M4 8h4M4 12h4M4 16h4M12 4l8 8M12 12l8 8' },
        { name: 'Nail', path: 'M12 2v6M9 8h6l1 12H8l1-12M7 20h10' },
        { name: 'Spa', path: 'M12 22c-4 0-8-4-8-10 4 0 8 4 8 10M12 22c4 0 8-4 8-10-4 0-8 4-8 10M12 2v10' },
        { name: 'Gym', path: 'M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5M12 2v4M12 18v4M2 12h4M18 12h4' },
        { name: 'Yoga', path: 'M12 4a2 2 0 100-4 2 2 0 000 4M12 6v6M8 20l4-8 4 8M6 12h12' },
        { name: 'Massage', path: 'M12 4a2 2 0 100-4 2 2 0 000 4M4 20c2-4 4-8 8-10s6 6 8 10M8 14a4 4 0 018 0' },
        { name: 'Tooth', path: 'M12 2c-2 0-4 2-4 6 0 6 2 14 4 14s4-8 4-14c0-4-2-6-4-6M8 8c-2 0-3 2-3 4s1 4 3 4M16 8c2 0 3 2 3 4s-1 4-3 4' },
        { name: 'Makeup', path: 'M12 2a4 4 0 00-4 4v12a4 4 0 008 0V6a4 4 0 00-4-4M8 10h8' },
        { name: 'Perfume', path: 'M10 6h4M12 2v4M8 6h8v14a2 2 0 01-2 2h-4a2 2 0 01-2-2V6M8 12h8' },
    ],
    retail: [
        { name: 'Bag', path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6M3 6h18M16 10a4 4 0 01-8 0' },
        { name: 'Tag', path: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82M7 7h.01' },
        { name: 'Star', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2' },
        { name: 'Gift', path: 'M20 12v10H4V12M2 7h20v5H2M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7' },
        { name: 'Crown', path: 'M3 17l3-9 4 5 2-7 2 7 4-5 3 9H3M3 21h18' },
        { name: 'Heart', path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78' },
        { name: 'Diamond', path: 'M12 2L2 9l10 13 10-13-10-7M2 9h20M7 9l5 13M17 9l-5 13' },
        { name: 'Percent', path: 'M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5M17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5' },
        { name: 'Cart', path: 'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6M10 21a1 1 0 100-2 1 1 0 000 2M21 21a1 1 0 100-2 1 1 0 000 2' },
        { name: 'Store', path: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9M9 22V12h6v10' },
    ],
    tech: [
        { name: 'Phone', path: 'M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2M12 18h.01' },
        { name: 'Wifi', path: 'M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01' },
        { name: 'Camera', path: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11M12 17a4 4 0 100-8 4 4 0 000 8' },
        { name: 'Music', path: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0M21 16a3 3 0 11-6 0 3 3 0 016 0' },
        { name: 'Game', path: 'M6 12h4M14 12h4M15 9v6M9 9v6M5 6h14a3 3 0 013 3v6a3 3 0 01-3 3H5a3 3 0 01-3-3V9a3 3 0 013-3' },
        { name: 'Headphones', path: 'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5' },
        { name: 'Printer', path: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8' },
        { name: 'Watch', path: 'M12 8v4l2 2M17 2l2 2M7 2L5 4M12 21a7 7 0 100-14 7 7 0 000 14' },
        { name: 'Laptop', path: 'M20 16V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10M2 20h20M8 20l1-2h6l1 2' },
        { name: 'TV', path: 'M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2M8 21h8M12 17v4' },
    ],
}

// Color presets
const COLOR_PRESETS = [
    '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C',
]

const PREVIEW_SIZE = 176

export function IconEditor({ isOpen, onClose, onSave, backgroundColor = '#000000', businessType = '' }: IconEditorProps) {
    const [activeTab, setActiveTab] = useState<'logo' | 'ai' | 'templates'>('templates')

    // Logo editor state
    const [logoImage, setLogoImage] = useState<string | null>(null)
    const [logoImageEl, setLogoImageEl] = useState<HTMLImageElement | null>(null)
    const [logoScale, setLogoScale] = useState(0.7)
    const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
    const [logoBgColor, setLogoBgColor] = useState(backgroundColor)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // AI state
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiGenerating, setAiGenerating] = useState(false)
    const [aiResult, setAiResult] = useState<string | null>(null)
    const [aiError, setAiError] = useState<string | null>(null)

    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState<{ category: string; index: number } | null>(null)
    const [templateColor, setTemplateColor] = useState('#FFFFFF')
    const [templateBgColor, setTemplateBgColor] = useState(backgroundColor)

    const businessTypes = [
        { value: 'doener kebab food', label: '🥙 Döner/Kebab' },
        { value: 'coffee cafe espresso', label: '☕ Café' },
        { value: 'restaurant dining food', label: '🍽️ Restaurant' },
        { value: 'pizza italian food', label: '🍕 Pizzeria' },
        { value: 'burger fastfood', label: '🍔 Burger' },
        { value: 'bar drinks cocktail', label: '🍺 Bar' },
        { value: 'hair salon scissors', label: '✂️ Friseur' },
        { value: 'spa wellness massage', label: '🧖 Spa/Wellness' },
        { value: 'fitness gym workout', label: '🏋️ Fitness' },
        { value: 'shopping retail store', label: '🛍️ Shop' },
        { value: 'bakery bread pastry', label: '🥐 Bäckerei' },
        { value: 'ice cream gelato dessert', label: '🍦 Eisdiele' },
        { value: 'sushi japanese food', label: '🍣 Sushi' },
        { value: 'nails manicure beauty', label: '💅 Nagelstudio' },
    ]

    // Load logo image when uploaded
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string
                setLogoImage(dataUrl)

                // Load image element
                const img = new Image()
                img.onload = () => setLogoImageEl(img)
                img.src = dataUrl

                setLogoScale(0.7)
                setLogoPosition({ x: 0, y: 0 })
            }
            reader.readAsDataURL(file)
        }
    }

    // Draw preview canvas
    const drawPreview = useCallback(() => {
        const canvas = previewCanvasRef.current
        if (!canvas || !logoImageEl) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = PREVIEW_SIZE

        // Clear and draw background
        ctx.fillStyle = logoBgColor
        ctx.fillRect(0, 0, size, size)

        // Calculate image dimensions
        const imgAspect = logoImageEl.width / logoImageEl.height
        let drawWidth, drawHeight

        if (imgAspect > 1) {
            drawWidth = size * logoScale
            drawHeight = drawWidth / imgAspect
        } else {
            drawHeight = size * logoScale
            drawWidth = drawHeight * imgAspect
        }

        // Center position + offset
        const x = (size - drawWidth) / 2 + logoPosition.x
        const y = (size - drawHeight) / 2 + logoPosition.y

        ctx.drawImage(logoImageEl, x, y, drawWidth, drawHeight)
    }, [logoImageEl, logoScale, logoPosition, logoBgColor])

    // Redraw when dependencies change
    useEffect(() => {
        if (logoImageEl) {
            drawPreview()
        }
    }, [logoImageEl, logoScale, logoPosition, logoBgColor, drawPreview])

    // Drag handlers
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        setIsDragging(true)
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        setDragStart({ x: clientX - logoPosition.x, y: clientY - logoPosition.y })
    }

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        setLogoPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        })
    }, [isDragging, dragStart])

    const handleDragEnd = useCallback(() => {
        setIsDragging(false)
    }, [])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove)
            window.addEventListener('mouseup', handleDragEnd)
            window.addEventListener('touchmove', handleDragMove)
            window.addEventListener('touchend', handleDragEnd)
            return () => {
                window.removeEventListener('mousemove', handleDragMove)
                window.removeEventListener('mouseup', handleDragEnd)
                window.removeEventListener('touchmove', handleDragMove)
                window.removeEventListener('touchend', handleDragEnd)
            }
        }
    }, [isDragging, handleDragMove, handleDragEnd])

    // Generate final icon (2x resolution for retina)
    const generateLogoIcon = useCallback(() => {
        if (!logoImageEl) return null

        const canvas = document.createElement('canvas')
        const size = 174 // 2x for retina (87 * 2)
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        // Scale factor from preview to final
        const scaleFactor = size / PREVIEW_SIZE

        // Background
        ctx.fillStyle = logoBgColor
        ctx.fillRect(0, 0, size, size)

        // Calculate image dimensions (same logic as preview, scaled)
        const imgAspect = logoImageEl.width / logoImageEl.height
        let drawWidth, drawHeight

        if (imgAspect > 1) {
            drawWidth = size * logoScale
            drawHeight = drawWidth / imgAspect
        } else {
            drawHeight = size * logoScale
            drawWidth = drawHeight * imgAspect
        }

        // Center position + offset (scaled)
        const x = (size - drawWidth) / 2 + (logoPosition.x * scaleFactor)
        const y = (size - drawHeight) / 2 + (logoPosition.y * scaleFactor)

        ctx.drawImage(logoImageEl, x, y, drawWidth, drawHeight)
        return canvas.toDataURL('image/png')
    }, [logoImageEl, logoScale, logoPosition, logoBgColor])

    // Generate template icon
    const generateTemplateIcon = useCallback(() => {
        if (!selectedTemplate) return null

        const canvas = document.createElement('canvas')
        const size = 174
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        ctx.fillStyle = templateBgColor
        ctx.fillRect(0, 0, size, size)

        const categoryKey = selectedTemplate.category as keyof typeof TEMPLATE_ICONS
        const icon = TEMPLATE_ICONS[categoryKey]?.[selectedTemplate.index]

        if (icon) {
            ctx.strokeStyle = templateColor
            ctx.lineWidth = 6
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.translate(size / 2 - 72, size / 2 - 72)
            ctx.scale(6, 6)
            const path = new Path2D(icon.path)
            ctx.stroke(path)
        }

        return canvas.toDataURL('image/png')
    }, [selectedTemplate, templateColor, templateBgColor])

    // AI generation
    const generateAiIcon = async () => {
        if (!aiPrompt) {
            setAiError('Bitte wähle einen Geschäftstyp oder gib ein Keyword ein')
            return
        }

        setAiGenerating(true)
        setAiError(null)

        try {
            const response = await fetch('/api/design/generate-notification-icon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessType: aiPrompt,
                    businessName: businessType || 'Store',
                    colors: { background: backgroundColor, accent: '#FFFFFF' }
                })
            })

            const data = await response.json()

            if (data.iconUrl) {
                setAiResult(data.iconUrl)
            } else if (data.error) {
                setAiError(data.error)
            } else {
                setAiError('Konnte kein Icon generieren. Bitte versuche es erneut.')
            }
        } catch (error) {
            console.error('AI generation failed:', error)
            setAiError('Verbindungsfehler. Bitte prüfe deine Internetverbindung.')
        }

        setAiGenerating(false)
    }

    // Save
    const handleSave = async () => {
        let iconDataUrl: string | null = null

        if (activeTab === 'logo' && logoImageEl) {
            iconDataUrl = generateLogoIcon()
        } else if (activeTab === 'templates' && selectedTemplate) {
            iconDataUrl = generateTemplateIcon()
        } else if (activeTab === 'ai' && aiResult) {
            onSave(aiResult)
            onClose()
            return
        }

        if (iconDataUrl) {
            try {
                const response = await fetch('/api/design/generate-icon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageData: iconDataUrl, uploadOnly: true })
                })
                const data = await response.json()
                if (data.iconUrl) {
                    onSave(data.iconUrl)
                    onClose()
                    return
                }
            } catch (error) {
                console.error('Upload error:', error)
            }
            onSave(iconDataUrl)
            onClose()
        }
    }

    const resetPosition = () => {
        setLogoPosition({ x: 0, y: 0 })
        setLogoScale(0.7)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl mx-4 overflow-hidden border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-lg font-semibold text-white">🎨 Icon Editor</h2>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 shrink-0">
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'templates' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Palette size={16} />
                        Vorlagen ({Object.values(TEMPLATE_ICONS).flat().length})
                    </button>
                    <button
                        onClick={() => setActiveTab('logo')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'logo' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Upload size={16} />
                        Logo hochladen
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Sparkles size={16} />
                        AI generieren
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 mb-2 block">Icon-Farbe</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {COLOR_PRESETS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setTemplateColor(color)}
                                                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${templateColor === color ? 'border-green-500 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 mb-2 block">Hintergrund</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {COLOR_PRESETS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setTemplateBgColor(color)}
                                                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${templateBgColor === color ? 'border-green-500 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {Object.entries(TEMPLATE_ICONS).map(([category, icons]) => (
                                <div key={category}>
                                    <h4 className="text-xs text-zinc-500 uppercase mb-2 font-medium">{category}</h4>
                                    <div className="grid grid-cols-10 gap-1.5">
                                        {icons.map((icon, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedTemplate({ category, index: idx })}
                                                className={`aspect-square rounded-lg border-2 flex items-center justify-center p-1.5 transition-all ${selectedTemplate?.category === category && selectedTemplate?.index === idx
                                                    ? 'border-green-500 bg-green-500/20 scale-105'
                                                    : 'border-white/10 hover:border-white/30 hover:bg-white/5'
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
                        </div>
                    )}

                    {/* Logo Tab */}
                    {activeTab === 'logo' && (
                        <div className="space-y-4">
                            {!logoImage ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors"
                                >
                                    <Upload className="w-12 h-12 mx-auto text-zinc-500 mb-3" />
                                    <p className="text-sm text-zinc-400">Logo hochladen</p>
                                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG, SVG oder WebP</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Canvas Preview */}
                                    <div className="flex justify-center">
                                        <div className="relative">
                                            <canvas
                                                ref={previewCanvasRef}
                                                width={PREVIEW_SIZE}
                                                height={PREVIEW_SIZE}
                                                className="rounded-xl cursor-move border-2 border-white/20"
                                                onMouseDown={handleDragStart}
                                                onTouchStart={handleDragStart}
                                                style={{ touchAction: 'none' }}
                                            />
                                            {/* Move indicator */}
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 pointer-events-none">
                                                <Move size={12} />
                                                Ziehen zum Verschieben
                                            </div>
                                        </div>
                                    </div>

                                    {/* Zoom Controls */}
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => setLogoScale(s => Math.max(0.1, s - 0.1))}
                                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                                        >
                                            <ZoomOut size={18} />
                                        </button>
                                        <div className="w-40">
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                value={logoScale * 100}
                                                onChange={(e) => setLogoScale(parseInt(e.target.value) / 100)}
                                                className="w-full accent-green-500"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setLogoScale(s => Math.min(2, s + 0.1))}
                                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                                        >
                                            <ZoomIn size={18} />
                                        </button>
                                        <button
                                            onClick={resetPosition}
                                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                                            title="Zurücksetzen"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500 text-center">{Math.round(logoScale * 100)}% Größe</p>

                                    {/* Background Color */}
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-2 block">Hintergrundfarbe</label>
                                        <div className="flex gap-1 flex-wrap">
                                            {COLOR_PRESETS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setLogoBgColor(color)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${logoBgColor === color ? 'border-green-500 scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setLogoImage(null)
                                            setLogoImageEl(null)
                                        }}
                                        className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1"
                                    >
                                        <X size={12} />
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
                        </div>
                    )}

                    {/* AI Tab */}
                    {activeTab === 'ai' && (
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-400">
                                Wähle einen Geschäftstyp um automatisch ein passendes Icon zu generieren.
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                {businessTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setAiPrompt(type.value)}
                                        className={`py-2.5 px-3 rounded-lg text-sm text-left transition-all ${aiPrompt === type.value
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                            : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-transparent'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Oder eigenes Keyword:</label>
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="z.B. Sushi, Nagelstudio, Autowäsche..."
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500"
                                />
                            </div>

                            {aiError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {aiError}
                                </div>
                            )}

                            <Button
                                onClick={generateAiIcon}
                                disabled={!aiPrompt || aiGenerating}
                                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                            >
                                {aiGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generiere Icon...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Icon generieren
                                    </>
                                )}
                            </Button>

                            {aiResult && (
                                <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                    <img src={aiResult} alt="Generated Icon" className="w-20 h-20 rounded-lg object-cover bg-black" />
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Icon generiert!
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-1">Klicke "Speichern" um es zu verwenden</p>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-zinc-500 text-center">
                                Benötigt GEMINI_API_KEY oder GOOGLE_API_KEY in .env.local
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-white/10 shrink-0">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            (activeTab === 'logo' && !logoImageEl) ||
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
