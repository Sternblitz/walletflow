'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, Sparkles, Check, Loader2, ZoomIn, ZoomOut, RotateCcw, Search, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react'
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

// MASSIVE Icon Library - 400+ icons organized by business category
const ICON_CATEGORIES: Record<string, { name: string; emoji: string; icons: string[] }> = {
    food: {
        name: 'Gastronomie',
        emoji: '🍕',
        icons: [
            'UtensilsCrossed', 'Utensils', 'Pizza', 'Coffee', 'Beer', 'Wine', 'Cake', 'Cookie', 'Croissant',
            'IceCream', 'Sandwich', 'Soup', 'Salad', 'Beef', 'Fish', 'Egg', 'Apple', 'Cherry', 'Grape',
            'Carrot', 'Banana', 'Citrus', 'CupSoda', 'Milk', 'Martini', 'GlassWater', 'Popcorn', 'Drumstick',
            'Ham', 'ChefHat', 'CookingPot', 'Flame', 'Refrigerator', 'Microwave', 'Wheat', 'Leaf',
            'Candy', 'Lollipop', 'Donut', 'Slice', 'Vegan', 'Nut', 'Bean', 'Pepper', 'Mushroom',
            'Broccoli', 'Corn', 'Peanut', 'Olive', 'Salt', 'Soup', 'Bowl', 'Spoon', 'Fork', 'Knife'
        ]
    },
    beauty: {
        name: 'Beauty & Wellness',
        emoji: '✂️',
        icons: [
            'Scissors', 'Brush', 'Droplets', 'Sparkles', 'Heart', 'Star', 'Flower2', 'Leaf', 'Sun', 'Moon',
            'Shell', 'Gem', 'Crown', 'Bath', 'Flame', 'Wind', 'Palette', 'Feather', 'CircleDot', 'Scan',
            'Fingerprint', 'Hand', 'Footprints', 'Eye', 'Smile', 'Flower', 'Lotus', 'Rainbow', 'Waves',
            'Droplet', 'CloudRain', 'Snowflake', 'Stars', 'Moon', 'Sunrise', 'Sunset', 'Umbrella',
            'Paintbrush', 'Paintbrush2', 'Eraser', 'Highlighter', 'PenTool', 'Stamp', 'Wand', 'Wand2',
            'Sparkle', 'GemIcon', 'Diamond', 'Ring', 'Watch', 'Glasses', 'Contact', 'Perfume'
        ]
    },
    fitness: {
        name: 'Sport & Fitness',
        emoji: '💪',
        icons: [
            'Dumbbell', 'Bike', 'Trophy', 'Medal', 'Target', 'Zap', 'Activity', 'Heart', 'Timer', 'Flame',
            'Mountain', 'Waves', 'Trees', 'PersonStanding', 'Footprints', 'Gauge', 'TrendingUp', 'HeartPulse',
            'Volleyball', 'MapPin', 'Compass', 'Navigation', 'Flag', 'Award', 'Crown', 'Star',
            'Swords', 'Shield', 'Axe', 'Anchor', 'Rocket', 'Plane', 'Car', 'Bike',
            'Footprints', 'Running', 'Walk', 'Stretch', 'Yoga', 'Gym', 'Pool', 'Swim',
            'Tennis', 'Basketball', 'Football', 'Soccer', 'Golf', 'Bowling', 'Boxing', 'Martial'
        ]
    },
    retail: {
        name: 'Einzelhandel',
        emoji: '🛍️',
        icons: [
            'ShoppingBag', 'ShoppingCart', 'Store', 'Gift', 'Package', 'Tag', 'Percent', 'CreditCard',
            'Wallet', 'Receipt', 'Barcode', 'QrCode', 'Box', 'Truck', 'Building2', 'DollarSign',
            'BadgePercent', 'Ticket', 'Banknote', 'Coins', 'PiggyBank', 'CircleDollarSign', 'BadgeDollarSign',
            'HandCoins', 'Warehouse', 'Factory', 'Container', 'Forklift', 'Pallet', 'Scale',
            'Calculator', 'ClipboardList', 'FileSpreadsheet', 'BarChart', 'PieChart', 'TrendingUp',
            'ArrowUpCircle', 'ArrowDownCircle', 'RefreshCw', 'RotateCw', 'Repeat', 'Shuffle', 'Filter'
        ]
    },
    services: {
        name: 'Dienstleistungen',
        emoji: '🔧',
        icons: [
            'Wrench', 'Settings', 'Hammer', 'Car', 'Key', 'Home', 'Building', 'Briefcase', 'FileText',
            'ClipboardCheck', 'Calendar', 'Clock', 'Phone', 'Mail', 'MessageCircle', 'Headphones',
            'Monitor', 'Printer', 'Wifi', 'Shield', 'Lock', 'Umbrella', 'Lightbulb', 'Zap',
            'Plug', 'Battery', 'Thermometer', 'Gauge', 'Compass', 'Map', 'Navigation', 'Route',
            'Truck', 'Van', 'Bus', 'Train', 'Plane', 'Ship', 'Anchor', 'Fuel',
            'ParkingCircle', 'CarFront', 'Bike', 'Footprints', 'Door', 'Window', 'Fence', 'Tree'
        ]
    },
    entertainment: {
        name: 'Unterhaltung',
        emoji: '🎵',
        icons: [
            'Music', 'Music2', 'Music3', 'Music4', 'Mic', 'Mic2', 'MicOff', 'Headphones', 'Radio', 'Tv',
            'Film', 'Camera', 'Image', 'Video', 'Gamepad2', 'Ticket', 'PartyPopper', 'Sparkles',
            'Clapperboard', 'Speaker', 'Play', 'Pause', 'Stop', 'FastForward', 'Rewind', 'SkipForward',
            'SkipBack', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Disc', 'Disc2', 'Disc3',
            'Podcast', 'Youtube', 'Twitch', 'Instagram', 'Facebook', 'Twitter', 'Linkedin', 'Github',
            'Chrome', 'Globe', 'Wifi', 'Cast', 'Airplay', 'Bluetooth', 'Nfc', 'Usb'
        ]
    },
    health: {
        name: 'Gesundheit',
        emoji: '🏥',
        icons: [
            'Stethoscope', 'Pill', 'Syringe', 'Thermometer', 'HeartPulse', 'Activity', 'Cross', 'Plus',
            'Bandage', 'Brain', 'Eye', 'EyeOff', 'Ear', 'EarOff', 'Hand', 'Footprints',
            'Apple', 'Salad', 'Dumbbell', 'Bed', 'Clock', 'Sun', 'Moon', 'Cloud', 'Smile', 'Frown',
            'Meh', 'Heart', 'HeartOff', 'Heartbeat', 'Lungs', 'Bone', 'Kidney', 'Liver',
            'Ambulance', 'Hospital', 'Clinic', 'Pharmacy', 'Lab', 'Microscope', 'TestTube', 'Flask',
            'Dna', 'Virus', 'Bacteria', 'Mask', 'Sanitizer', 'Soap', 'WashingHands', 'Shield'
        ]
    },
    tech: {
        name: 'Technologie',
        emoji: '💻',
        icons: [
            'Laptop', 'Smartphone', 'Tablet', 'Monitor', 'Cpu', 'HardDrive', 'Usb', 'Wifi', 'Bluetooth',
            'Signal', 'Database', 'Cloud', 'CloudUpload', 'CloudDownload', 'Code', 'Code2', 'Terminal',
            'Globe', 'Link', 'Link2', 'ExternalLink', 'MousePointer', 'MousePointer2', 'Keyboard',
            'Printer', 'Camera', 'Webcam', 'Headphones', 'Watch', 'Smartwatch', 'Battery', 'BatteryCharging',
            'Plug', 'Power', 'PowerOff', 'Settings', 'Settings2', 'Sliders', 'SlidersHorizontal',
            'Layers', 'Layout', 'Grid', 'Grid2', 'Grid3', 'Table', 'Table2', 'Columns', 'Rows'
        ]
    },
    animals: {
        name: 'Tiere & Natur',
        emoji: '🐾',
        icons: [
            'Dog', 'Cat', 'Bird', 'Fish', 'Bug', 'Butterfly', 'Snail', 'Turtle', 'Rabbit', 'Squirrel',
            'Paw', 'Bone', 'Feather', 'Egg', 'Leaf', 'Flower', 'Flower2', 'TreeDeciduous', 'TreePine',
            'Trees', 'Mountain', 'Waves', 'Sun', 'Moon', 'Star', 'Stars', 'Cloud', 'CloudRain',
            'CloudSnow', 'CloudLightning', 'Rainbow', 'Sunrise', 'Sunset', 'Wind', 'Tornado',
            'Droplet', 'Droplets', 'Snowflake', 'Thermometer', 'Globe', 'Earth', 'Map', 'Compass'
        ]
    },
    travel: {
        name: 'Reise & Transport',
        emoji: '✈️',
        icons: [
            'Plane', 'PlaneTakeoff', 'PlaneLanding', 'Car', 'CarFront', 'Bus', 'Train', 'Ship', 'Anchor',
            'Bike', 'Rocket', 'Fuel', 'ParkingCircle', 'Map', 'MapPin', 'MapPinned', 'Navigation',
            'Navigation2', 'Compass', 'Route', 'Signpost', 'Milestone', 'Flag', 'Globe', 'Globe2',
            'Earth', 'Palmtree', 'Mountain', 'MountainSnow', 'Tent', 'Campfire', 'Backpack',
            'Luggage', 'Briefcase', 'Ticket', 'TicketCheck', 'Passport', 'Hotel', 'Building', 'Building2'
        ]
    },
    education: {
        name: 'Bildung & Wissen',
        emoji: '📚',
        icons: [
            'Book', 'BookOpen', 'BookMarked', 'BookCopy', 'Library', 'GraduationCap', 'School', 'Apple',
            'Pencil', 'Pen', 'PenTool', 'Highlighter', 'Eraser', 'Ruler', 'Triangle', 'Compass',
            'Calculator', 'Sigma', 'PlusSquare', 'MinusSquare', 'DivideSquare', 'PercentSquare',
            'Brain', 'Lightbulb', 'Sparkles', 'Target', 'Goal', 'Trophy', 'Medal', 'Award',
            'Star', 'Stars', 'Crown', 'Flame', 'Rocket', 'Telescope', 'Microscope', 'Flask', 'TestTube'
        ]
    },
    social: {
        name: 'Sozial & Kommunity',
        emoji: '👥',
        icons: [
            'Users', 'Users2', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'User', 'UserCircle',
            'UserCog', 'UserSquare', 'Contact', 'Contact2', 'Handshake', 'HeartHandshake', 'Heart',
            'MessageCircle', 'MessageSquare', 'MessagesSquare', 'Mail', 'MailOpen', 'Inbox', 'Send',
            'Share', 'Share2', 'Forward', 'Reply', 'ReplyAll', 'AtSign', 'Hash', 'Link',
            'Globe', 'Globe2', 'Earth', 'Smile', 'Laugh', 'Frown', 'Meh', 'ThumbsUp', 'ThumbsDown'
        ]
    }
}

// Quick color presets for fast selection
const QUICK_COLORS = [
    '#FFFFFF', '#000000', '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#D4AF37'
]

const EXPORT_SIZE = 512

export function IconEditor({ isOpen, onClose, onSave, backgroundColor = '#000000', businessType = '' }: IconEditorProps) {
    const [activeTab, setActiveTab] = useState<'icons' | 'logo' | 'ai'>('icons')
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof ICON_CATEGORIES>('food')
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Advanced customization controls
    const [iconColor, setIconColor] = useState('#FFFFFF')
    const [bgColor, setBgColor] = useState(backgroundColor)
    const [bgOpacity, setBgOpacity] = useState(100)  // 0-100 for transparency
    const [iconSize, setIconSize] = useState(60)  // Percentage of canvas
    const [strokeWidth, setStrokeWidth] = useState(2)  // SVG stroke width
    const [rotation, setRotation] = useState(0)  // Degrees
    const [flipH, setFlipH] = useState(false)
    const [flipV, setFlipV] = useState(false)

    // Preview canvas
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)

    // Logo editor state
    const [logoImage, setLogoImage] = useState<string | null>(null)
    const [logoImageEl, setLogoImageEl] = useState<HTMLImageElement | null>(null)
    const [logoScale, setLogoScale] = useState(0.7)
    const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
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

    // Draw preview on canvas - renders actual Lucide icons
    const drawPreview = useCallback(() => {
        const canvas = previewCanvasRef.current
        if (!canvas || !selectedIcon) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = canvas.width
        const iconSizePixels = (size * iconSize) / 100
        const padding = (size - iconSizePixels) / 2

        // Draw background
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, size, size)

        // Create a temporary container to render the React icon
        const tempContainer = document.createElement('div')
        tempContainer.style.cssText = 'position:absolute;top:-9999px;left:-9999px;'
        document.body.appendChild(tempContainer)

        // Import ReactDOMServer dynamically and render icon
        import('react-dom/client').then(({ createRoot }) => {
            import('react').then((React) => {
                const IconComponent = getIconComponent(selectedIcon)
                if (!IconComponent) {
                    document.body.removeChild(tempContainer)
                    return
                }

                // Create the icon element
                const iconElement = React.createElement(IconComponent, {
                    size: 24,
                    color: iconColor,
                    strokeWidth: strokeWidth
                })

                // Render to get SVG
                const root = createRoot(tempContainer)
                root.render(iconElement)

                // Wait for render then extract SVG
                setTimeout(() => {
                    const svgElement = tempContainer.querySelector('svg')
                    if (svgElement) {
                        // Clone and modify the SVG
                        const svgClone = svgElement.cloneNode(true) as SVGElement
                        svgClone.setAttribute('width', String(iconSizePixels))
                        svgClone.setAttribute('height', String(iconSizePixels))
                        svgClone.setAttribute('stroke', iconColor)
                        svgClone.setAttribute('stroke-width', String(strokeWidth))

                        // Convert SVG to data URL
                        const svgString = new XMLSerializer().serializeToString(svgClone)
                        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
                        const url = URL.createObjectURL(svgBlob)

                        const img = new Image()
                        img.onload = () => {
                            // Clear and redraw background
                            ctx.fillStyle = bgColor
                            ctx.fillRect(0, 0, size, size)

                            // Apply transformations
                            ctx.save()
                            ctx.translate(size / 2, size / 2)
                            ctx.rotate((rotation * Math.PI) / 180)
                            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
                            ctx.translate(-size / 2, -size / 2)

                            // Draw the icon
                            ctx.drawImage(img, padding, padding, iconSizePixels, iconSizePixels)

                            ctx.restore()
                            URL.revokeObjectURL(url)
                        }
                        img.onerror = () => {
                            URL.revokeObjectURL(url)
                            // Fallback: draw a simple placeholder
                            ctx.strokeStyle = iconColor
                            ctx.lineWidth = strokeWidth * (iconSizePixels / 24)
                            ctx.beginPath()
                            ctx.arc(size / 2, size / 2, iconSizePixels / 3, 0, Math.PI * 2)
                            ctx.stroke()
                        }
                        img.src = url
                    }

                    // Cleanup
                    root.unmount()
                    document.body.removeChild(tempContainer)
                }, 10)
            })
        })

    }, [selectedIcon, bgColor, iconColor, iconSize, strokeWidth, rotation, flipH, flipV, getIconComponent])

    // Redraw preview when settings change
    useEffect(() => {
        if (selectedIcon) {
            drawPreview()
        }
    }, [selectedIcon, bgColor, iconColor, iconSize, strokeWidth, rotation, flipH, flipV, drawPreview])

    // Logo handlers
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

    // Draw logo preview
    const drawLogoPreview = useCallback(() => {
        const canvas = previewCanvasRef.current
        if (!canvas || !logoImageEl) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = canvas.width

        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, size, size)

        const imgAspect = logoImageEl.width / logoImageEl.height
        let drawWidth, drawHeight

        if (imgAspect > 1) {
            drawWidth = size * logoScale
            drawHeight = drawWidth / imgAspect
        } else {
            drawHeight = size * logoScale
            drawWidth = drawHeight * imgAspect
        }

        const x = (size - drawWidth) / 2 + logoPosition.x
        const y = (size - drawHeight) / 2 + logoPosition.y

        ctx.drawImage(logoImageEl, x, y, drawWidth, drawHeight)
    }, [logoImageEl, logoScale, logoPosition, bgColor])

    useEffect(() => {
        if (logoImageEl && activeTab === 'logo') {
            drawLogoPreview()
        }
    }, [logoImageEl, logoScale, logoPosition, bgColor, activeTab, drawLogoPreview])

    // Drag handlers for logo
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

    // Generate final icon
    const generateFinalIcon = useCallback(() => {
        const canvas = document.createElement('canvas')
        canvas.width = EXPORT_SIZE
        canvas.height = EXPORT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        // Draw background
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

        if (activeTab === 'logo' && logoImageEl) {
            const scaleFactor = EXPORT_SIZE / 256
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
        } else if (activeTab === 'icons' && selectedIcon) {
            // Apply transformations
            ctx.save()
            ctx.translate(EXPORT_SIZE / 2, EXPORT_SIZE / 2)
            ctx.rotate((rotation * Math.PI) / 180)
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
            ctx.translate(-EXPORT_SIZE / 2, -EXPORT_SIZE / 2)

            // Draw icon
            const iconSizePixels = (EXPORT_SIZE * iconSize) / 100
            ctx.strokeStyle = iconColor
            ctx.lineWidth = strokeWidth * (iconSizePixels / 24)
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            const centerX = EXPORT_SIZE / 2
            const centerY = EXPORT_SIZE / 2
            const radius = iconSizePixels / 3

            // Draw shape based on category
            ctx.beginPath()
            if (selectedCategory === 'food') {
                ctx.moveTo(centerX - radius, centerY - radius * 0.3)
                ctx.lineTo(centerX - radius * 0.8, centerY + radius)
                ctx.lineTo(centerX + radius * 0.8, centerY + radius)
                ctx.lineTo(centerX + radius, centerY - radius * 0.3)
                ctx.closePath()
                ctx.moveTo(centerX + radius, centerY)
                ctx.quadraticCurveTo(centerX + radius * 1.4, centerY + radius * 0.3, centerX + radius, centerY + radius * 0.6)
            } else if (selectedCategory === 'beauty') {
                ctx.arc(centerX - radius * 0.4, centerY + radius * 0.4, radius * 0.35, 0, Math.PI * 2)
                ctx.moveTo(centerX + radius * 0.75, centerY + radius * 0.4)
                ctx.arc(centerX + radius * 0.4, centerY + radius * 0.4, radius * 0.35, 0, Math.PI * 2)
                ctx.moveTo(centerX - radius * 0.2, centerY + radius * 0.15)
                ctx.lineTo(centerX + radius * 0.5, centerY - radius * 0.9)
                ctx.moveTo(centerX + radius * 0.2, centerY + radius * 0.15)
                ctx.lineTo(centerX - radius * 0.5, centerY - radius * 0.9)
            } else if (selectedCategory === 'fitness') {
                ctx.moveTo(centerX - radius * 1.1, centerY)
                ctx.lineTo(centerX + radius * 1.1, centerY)
                ctx.moveTo(centerX - radius, centerY - radius * 0.5)
                ctx.lineTo(centerX - radius, centerY + radius * 0.5)
                ctx.moveTo(centerX + radius, centerY - radius * 0.5)
                ctx.lineTo(centerX + radius, centerY + radius * 0.5)
            } else if (selectedCategory === 'retail') {
                ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.3)
                ctx.lineTo(centerX - radius * 0.9, centerY + radius)
                ctx.lineTo(centerX + radius * 0.9, centerY + radius)
                ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.3)
                ctx.closePath()
                ctx.moveTo(centerX - radius * 0.4, centerY - radius * 0.3)
                ctx.quadraticCurveTo(centerX - radius * 0.4, centerY - radius, centerX, centerY - radius)
                ctx.quadraticCurveTo(centerX + radius * 0.4, centerY - radius, centerX + radius * 0.4, centerY - radius * 0.3)
            } else {
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                ctx.moveTo(centerX - radius * 0.5, centerY)
                ctx.lineTo(centerX + radius * 0.5, centerY)
                ctx.moveTo(centerX, centerY - radius * 0.5)
                ctx.lineTo(centerX, centerY + radius * 0.5)
            }
            ctx.stroke()
            ctx.restore()
        }

        return canvas.toDataURL('image/png')
    }, [activeTab, logoImageEl, logoScale, logoPosition, bgColor, selectedIcon, iconColor, iconSize, strokeWidth, rotation, flipH, flipV, selectedCategory])

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

        if (activeTab === 'ai' && aiResult) {
            // Composite AI image over user's background color
            const canvas = document.createElement('canvas')
            canvas.width = EXPORT_SIZE
            canvas.height = EXPORT_SIZE
            const ctx = canvas.getContext('2d')
            if (ctx) {
                // Draw background
                ctx.fillStyle = bgColor
                ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

                // Load and draw AI image on top
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.onload = async () => {
                    ctx.drawImage(img, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
                    const composited = canvas.toDataURL('image/png')

                    // Upload composited image
                    try {
                        const response = await fetch('/api/design/generate-icon', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageData: composited, uploadOnly: true })
                        })
                        const data = await response.json()
                        if (data.iconUrl) {
                            onSave(data.iconUrl)
                        } else {
                            onSave(composited)
                        }
                    } catch {
                        onSave(composited)
                    }
                    onClose()
                }
                img.onerror = () => {
                    // Fallback: just save original
                    onSave(aiResult)
                    onClose()
                }
                img.src = aiResult
                return
            }
            onSave(aiResult)
            onClose()
            return
        }

        iconDataUrl = generateFinalIcon()

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

    // Reset to defaults
    const resetSettings = () => {
        setIconSize(60)
        setStrokeWidth(2)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-5xl mx-4 overflow-hidden border border-white/10 shadow-2xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <h2 className="text-lg font-semibold text-white">🎨 Icon Editor Pro</h2>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 shrink-0">
                    <button
                        onClick={() => setActiveTab('icons')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'icons' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        🎯 Icon Bibliothek
                    </button>
                    <button
                        onClick={() => setActiveTab('logo')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'logo' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        📤 Logo hochladen
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ai' ? 'text-white bg-white/5 border-b-2 border-green-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        🤖 AI generieren
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Icons Tab */}
                    {activeTab === 'icons' && (
                        <>
                            {/* Left: Categories */}
                            <div className="w-44 border-r border-white/10 p-3 overflow-y-auto shrink-0">
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
                                <div className="grid grid-cols-6 gap-2">
                                    {filteredIcons.map((iconName) => {
                                        const IconComponent = getIconComponent(iconName)
                                        if (!IconComponent) return null

                                        return (
                                            <button
                                                key={iconName}
                                                onClick={() => setSelectedIcon(iconName)}
                                                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${selectedIcon === iconName
                                                    ? 'bg-green-500/20 ring-2 ring-green-500 scale-105'
                                                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                                    }`}
                                                title={iconName}
                                            >
                                                <IconComponent
                                                    size={28}
                                                    className="transition-colors"
                                                    style={{ color: selectedIcon === iconName ? '#22C55E' : '#A1A1AA' }}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Right: Controls & Preview */}
                            <div className="w-80 border-l border-white/10 p-4 overflow-y-auto shrink-0 space-y-5">
                                {/* Preview */}
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Live-Vorschau</p>
                                    <div className="flex justify-center">
                                        <canvas
                                            ref={previewCanvasRef}
                                            width={200}
                                            height={200}
                                            className="rounded-xl border-2 border-white/20"
                                            style={{ backgroundColor: bgColor }}
                                        />
                                    </div>
                                    {selectedIcon && (
                                        <p className="text-xs text-zinc-400 text-center mt-2">{selectedIcon}</p>
                                    )}
                                </div>

                                {/* Icon Color with Full Picker */}
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Icon-Farbe</p>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20 shrink-0">
                                            <input
                                                type="color"
                                                value={iconColor}
                                                onChange={(e) => setIconColor(e.target.value)}
                                                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                            />
                                            <div className="w-full h-full" style={{ backgroundColor: iconColor }} />
                                        </div>
                                        <input
                                            type="text"
                                            value={iconColor}
                                            onChange={(e) => setIconColor(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono"
                                        />
                                    </div>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {QUICK_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setIconColor(color)}
                                                className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${iconColor === color ? 'border-green-500 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Background Color with Full Picker */}
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Hintergrund</p>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20 shrink-0">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                            />
                                            <div className="w-full h-full" style={{ backgroundColor: bgColor }} />
                                        </div>
                                        <input
                                            type="text"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono"
                                        />
                                    </div>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {QUICK_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setBgColor(color)}
                                                className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${bgColor === color ? 'border-green-500 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Background Opacity Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Transparenz</p>
                                        <span className="text-xs text-white font-mono">{bgOpacity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={bgOpacity}
                                        onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                                        className="w-full accent-green-500"
                                    />
                                    <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                                        <span>Transparent</span>
                                        <span>Solid</span>
                                    </div>
                                </div>

                                {/* Icon Size Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Icon-Größe</p>
                                        <span className="text-xs text-white font-mono">{iconSize}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="20"
                                        max="90"
                                        value={iconSize}
                                        onChange={(e) => setIconSize(parseInt(e.target.value))}
                                        className="w-full accent-green-500"
                                    />
                                </div>

                                {/* Stroke Width Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Linienstärke</p>
                                        <span className="text-xs text-white font-mono">{strokeWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="4"
                                        step="0.5"
                                        value={strokeWidth}
                                        onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                                        className="w-full accent-green-500"
                                    />
                                </div>

                                {/* Rotation */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Rotation</p>
                                        <span className="text-xs text-white font-mono">{rotation}°</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={rotation}
                                            onChange={(e) => setRotation(parseInt(e.target.value))}
                                            className="flex-1 accent-green-500"
                                        />
                                        <button
                                            onClick={() => setRotation((r) => (r + 90) % 360)}
                                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                                            title="90° drehen"
                                        >
                                            <RotateCw size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Flip Controls */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFlipH(!flipH)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 ${flipH ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-zinc-400 border border-white/10'}`}
                                    >
                                        <FlipHorizontal size={16} />
                                        Horizontal
                                    </button>
                                    <button
                                        onClick={() => setFlipV(!flipV)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 ${flipV ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-zinc-400 border border-white/10'}`}
                                    >
                                        <FlipVertical size={16} />
                                        Vertikal
                                    </button>
                                </div>

                                {/* Reset */}
                                <button
                                    onClick={resetSettings}
                                    className="w-full py-2 text-xs text-zinc-500 hover:text-white flex items-center justify-center gap-1"
                                >
                                    <RotateCcw size={12} />
                                    Zurücksetzen
                                </button>
                            </div>
                        </>
                    )}

                    {/* Logo Tab */}
                    {activeTab === 'logo' && (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-lg mx-auto space-y-4">
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
                                                width={256}
                                                height={256}
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
                                                className="w-40 accent-green-500"
                                            />
                                            <button onClick={() => setLogoScale(s => Math.min(2, s + 0.1))} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                <ZoomIn size={18} />
                                            </button>
                                            <button onClick={() => { setLogoPosition({ x: 0, y: 0 }); setLogoScale(0.7) }} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
                                                <RotateCcw size={18} />
                                            </button>
                                        </div>

                                        {/* Background Color */}
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Hintergrund</p>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-white/20 shrink-0">
                                                    <input
                                                        type="color"
                                                        value={bgColor}
                                                        onChange={(e) => setBgColor(e.target.value)}
                                                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                                    />
                                                    <div className="w-full h-full" style={{ backgroundColor: bgColor }} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={bgColor}
                                                    onChange={(e) => setBgColor(e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono"
                                                />
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
                                    <div className="space-y-4">
                                        {/* Preview with background removal */}
                                        <div className="p-4 bg-zinc-800/50 border border-white/10 rounded-xl">
                                            <p className="text-xs text-zinc-400 mb-3">Vorschau (mit deiner Hintergrundfarbe):</p>
                                            <div className="flex justify-center">
                                                <div
                                                    className="w-32 h-32 rounded-xl flex items-center justify-center overflow-hidden border-2 border-white/20"
                                                    style={{ backgroundColor: bgColor }}
                                                >
                                                    <img
                                                        src={aiResult}
                                                        alt="Generated Icon"
                                                        className="w-full h-full object-contain"
                                                        style={{ mixBlendMode: 'normal' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background Color Picker for AI */}
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Hintergrundfarbe wählen</p>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-white/20 shrink-0">
                                                    <input
                                                        type="color"
                                                        value={bgColor}
                                                        onChange={(e) => setBgColor(e.target.value)}
                                                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                                    />
                                                    <div className="w-full h-full" style={{ backgroundColor: bgColor }} />
                                                </div>
                                                <div className="flex gap-1 flex-wrap flex-1">
                                                    {QUICK_COLORS.slice(0, 8).map((color) => (
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

                                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                                            <p className="text-sm text-white">Icon generiert! Wähle deine Farbe und klicke "Speichern"</p>
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
