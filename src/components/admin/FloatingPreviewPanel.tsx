'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, Maximize2, Minimize2, Smartphone } from 'lucide-react'
import { WalletSimulator } from '@/components/wallet/wallet-simulator'
import { cn } from '@/lib/utils'

interface FloatingPreviewPanelProps {
    isOpen: boolean
    onClose: () => void
    config: {
        backgroundColor: string
        labelColor: string
        foregroundColor: string
        logoText: string
        hideLogoText?: boolean
        iconUrl: string
        stripImageUrl: string
        headerLabel: string
        headerValue: string
        primaryLabel: string
        primaryValue: string
        secLabel1: string
        secValue1: string
        secLabel2: string
        secValue2: string
        auxLabel1: string
        auxValue1: string
    }
    concept?: string
}

export function FloatingPreviewPanel({
    isOpen,
    onClose,
    config,
    concept = 'STAMP_CARD'
}: FloatingPreviewPanelProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            "fixed z-50 bg-zinc-950 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden",
                            isFullscreen
                                ? "inset-4 rounded-3xl"
                                : "right-4 top-20 bottom-4 w-[400px] rounded-2xl"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                    <Smartphone className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Live Vorschau</h3>
                                    <p className="text-[10px] text-white/40">1:1 Wallet Pass</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 flex items-center justify-center p-8 min-h-[500px] relative">
                            {/* Glow Effect */}
                            <div
                                className="absolute inset-0 opacity-30 blur-3xl"
                                style={{
                                    background: `radial-gradient(ellipse at center, ${config.backgroundColor}40, transparent 70%)`
                                }}
                            />

                            {/* Decorative Grid */}
                            <div
                                className="absolute inset-0 opacity-[0.02]"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                                    backgroundSize: '24px 24px'
                                }}
                            />

                            <motion.div
                                key={JSON.stringify(config)}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <WalletSimulator
                                    passType="storeCard"
                                    backgroundColor={config.backgroundColor}
                                    labelColor={config.labelColor}
                                    foregroundColor={config.foregroundColor}
                                    logoText={config.hideLogoText ? '' : config.logoText}
                                    iconUrl={config.iconUrl}
                                    stripImageUrl={config.stripImageUrl}
                                    headerLabel={config.headerLabel}
                                    headerValue={config.headerValue}
                                    primaryLabel={config.primaryLabel}
                                    primaryValue={config.primaryValue}
                                    secLabel1={config.secLabel1}
                                    secValue1={config.secValue1}
                                    secLabel2={config.secLabel2}
                                    secValue2={config.secValue2}
                                    auxLabel1={config.auxLabel1}
                                    auxValue1={config.auxValue1}
                                    showSafeZones={false}
                                />
                            </motion.div>
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 border-t border-white/10 bg-zinc-900/30">
                            <div className="flex items-center justify-center gap-4 text-[10px] text-white/40">
                                <div className="flex items-center gap-1.5">
                                    <Eye className="w-3 h-3" />
                                    <span>Aktualisiert live</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Änderungen werden sofort sichtbar</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// Toggle Button Component
export function PreviewToggleButton({ onClick, className }: { onClick: () => void; className?: string }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "fixed right-4 bottom-4 z-30 flex items-center gap-2 px-4 py-3 rounded-xl",
                "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm",
                "shadow-lg shadow-violet-500/25 border border-white/20",
                "hover:shadow-xl hover:shadow-violet-500/30 transition-all",
                className
            )}
        >
            <Eye className="w-4 h-4" />
            <span>Vorschau</span>
        </motion.button>
    )
}
