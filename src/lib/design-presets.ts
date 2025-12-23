export interface DesignPreset {
    id: string
    name: string
    description: string
    icon: string // Emoji

    // Core Config
    backgroundColor: string
    labelColor: string
    foregroundColor: string

    // Context Defaults
    logoText: string
    headerLabel: string
    headerValue: string
    primaryLabel: string
    primaryValue: string
    secLabel1: string
    secValue1: string
    secLabel2: string
    secValue2: string

    // Mock Assets (We use placeholders until real storage)
    iconUrl?: string
    stripImageUrl?: string
}

export const PRESETS: DesignPreset[] = [
    {
        id: 'cafe',
        name: 'The Café',
        description: 'Perfekt für Cafés & Bäckereien. Warme Töne.',
        icon: '☕️',
        backgroundColor: '#4B3621', // Dark Coffee Brown
        labelColor: '#D2B48C', // Tan
        foregroundColor: '#FFFFFF',
        logoText: 'Mein Café',
        headerLabel: 'GUTHABEN',
        headerValue: '0 €',
        primaryLabel: 'TREUEKARTE',
        primaryValue: '☕️ ☕️ ⚪️ ⚪️ ⚪️', // Stamp Simulation
        secLabel1: 'STATUS',
        secValue1: 'Stammgast',
        secLabel2: 'NÄCHSTE PRÄMIE',
        secValue2: '1x Cappuccino'
    },
    {
        id: 'burger',
        name: 'The Burger',
        description: 'Laut, lecker, rot. Für Fast Food & Dining.',
        icon: '🍔',
        backgroundColor: '#E31C25', // Burger Red
        labelColor: '#FFC72C', // Cheese Yellow
        foregroundColor: '#FFFFFF',
        logoText: 'Burger King',
        headerLabel: 'POINTS',
        headerValue: '450',
        primaryLabel: 'LEVEL',
        primaryValue: 'WHOPPER PRO',
        secLabel1: 'STATUS',
        secValue1: 'Hungrig',
        secLabel2: 'GUTSCHEINE',
        secValue2: '3 Verfügbar'
    },
    {
        id: 'barber',
        name: 'The Barber',
        description: 'Clean, schwarz, elegant. Für Friseure & Gyms.',
        icon: '💈',
        backgroundColor: '#000000', // Pitch Black
        labelColor: '#808080', // Gray
        foregroundColor: '#FFFFFF',
        logoText: 'Gentlemen Cut',
        headerLabel: 'TERMIN',
        headerValue: 'Heute',
        primaryLabel: 'MITGLIED',
        primaryValue: 'PLATINUM',
        secLabel1: 'SEIT',
        secValue1: '2024',
        secLabel2: 'SERVICE',
        secValue2: 'Volles Programm'
    }
]
