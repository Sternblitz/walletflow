'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Type, Palette, Layout, ChevronDown, ChevronUp, Apple, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { OnboardingPreview } from '@/components/admin/OnboardingPreview'
import { OnboardingFieldEditor, DEFAULT_FIELDS } from '@/components/admin/OnboardingFieldEditor'
import { OnboardingColorEditor } from '@/components/admin/OnboardingColorEditor'

interface Step5OnboardingProps {
    data: any
    update: (data: any) => void
}

export function Step5Onboarding({ data, update }: Step5OnboardingProps) {
    // Content State
    const [content, setContent] = useState({
        title: data.onboardingConfig?.title || data.clientName || '',
        description: data.onboardingConfig?.description || 'Personalisiere deine Karte',
    })

    // Fields State
    const [fields, setFields] = useState(
        data.onboardingConfig?.fields || DEFAULT_FIELDS
    )

    // Colors State
    const [colors, setColors] = useState({
        bgColor: data.onboardingConfig?.colors?.bgColor || '#0A0A0A',
        fgColor: data.onboardingConfig?.colors?.fgColor || '#FFFFFF',
        accentColor: data.onboardingConfig?.colors?.accentColor || '#8B5CF6',
        formBgColor: data.onboardingConfig?.colors?.formBgColor || '#FFFFFF',
        formTextColor: data.onboardingConfig?.colors?.formTextColor || '#1F2937',
    })

    // UI State
    const [activeSection, setActiveSection] = useState<'content' | 'fields' | 'colors'>('fields')
    const [previewPlatform, setPreviewPlatform] = useState<'ios' | 'android'>('ios')

    // Sync to parent
    useEffect(() => {
        update({
            onboardingConfig: {
                title: content.title,
                description: content.description,
                fields,
                colors,
            }
        })
    }, [content, fields, colors, update])

    // Build preview config from current state
    const previewConfig = {
        clientName: data.clientName || 'Mein Shop',
        logoUrl: data.designConfig?.iconUrl || null,
        ...colors,
        title: content.title,
        description: content.description,
        askName: fields.find((f: any) => f.id === 'name')?.enabled || false,
        nameRequired: fields.find((f: any) => f.id === 'name')?.required || false,
        namePlaceholder: fields.find((f: any) => f.id === 'name')?.placeholder || 'Max Mustermann',
        askBirthday: fields.find((f: any) => f.id === 'birthday')?.enabled || false,
        birthdayRequired: fields.find((f: any) => f.id === 'birthday')?.required || false,
        askEmail: fields.find((f: any) => f.id === 'email')?.enabled || false,
        emailRequired: fields.find((f: any) => f.id === 'email')?.required || false,
        emailPlaceholder: fields.find((f: any) => f.id === 'email')?.placeholder || 'max@beispiel.de',
        askPhone: fields.find((f: any) => f.id === 'phone')?.enabled || false,
        phoneRequired: fields.find((f: any) => f.id === 'phone')?.required || false,
        phonePlaceholder: fields.find((f: any) => f.id === 'phone')?.placeholder || '+49 123 456789',
        platform: previewPlatform,
    }

    const sections = [
        { id: 'fields', label: 'Felder', icon: Layout, description: 'Welche Daten abfragen' },
        { id: 'colors', label: 'Design', icon: Palette, description: 'Farben & Stil' },
        { id: 'content', label: 'Texte', icon: Type, description: 'Titel & Beschreibung' },
    ] as const

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[600px]">
            {/* === LEFT: EDITOR === */}
            <div className="space-y-4">
                {/* Section Tabs */}
                <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/50 border border-white/5">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                                activeSection === section.id
                                    ? "bg-white/10 text-white"
                                    : "text-white/50 hover:text-white/70"
                            )}
                        >
                            <section.icon className="w-4 h-4" />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Section Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5"
                    >
                        {activeSection === 'fields' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <Layout className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">Formular-Felder</h3>
                                        <p className="text-[10px] text-white/40">Drag & Drop zum Sortieren</p>
                                    </div>
                                </div>
                                <OnboardingFieldEditor
                                    fields={fields}
                                    onChange={setFields}
                                />
                            </div>
                        )}

                        {activeSection === 'colors' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                        <Palette className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">Farben & Design</h3>
                                        <p className="text-[10px] text-white/40">Passe alle Farben an</p>
                                    </div>
                                </div>
                                <OnboardingColorEditor
                                    colors={colors}
                                    onChange={setColors}
                                />
                            </div>
                        )}

                        {activeSection === 'content' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                        <Type className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">Texte & Inhalte</h3>
                                        <p className="text-[10px] text-white/40">Titel und Beschreibung</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-white/60">Seitentitel</Label>
                                        <Input
                                            value={content.title}
                                            onChange={(e) => setContent(c => ({ ...c, title: e.target.value }))}
                                            placeholder={data.clientName || 'Shop Name'}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-white/60">Beschreibung</Label>
                                        <Input
                                            value={content.description}
                                            onChange={(e) => setContent(c => ({ ...c, description: e.target.value }))}
                                            placeholder="Personalisiere deine Karte"
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* === RIGHT: LIVE PREVIEW === */}
            <div className="relative">
                <div className="sticky top-6 space-y-4">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-white/40" />
                            <span className="text-xs text-white/40 font-medium">Live Vorschau</span>
                        </div>
                        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                            <button
                                onClick={() => setPreviewPlatform('ios')}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all",
                                    previewPlatform === 'ios'
                                        ? "bg-white/10 text-white"
                                        : "text-white/40 hover:text-white/60"
                                )}
                            >
                                <Apple className="w-3 h-3" />
                                iOS
                            </button>
                            <button
                                onClick={() => setPreviewPlatform('android')}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all",
                                    previewPlatform === 'android'
                                        ? "bg-white/10 text-white"
                                        : "text-white/40 hover:text-white/60"
                                )}
                            >
                                <Globe className="w-3 h-3" />
                                Android
                            </button>
                        </div>
                    </div>

                    {/* Preview Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-black border border-white/5 min-h-[580px]"
                    >
                        <OnboardingPreview config={previewConfig} />
                    </motion.div>

                    {/* Info */}
                    <div className="flex items-center justify-center gap-4 text-[10px] text-white/30">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Änderungen werden live angezeigt</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
