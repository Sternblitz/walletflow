'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, Sparkles, Palette, Check, Loader2, ZoomIn, ZoomOut, RotateCcw, Move, Search } from 'lucide-react'
import { Button } from './button'
import * as LucideIcons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface IconEditorProps {
    isOpen: boolean
    onClose: () => void
    onSave: (iconUrl: string) => void
    backgroundColor?: string
    businessType?: string
}

// Professional Icon Library organized by business category
const ICON_CATEGORIES: Record<string, { name: string; emoji: string; icons: string[] }> = {
    food: {
        name: 'Gastronomie',
        emoji: '🍕',
        icons: [
            'UtensilsCrossed', 'Pizza', 'Coffee', 'Beer', 'Wine', 'Cake', 'Cookie', 'Croissant',
            'IceCream', 'Sandwich', 'Soup', 'Salad', 'Beef', 'Fish', 'Egg', 'Apple',
            'Cherry', 'Grape', 'Carrot', 'Banana', 'Citrus', 'CupSoda', 'Milk', 'Martini',
            'GlassWater', 'Popcorn', 'Drumstick', 'Ham', 'ChefHat', 'CookingPot'
        ]
    },
    beauty: {
        name: 'Beauty & Wellness',
        emoji: '✂️',
        icons: [
            'Scissors', 'Brush', 'Droplets', 'Sparkles', 'Heart', 'Star', 'Flower2', 'Leaf',
            'Sun', 'Moon', 'Shell', 'Gem', 'Crown', 'Bath', 'Flame', 'Wind',
            'Palette', 'Feather', 'CircleDot', 'Scan', 'Fingerprint', 'Hand', 'Footprints', 'Eye'
        ]
    },
    fitness: {
        name: 'Sport & Fitness',
        emoji: '💪',
        icons: [
            'Dumbbell', 'Bike', 'Trophy', 'Medal', 'Target', 'Zap', 'Activity', 'Heart',
            'Timer', 'Flame', 'Mountain', 'Waves', 'Trees', 'PersonStanding', 'Footprints', 'Gauge',
            'Timer', 'TrendingUp', 'HeartPulse', 'Volleyball', 'Dribbble', 'MapPin', 'Compass', 'Navigation'
        ]
    },
    retail: {
        name: 'Einzelhandel',
        emoji: '🛍️',
        icons: [
            'ShoppingBag', 'ShoppingCart', 'Store', 'Gift', 'Package', 'Tag', 'Percent', 'CreditCard',
            'Wallet', 'Receipt', 'Barcode', 'QrCode', 'Box', 'Truck', 'Building2', 'DollarSign',
            'BadgePercent', 'Ticket', 'Banknote', 'Coins', 'PiggyBank', 'CircleDollarSign', 'BadgeDollarSign', 'HandCoins'
        ]
    },
    services: {
        name: 'Dienstleistungen',
        emoji: '🔧',
        icons: [
            'Wrench', 'Settings', 'Tool', 'Hammer', 'Drill', 'Car', 'Key', 'Home',
            'Building', 'Briefcase', 'FileText', 'ClipboardCheck', 'Calendar', 'Clock', 'Phone', 'Mail',
            'MessageCircle', 'Headphones', 'Monitor', 'Printer', 'Wifi', 'Shield', 'Lock', 'Umbrella'
        ]
    },
    entertainment: {
        name: 'Unterhaltung',
        emoji: '🎵',
        icons: [
            'Music', 'Music2', 'Mic', 'Mic2', 'Headphones', 'Radio', 'Tv', 'Film',
            'Camera', 'Image', 'Video', 'Gamepad2', 'Dice1', 'Ticket', 'PartyPopper', 'Sparkles',
            'Drama', 'Clapperboard', 'Projector', 'Theater', 'Piano', 'Guitar', 'Drum', 'Speaker'
        ]
    },
    health: {
        name: 'Gesundheit',
        emoji: '🏥',
        icons: [
            'Stethoscope', 'Pill', 'Syringe', 'Thermometer', 'HeartPulse', 'Activity', 'Cross', 'Plus',
            'FirstAid', 'Bandage', 'Bone', 'Brain', 'Eye', 'Ear', 'Hand', 'Footprints',
            'Apple', 'Salad', 'Dumbbell', 'Bed', 'Clock', 'Sun', 'Moon', 'Cloud'
        ]
    },
    tech: {
        name: 'Technologie',
        emoji: '💻',
        icons: [
            'Laptop', 'Smartphone', 'Tablet', 'Monitor', 'Cpu', 'HardDrive', 'Usb', 'Wifi',
            'Bluetooth', 'Signal', 'Database', 'Cloud', 'Code', 'Terminal', 'Globe', 'Link',
            'MousePointer', 'Keyboard', 'Printer', 'Camera', 'Headphones', 'Watch', 'Battery', 'Plug'
        ]
    }
}

// Extended Color Palette - Premium colors organized by mood
const COLOR_PALETTES = {
    neutral: {
        name: 'Neutral',
        colors: ['#000000', '#1A1A1A', '#2D2D2D', '#404040', '#525252', '#737373', '#A3A3A3', '#D4D4D4', '#E5E5E5', '#F5F5F5', '#FAFAFA', '#FFFFFF']
    },
    warm: {
        name: 'Warm',
        colors: ['#7C2D12', '#9A3412', '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5', '#FFF7ED']
    },
    red: {
        name: 'Rot',
        colors: ['#450A0A', '#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2']
    },
    pink: {
        name: 'Pink',
        colors: ['#500724', '#831843', '#9D174D', '#BE185D', '#DB2777', '#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8', '#FCE7F3']
    },
    purple: {
        name: 'Lila',
        colors: ['#2E1065', '#4C1D95', '#5B21B6', '#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE']
    },
    blue: {
        name: 'Blau',
        colors: ['#172554', '#1E3A8A', '#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']
    },
    cyan: {
        name: 'Cyan',
        colors: ['#083344', '#155E75', '#0E7490', '#0891B2', '#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC', '#CFFAFE', '#ECFEFF']
    },
    green: {
        name: 'Grün',
        colors: ['#052E16', '#14532D', '#166534', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0', '#DCFCE7']
    },
    gold: {
        name: 'Gold',
        colors: ['#422006', '#713F12', '#854D0E', '#A16207', '#CA8A04', '#EAB308', '#FACC15', '#FDE047', '#FEF08A', '#FEF9C3']
    }
}

const EXPORT_SIZE = 512
const PREVIEW_SIZE = 256

export function IconEditor({ isOpen, onClose, onSave, backgroundColor = '#000000', businessType = '' }: IconEditorProps) {
    const [activeTab, setActiveTab] = useState<'icons' | 'logo' | 'ai'>('icons')
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof ICON_CATEGORIES>('food')
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
    const [iconColor, setIconColor] = useState('#FFFFFF')
    const [bgColor, setBgColor] = useState(backgroundColor)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPalette, setSelectedPalette] = useState<keyof typeof COLOR_PALETTES>('neutral')

    // Logo editor state
    const [logoImage, setLogoImage] = useState<string | null>(null)
    const [logoImageEl, setLogoImageEl] = useState<HTMLImageElement | null>(null)
    const [logoScale, setLogoScale] = useState(0.7)
    const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // AI state
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiGenerating, setAiGenerating] = useState(false)
    const [aiResult, setAiResult] = useState<string | null>(null)
    const [aiError, setAiError] = useState<string | null>(null)

    // Get Lucide icon component by name
    const getIconComponent = useCallback((name: string): LucideIcon | null => {
        const icon = (LucideIcons as any)[name]
        return icon || null
    }, [])

    // Filter icons by search
    const filteredIcons = searchQuery
        ? Object.values(ICON_CATEGORIES).flatMap(cat => cat.icons).filter(icon =>
            icon.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : ICON_CATEGORIES[selectedCategory].icons

    // Generate icon as PNG
    const generateIconPng = useCallback(async () => {
        if (!selectedIcon) return null

        const IconComponent = getIconComponent(selectedIcon)
        if (!IconComponent) return null

        // Create SVG string
        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT_SIZE}" height="${EXPORT_SIZE}" viewBox="0 0 ${EXPORT_SIZE} ${EXPORT_SIZE}">
                <rect width="${EXPORT_SIZE}" height="${EXPORT_SIZE}" fill="${bgColor}"/>
                <g transform="translate(${EXPORT_SIZE * 0.15}, ${EXPORT_SIZE * 0.15}) scale(${EXPORT_SIZE * 0.7 / 24})">
                    <path d="${getIconPath(selectedIcon)}" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            </svg>
        `

        // Convert SVG to canvas
        const canvas = document.createElement('canvas')
        canvas.width = EXPORT_SIZE
        canvas.height = EXPORT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        // Draw background
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

        // Draw icon using Image
        const img = new Image()
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)

        return new Promise<string>((resolve) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0)
                URL.revokeObjectURL(url)
                resolve(canvas.toDataURL('image/png'))
            }
            img.onerror = () => {
                URL.revokeObjectURL(url)
                // Fallback: draw directly on canvas
                ctx.fillStyle = bgColor
                ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)
                ctx.strokeStyle = iconColor
                ctx.lineWidth = EXPORT_SIZE / 24
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'

                // Simple fallback shape
                const padding = EXPORT_SIZE * 0.2
                const size = EXPORT_SIZE - padding * 2
                ctx.beginPath()
                ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, size / 3, 0, Math.PI * 2)
                ctx.stroke()

                resolve(canvas.toDataURL('image/png'))
            }
            img.src = url
        })
    }, [selectedIcon, iconColor, bgColor, getIconComponent])

    // Get SVG path for icon (simplified)
    const getIconPath = (iconName: string): string => {
        // This is a simplified approach - we'll use the canvas method instead
        return ''
    }

    // Logo upload handler
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string
                setLogoImage(dataUrl)
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

        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

        const imgAspect = logoImageEl.width / logoImageEl.height
        let drawWidth, drawHeight

        if (imgAspect > 1) {
            drawWidth = PREVIEW_SIZE * logoScale
            drawHeight = drawWidth / imgAspect
        } else {
            drawHeight = PREVIEW_SIZE * logoScale
            drawWidth = drawHeight * imgAspect
        }

        const x = (PREVIEW_SIZE - drawWidth) / 2 + logoPosition.x
        const y = (PREVIEW_SIZE - drawHeight) / 2 + logoPosition.y

        ctx.drawImage(logoImageEl, x, y, drawWidth, drawHeight)
    }, [logoImageEl, logoScale, logoPosition, bgColor])

    useEffect(() => {
        if (logoImageEl) drawPreview()
    }, [logoImageEl, logoScale, logoPosition, bgColor, drawPreview])

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

    const handleDragEnd = useCallback(() => setIsDragging(false), [])

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

    // Generate logo icon
    const generateLogoIcon = useCallback(() => {
        if (!logoImageEl) return null

        const canvas = document.createElement('canvas')
        canvas.width = EXPORT_SIZE
        canvas.height = EXPORT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        const scaleFactor = EXPORT_SIZE / PREVIEW_SIZE

        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

        const imgAspect = logoImageEl.width / logoImageEl.height
        let drawWidth, drawHeight

        if (imgAspect > 1) {
            drawWidth = EXPORT_SIZE * logoScale
            drawHeight = drawWidth / imgAspect
        } else {
            drawHeight = EXPORT_SIZE * logoScale
            drawWidth = drawHeight * imgAspect
        }

        const x = (EXPORT_SIZE - drawWidth) / 2 + (logoPosition.x * scaleFactor)
        const y = (EXPORT_SIZE - drawHeight) / 2 + (logoPosition.y * scaleFactor)

        ctx.drawImage(logoImageEl, x, y, drawWidth, drawHeight)
        return canvas.toDataURL('image/png')
    }, [logoImageEl, logoScale, logoPosition, bgColor])

    // AI generation
    const generateAiIcon = async () => {
        if (!aiPrompt) {
            setAiError('Bitte gib einen Geschäftstyp ein')
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
                    colors: { background: bgColor, accent: iconColor }
                })
            })

            const data = await response.json()
            if (data.iconUrl) {
                setAiResult(data.iconUrl)
            } else {
                setAiError(data.error || 'Konnte kein Icon generieren')
            }
        } catch (error) {
            setAiError('Verbindungsfehler')
        }

        setAiGenerating(false)
    }

    // Save handler
    const handleSave = async () => {
        let iconDataUrl: string | null = null

        if (activeTab === 'icons' && selectedIcon) {
            // For Lucide icons, we need to render to canvas differently
            const canvas = document.createElement('canvas')
            canvas.width = EXPORT_SIZE
            canvas.height = EXPORT_SIZE
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            // Draw background
            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

            // Create a temporary div to render the React icon
            const tempDiv = document.createElement('div')
            tempDiv.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${EXPORT_SIZE}px;height:${EXPORT_SIZE}px;`
            document.body.appendChild(tempDiv)

            // Use SVG directly
            const padding = EXPORT_SIZE * 0.15
            const iconSize = EXPORT_SIZE - padding * 2

            const svgHtml = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT_SIZE}" height="${EXPORT_SIZE}" viewBox="0 0 ${EXPORT_SIZE} ${EXPORT_SIZE}">
                    <rect width="${EXPORT_SIZE}" height="${EXPORT_SIZE}" fill="${bgColor}"/>
                    <svg x="${padding}" y="${padding}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    </svg>
                </svg>
            `

            // For now, create a simple icon representation
            ctx.strokeStyle = iconColor
            ctx.lineWidth = EXPORT_SIZE / 32
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            // Draw a placeholder icon shape based on category
            const centerX = EXPORT_SIZE / 2
            const centerY = EXPORT_SIZE / 2
            const radius = EXPORT_SIZE * 0.25

            ctx.beginPath()
            if (selectedCategory === 'food') {
                // Coffee cup shape
                ctx.moveTo(centerX - radius, centerY - radius * 0.5)
                ctx.lineTo(centerX - radius, centerY + radius)
                ctx.quadraticCurveTo(centerX, centerY + radius * 1.3, centerX + radius, centerY + radius)
                ctx.lineTo(centerX + radius, centerY - radius * 0.5)
                ctx.moveTo(centerX + radius, centerY - radius * 0.2)
                ctx.quadraticCurveTo(centerX + radius * 1.5, centerY, centerX + radius, centerY + radius * 0.3)
            } else if (selectedCategory === 'beauty') {
                // Scissors shape
                ctx.arc(centerX - radius * 0.4, centerY + radius * 0.4, radius * 0.3, 0, Math.PI * 2)
                ctx.moveTo(centerX + radius * 0.4, centerY + radius * 0.4)
                ctx.arc(centerX + radius * 0.4, centerY + radius * 0.4, radius * 0.3, 0, Math.PI * 2)
                ctx.moveTo(centerX - radius * 0.2, centerY + radius * 0.2)
                ctx.lineTo(centerX + radius * 0.5, centerY - radius * 0.8)
                ctx.moveTo(centerX + radius * 0.2, centerY + radius * 0.2)
                ctx.lineTo(centerX - radius * 0.5, centerY - radius * 0.8)
            } else {
                // Default circle with plus
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                ctx.moveTo(centerX - radius * 0.5, centerY)
                ctx.lineTo(centerX + radius * 0.5, centerY)
                ctx.moveTo(centerX, centerY - radius * 0.5)
                ctx.lineTo(centerX, centerY + radius * 0.5)
            }
            ctx.stroke()

            document.body.removeChild(tempDiv)
            iconDataUrl = canvas.toDataURL('image/png')

        } else if (activeTab === 'logo' && logoImageEl) {
            iconDataUrl = generateLogoIcon()
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-4xl mx-4 overflow-hidden border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
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
                        onClick={() => setActiveTab('icons')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'icons' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Palette size={16} />
                        Icon Bibliothek ({Object.values(ICON_CATEGORIES).flatMap(c => c.icons).length}+)
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
                <div className="flex-1 overflow-hidden flex">
                    {/* Icons Tab */}
                    {activeTab === 'icons' && (
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left: Categories */}
                            <div className="w-48 border-r border-white/10 p-3 overflow-y-auto shrink-0">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Kategorien</p>
                                {Object.entries(ICON_CATEGORIES).map(([key, cat]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSelectedCategory(key as keyof typeof ICON_CATEGORIES)
                                            setSearchQuery('')
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all ${selectedCategory === key
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span className="mr-2">{cat.emoji}</span>
                                        {cat.name}
                                        <span className="text-[10px] text-zinc-500 ml-1">({cat.icons.length})</span>
                                    </button>
                                ))}
                            </div>

                            {/* Middle: Icon Grid */}
                            <div className="flex-1 p-4 overflow-y-auto">
                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Icon suchen..."
                                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 text-sm"
                                    />
                                </div>

                                {/* Icon Grid */}
                                <div className="grid grid-cols-8 gap-2">
                                    {filteredIcons.map((iconName) => {
                                        const IconComponent = getIconComponent(iconName)
                                        if (!IconComponent) return null

                                        return (
                                            <button
                                                key={iconName}
                                                onClick={() => setSelectedIcon(iconName)}
                                                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${selectedIcon === iconName
                                                    ? 'bg-green-500/20 ring-2 ring-green-500 scale-105'
                                                    : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                                                    }`}
                                                title={iconName}
                                                style={{ backgroundColor: selectedIcon === iconName ? undefined : bgColor }}
                                            >
                                                <IconComponent
                                                    size={24}
                                                    className="transition-colors"
                                                    style={{ color: selectedIcon === iconName ? '#22C55E' : iconColor }}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Right: Color Picker */}
                            <div className="w-64 border-l border-white/10 p-4 overflow-y-auto shrink-0">
                                {/* Preview */}
                                {selectedIcon && (
                                    <div className="mb-4">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Vorschau</p>
                                        <div
                                            className="w-full aspect-square rounded-xl flex items-center justify-center border border-white/20"
                                            style={{ backgroundColor: bgColor }}
                                        >
                                            {(() => {
                                                const IconComponent = getIconComponent(selectedIcon)
                                                return IconComponent ? <IconComponent size={80} style={{ color: iconColor }} /> : null
                                            })()}
                                        </div>
                                        <p className="text-xs text-zinc-400 text-center mt-2">{selectedIcon}</p>
                                    </div>
                                )}

                                {/* Icon Color */}
                                <div className="mb-4">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Icon-Farbe</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {COLOR_PALETTES[selectedPalette].colors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setIconColor(color)}
                                                className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${iconColor === color ? 'border-green-500 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedPalette(key as keyof typeof COLOR_PALETTES)}
                                                className={`text-[9px] px-2 py-1 rounded ${selectedPalette === key ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                {pal.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Background Color */}
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Hintergrund</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {COLOR_PALETTES[selectedPalette].colors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setBgColor(color)}
                                                className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${bgColor === color ? 'border-green-500 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logo Tab */}
                    {activeTab === 'logo' && (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-md mx-auto space-y-4">
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
                                        <div className="flex justify-center">
                                            <canvas
                                                ref={previewCanvasRef}
                                                width={PREVIEW_SIZE}
                                                height={PREVIEW_SIZE}
                                                className="rounded-xl cursor-move border-2 border-white/20"
                                                onMouseDown={handleDragStart}
                                                onTouchStart={handleDragStart}
                                                style={{ touchAction: 'none' }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => setLogoScale(s => Math.max(0.1, s - 0.1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                <ZoomOut size={18} />
                                            </button>
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                value={logoScale * 100}
                                                onChange={(e) => setLogoScale(parseInt(e.target.value) / 100)}
                                                className="w-32 accent-green-500"
                                            />
                                            <button onClick={() => setLogoScale(s => Math.min(2, s + 0.1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                <ZoomIn size={18} />
                                            </button>
                                            <button onClick={() => { setLogoPosition({ x: 0, y: 0 }); setLogoScale(0.7) }} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                <RotateCcw size={18} />
                                            </button>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Hintergrund</p>
                                            <div className="flex gap-1 flex-wrap">
                                                {COLOR_PALETTES.neutral.colors.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setBgColor(color)}
                                                        className={`w-6 h-6 rounded-md border-2 ${bgColor === color ? 'border-green-500' : 'border-transparent'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => { setLogoImage(null); setLogoImageEl(null) }}
                                            className="text-xs text-zinc-500 hover:text-red-400"
                                        >
                                            <X size={12} className="inline mr-1" />
                                            Anderes Logo wählen
                                        </button>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </div>
                        </div>
                    )}

                    {/* AI Tab */}
                    {activeTab === 'ai' && (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-md mx-auto space-y-4">
                                <p className="text-sm text-zinc-400">
                                    Beschreibe dein Geschäft und wir generieren ein passendes Icon.
                                </p>

                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="z.B. Café, Friseur, Pizzeria, Fitnessstudio..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500"
                                />

                                {aiError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {aiError}
                                    </div>
                                )}

                                <Button
                                    onClick={generateAiIcon}
                                    disabled={!aiPrompt || aiGenerating}
                                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
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

                                {aiResult && (
                                    <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                        <img src={aiResult} alt="Generated Icon" className="w-20 h-20 rounded-lg object-cover bg-black" />
                                        <div>
                                            <p className="text-sm text-white font-medium flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                Icon generiert!
                                            </p>
                                            <p className="text-xs text-zinc-400">Klicke "Speichern" um es zu verwenden</p>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                            (activeTab === 'icons' && !selectedIcon) ||
                            (activeTab === 'logo' && !logoImageEl) ||
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
