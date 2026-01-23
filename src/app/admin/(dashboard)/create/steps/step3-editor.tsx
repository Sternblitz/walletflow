"use client"

import { useState, useEffect, useCallback } from "react"
import { WalletPassDraft } from "@/lib/wallet/types"
import { createDraftFromTemplate, PASS_TEMPLATES } from "@/lib/wallet/layout-definitions"
import { PassPreview } from "@/components/wallet/pass-preview"
import { ColorsEditor } from "@/components/wallet/colors-editor"
import { FieldsEditor } from "@/components/wallet/fields-editor"
import { ImagesEditor } from "@/components/wallet/images-editor"
import { Palette, Type, Image as ImageIcon, Sparkles } from "lucide-react"

interface Step3EditorProps {
    data: any
    update: (data: any) => void
}

// Map concept types to templates
const CONCEPT_TEMPLATE_MAP: Record<string, string> = {
    'STAMP_CARD': 'stempelkarte',
    'STAMP_CARD_V2': 'stempelkarte_v2',
    'MEMBER_CARD': 'mitgliederkarte',
    'POINTS_CARD': 'punktekarte',
    'COUPON': 'gutschein',
    'CUSTOM': 'stempelkarte_flex'
}

type EditorTab = 'colors' | 'fields' | 'images'

export function Step3DesignV2({ data, update }: Step3EditorProps) {
    const [draft, setDraft] = useState<WalletPassDraft | null>(null)
    const [activeTab, setActiveTab] = useState<EditorTab>('colors')

    // Initialize draft based on selected concept
    useEffect(() => {
        if (!draft) {
            const templateId = CONCEPT_TEMPLATE_MAP[data.concept] || 'stempelkarte'
            const newDraft = createDraftFromTemplate(templateId)

            if (newDraft) {
                if (data.clientName) {
                    newDraft.content.organizationName = data.clientName
                    newDraft.content.logoText = data.clientName
                }

                setDraft(newDraft)
                update({ designConfig: newDraft }) // Sync immediately so parent has data even without edits
            }
        }
    }, [data.concept, data.clientName, draft, update])

    // Sync draft changes to parent form
    const handleDraftChange = useCallback((newDraft: WalletPassDraft) => {
        setDraft(newDraft)
        update({ designConfig: newDraft })
    }, [update])

    if (!draft) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    const tabs: { id: EditorTab; label: string; icon: typeof Palette }[] = [
        { id: 'colors', label: 'Farben', icon: Palette },
        { id: 'fields', label: 'Inhalte', icon: Type },
        { id: 'images', label: 'Bilder', icon: ImageIcon }
    ]

    return (
        <div className="step3-editor">
            <div className="editor-header">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2>Pass Designer</h2>
                <p>Passe deine Karte an</p>
            </div>

            <div className="editor-layout">
                {/* Left: Preview */}
                <div className="preview-column">
                    <PassPreview draft={draft} scale={0.85} />
                </div>

                {/* Right: Editor */}
                <div className="editor-column">
                    {/* Tabs */}
                    <div className="tab-bar">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    className={`tab-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'colors' && (
                            <ColorsEditor draft={draft} onChange={handleDraftChange} />
                        )}
                        {activeTab === 'fields' && (
                            <FieldsEditor draft={draft} onChange={handleDraftChange} />
                        )}
                        {activeTab === 'images' && (
                            <ImagesEditor draft={draft} onChange={handleDraftChange} />
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .step3-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .editor-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .editor-header h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #fff;
                }

                .editor-header p {
                    color: #666;
                    font-size: 0.9rem;
                    margin-left: auto;
                }

                .editor-layout {
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    gap: 2rem;
                    min-height: 500px;
                }

                .preview-column {
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding: 1rem;
                    background: #0a0a0a;
                    border-radius: 16px;
                    border: 1px solid #222;
                }

                .editor-column {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .tab-bar {
                    display: flex;
                    gap: 0.5rem;
                    padding: 4px;
                    background: #111;
                    border-radius: 12px;
                }

                .tab-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 10px 16px;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    color: #666;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab-btn:hover {
                    color: #999;
                }

                .tab-btn.active {
                    background: #1a1a1a;
                    color: #fff;
                }

                .tab-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    background: #0a0a0a;
                    border-radius: 12px;
                    border: 1px solid #222;
                }

                @media (max-width: 768px) {
                    .editor-layout {
                        grid-template-columns: 1fr;
                    }

                    .preview-column {
                        order: -1;
                    }
                }
            `}</style>
        </div>
    )
}
