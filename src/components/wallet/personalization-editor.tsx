'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { User, Cake, Mail, Phone, AlertCircle } from 'lucide-react'

export interface PersonalizationConfig {
    enabled: boolean
    ask_name: boolean
    name_required: boolean
    ask_birthday: boolean
    birthday_required: boolean
    ask_email: boolean
    email_required: boolean
    ask_phone: boolean
    phone_required: boolean
    allow_skip: boolean
    onboarding_title?: string
    onboarding_description?: string
    // Design Overrides
    design_bg?: string
    design_text?: string
    design_accent?: string
    design_border?: string
    design_form_bg?: string
}

export interface BrandingConfig {
    logoUrl?: string
    colors?: {
        backgroundColor: string
        foregroundColor: string
        labelColor: string
    }
}

const defaultConfig: PersonalizationConfig = {
    enabled: false,
    ask_name: false,
    name_required: false,
    ask_birthday: false,
    birthday_required: false,
    ask_email: false,
    email_required: false,
    ask_phone: false,
    phone_required: false,
    allow_skip: true
}

interface PersonalizationEditorProps {
    config: Partial<PersonalizationConfig>
    onChange: (config: PersonalizationConfig) => void
    branding?: BrandingConfig
}

// Simple Toggle component without Radix
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${checked ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
        >
            <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
            />
        </button>
    )
}

import { Eye, X } from 'lucide-react'

export function PersonalizationEditor({ config, onChange, branding }: PersonalizationEditorProps) {
    const current: PersonalizationConfig = { ...defaultConfig, ...config }
    const [showPreview, setShowPreview] = useState(false)

    const update = (patch: Partial<PersonalizationConfig>) => {
        const newConfig = { ...current, ...patch }

        // Logic: 
        // 1. If we are explicitly changing 'enabled', respect that.
        // 2. If we are enabling a field (ask_name, etc), auto-enable the master toggle.
        // 3. We NO NOT auto-disable anymore, because that prevents the user from turning it on to see the options.

        if (patch.ask_name || patch.ask_birthday || patch.ask_email || patch.ask_phone) {
            newConfig.enabled = true
        }

        onChange(newConfig)
    }

    const hasAnyField = current.ask_name || current.ask_birthday || current.ask_email || current.ask_phone

    // Helper for color logic
    const getColors = () => ({
        bg: current.design_bg || branding?.colors?.backgroundColor || '#000000',
        text: current.design_text || branding?.colors?.foregroundColor || '#FFFFFF',
        accent: current.design_accent || branding?.colors?.labelColor || '#3b82f6',
        border: current.design_border || branding?.colors?.labelColor || '#3b82f6',
    })

    return (
        <div className="space-y-6">
            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm bg-zinc-900 rounded-[48px] border border-white/10 shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <OnboardingPreview config={current} branding={branding} />
                    </div>
                </div>
            )}

            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <User className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                        <Label className="text-white font-medium">Kundendaten erfassen</Label>
                        <p className="text-xs text-zinc-500">Vor dem Download abfragen</p>
                    </div>
                </div>
                <Toggle
                    checked={current.enabled}
                    onChange={(enabled) => update({ enabled })}
                />
            </div>

            {/* Info when disabled */}
            {!current.enabled && (
                <div className="flex items-start gap-3 p-3 bg-zinc-900/50 border border-white/5 rounded-lg text-xs text-zinc-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>QR-Code führt direkt zum Pass-Download (iOS/Android automatisch erkannt).</span>
                </div>
            )}

            {/* Field Toggles - Only show when enabled */}
            {current.enabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">

                    {/* Design Texts */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-white font-medium">Onboarding Design</Label>

                            {/* Preview Button */}
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 transition-colors"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Vorschau
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">Überschrift</Label>
                                <input
                                    type="text"
                                    value={current.onboarding_title || ''}
                                    placeholder="Deine digitale Treuekarte"
                                    onChange={(e) => update({ onboarding_title: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">Beschreibung</Label>
                                <input
                                    type="text"
                                    value={current.onboarding_description || ''}
                                    placeholder="Registriere dich um Punkte zu sammeln"
                                    onChange={(e) => update({ onboarding_description: e.target.value })}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                        </div>

                        {/* Color Customization */}
                        <div className="pt-2 border-t border-white/5 space-y-3">
                            <Label className="text-xs text-zinc-500 uppercase tracking-wider">Farben anpassen</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <ColorPicker
                                    label="Hintergrund (Seite)"
                                    value={current.design_bg || (branding?.colors?.backgroundColor || '#000000')}
                                    onChange={(v) => update({ design_bg: v })}
                                />
                                <ColorPicker
                                    label="Hintergrund (Form)"
                                    value={current.design_form_bg || current.design_bg || (branding?.colors?.backgroundColor || '#000000')}
                                    onChange={(v) => update({ design_form_bg: v })}
                                />
                                <ColorPicker
                                    label="Text"
                                    value={current.design_text || (branding?.colors?.foregroundColor || '#FFFFFF')}
                                    onChange={(v) => update({ design_text: v })}
                                />
                                <ColorPicker
                                    label="Akzent"
                                    value={current.design_accent || (branding?.colors?.labelColor || '#3b82f6')}
                                    onChange={(v) => update({ design_accent: v })}
                                />
                                <ColorPicker
                                    label="Rahmen/Effekt"
                                    value={current.design_border || (branding?.colors?.labelColor || '#3b82f6')}
                                    onChange={(v) => update({ design_border: v })}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Name */}
                    <FieldToggle
                        icon={<User className="w-4 h-4" />}
                        label="Name"
                        description="Vor- und Nachname"
                        checked={current.ask_name}
                        required={current.name_required}
                        onToggle={(v) => update({ ask_name: v, name_required: v ? current.name_required : false })}
                        onRequiredChange={(v) => update({ name_required: v })}
                    />

                    {/* Birthday */}
                    <FieldToggle
                        icon={<Cake className="w-4 h-4" />}
                        label="Geburtstag"
                        description="Für Geburtstagsaktionen"
                        checked={current.ask_birthday}
                        required={current.birthday_required}
                        onToggle={(v) => update({ ask_birthday: v, birthday_required: v ? current.birthday_required : false })}
                        onRequiredChange={(v) => update({ birthday_required: v })}
                    />

                    {/* Email */}
                    <FieldToggle
                        icon={<Mail className="w-4 h-4" />}
                        label="E-Mail"
                        description="Für Newsletter & Angebote"
                        checked={current.ask_email}
                        required={current.email_required}
                        onToggle={(v) => update({ ask_email: v, email_required: v ? current.email_required : false })}
                        onRequiredChange={(v) => update({ email_required: v })}
                    />

                    {/* Phone */}
                    <FieldToggle
                        icon={<Phone className="w-4 h-4" />}
                        label="Telefon"
                        description="Für WhatsApp Business"
                        checked={current.ask_phone}
                        required={current.phone_required}
                        onToggle={(v) => update({ ask_phone: v, phone_required: v ? current.phone_required : false })}
                        onRequiredChange={(v) => update({ phone_required: v })}
                    />

                    {/* Allow Skip */}
                    {hasAnyField && (
                        <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-lg mt-4">
                            <div>
                                <Label className="text-zinc-300 text-sm">Überspringen erlauben</Label>
                                <p className="text-xs text-zinc-500">Kunden können ohne Eingabe fortfahren</p>
                            </div>
                            <Toggle
                                checked={current.allow_skip}
                                onChange={(v) => update({ allow_skip: v })}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

interface FieldToggleProps {
    icon: React.ReactNode
    label: string
    description: string
    checked: boolean
    required: boolean
    onToggle: (value: boolean) => void
    onRequiredChange: (value: boolean) => void
}

function FieldToggle({ icon, label, description, checked, required, onToggle, onRequiredChange }: FieldToggleProps) {
    return (
        <div className={`p-3 rounded-xl border transition-all duration-200 ${checked
            ? 'bg-white/5 border-white/20'
            : 'bg-transparent border-white/5 opacity-60 hover:opacity-80'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${checked ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-zinc-500'}`}>
                        {icon}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-white">{label}</span>
                        <p className="text-xs text-zinc-500">{description}</p>
                    </div>
                </div>
                <Toggle checked={checked} onChange={onToggle} />
            </div>

            {/* Required toggle - only show when field is active */}
            {checked && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 animate-in fade-in duration-200">
                    <span className="text-xs text-zinc-400">Pflichtfeld</span>
                    <Toggle
                        checked={required}
                        onChange={onRequiredChange}
                    />
                </div>
            )}
        </div>
    )
}

function OnboardingPreview({ config, branding }: { config: PersonalizationConfig, branding?: BrandingConfig }) {
    // Prioritize manual design overrides, fallback to branding
    const bgColor = config.design_bg || branding?.colors?.backgroundColor || '#1A1A1A'
    const fgColor = config.design_text || branding?.colors?.foregroundColor || '#FFFFFF'
    const accentColor = config.design_accent || branding?.colors?.labelColor || '#888888'
    const borderColor = config.design_border || accentColor
    const logoUrl = branding?.logoUrl

    const title = config.onboarding_title || (config.ask_name ? 'Personalisiere deine Karte' : 'Deine digitale Treuekarte')

    return (
        <div
            className="w-full aspect-[9/19] rounded-[40px] overflow-hidden relative shadow-2xl flex flex-col items-center justify-center p-6 border-[8px] border-zinc-900"
            style={{ backgroundColor: bgColor, color: fgColor }}
        >


            <div className="relative z-10 w-full text-center space-y-6">
                {/* Logo */}
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-20 h-20 mx-auto rounded-xl shadow-lg object-cover" />
                ) : (
                    <div className="w-20 h-20 mx-auto rounded-xl shadow-lg bg-white/10 flex items-center justify-center text-2xl font-bold">
                        L
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-xl font-bold leading-tight" style={{ color: fgColor }}>{title}</h3>
                    {config.onboarding_description && (
                        <p className="text-xs opacity-70" style={{ color: fgColor }}>{config.onboarding_description}</p>
                    )}
                </div>

                <div className="relative p-4 rounded-3xl z-10" style={{ backgroundColor: config.design_form_bg || bgColor }}>
                    {/* Rotating Glow Border (Comet Style) */}
                    <div className="absolute -inset-[2px] z-[-1] rounded-3xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-[-50%] animate-[spin_4s_linear_infinite]"
                            style={{
                                background: `conic-gradient(from 0deg, transparent 0deg, ${borderColor} 60deg, transparent 120deg)`,
                                filter: 'blur(5px)',
                            }}
                        />
                    </div>
                    {/* Thin Sharp Border */}
                    <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/10" />

                    {/* Content */}
                    <div className="relative z-10 space-y-3 opacity-90">
                        {config.ask_name && (
                            <div className="h-10 rounded-lg border border-white/20 bg-black/10 w-full" />
                        )}
                        {config.ask_email && (
                            <div className="h-10 rounded-lg border border-white/20 bg-black/10 w-full" />
                        )}

                        <div
                            className="h-12 rounded-lg w-full flex items-center justify-center text-xs font-bold shadow-lg mt-4"
                            style={{ background: accentColor, color: fgColor, filter: 'brightness(1.1)' }}
                        >
                            Zu Apple Wallet
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    )
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="bg-black/20 rounded-lg p-2 flex items-center gap-2 border border-white/5">
            <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0 border border-white/10">
                <div className="absolute inset-0" style={{ backgroundColor: value }} />
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-zinc-400">{label}</span>
                <span className="text-xs font-mono text-zinc-300 truncate">{value}</span>
            </div>
        </div>
    )
}
