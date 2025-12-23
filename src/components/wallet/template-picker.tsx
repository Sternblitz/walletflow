'use client'

import { useState } from 'react'
import { WalletPassDraft, PassStyle } from '@/lib/wallet/types'
import { PASS_TEMPLATES, createDraftFromTemplate } from '@/lib/wallet/layout-definitions'
import { Stamp, Crown, Tag } from 'lucide-react'

interface TemplatePickerProps {
  onSelect: (draft: WalletPassDraft) => void
}

const TEMPLATE_CONFIG: Record<string, { icon: typeof Stamp; color: string; emoji: string }> = {
  'stempelkarte': { icon: Stamp, color: '#22C55E', emoji: '🎯' },
  'mitgliederkarte': { icon: Crown, color: '#D4AF37', emoji: '👑' },
  'gutschein': { icon: Tag, color: '#EF4444', emoji: '🎁' }
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelect = (templateId: string) => {
    setLoading(templateId)
    setTimeout(() => {
      const draft = createDraftFromTemplate(templateId)
      if (draft) onSelect(draft)
    }, 200)
  }

  return (
    <div className="picker">
      <div className="header">
        <h1>Was möchtest du erstellen?</h1>
        <p>Wähle eine Vorlage für deinen Wallet Pass</p>
      </div>

      <div className="templates">
        {PASS_TEMPLATES.map(template => {
          const config = TEMPLATE_CONFIG[template.id] || { icon: Stamp, color: '#888', emoji: '📱' }
          const Icon = config.icon
          const isLoading = loading === template.id

          return (
            <button
              key={template.id}
              className={`template ${isLoading ? 'loading' : ''}`}
              onClick={() => handleSelect(template.id)}
              disabled={!!loading}
              style={{ '--accent': config.color } as React.CSSProperties}
            >
              <div className="template-icon">
                <span className="emoji">{config.emoji}</span>
              </div>
              <div className="template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
              </div>
              <div className="template-arrow">→</div>

              {isLoading && (
                <div className="loading-overlay">
                  <div className="spinner" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <style jsx>{`
                .picker {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 3rem 2rem;
                }

                .header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .header h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 0.5rem;
                }

                .header p {
                    color: #666;
                    font-size: 1rem;
                }

                .templates {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .template {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 1.5rem;
                    background: #111;
                    border: 2px solid #222;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }

                .template:hover:not(:disabled) {
                    border-color: var(--accent);
                    transform: translateX(4px);
                }

                .template-icon {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
                    border: 2px solid #333;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .emoji {
                    font-size: 28px;
                }

                .template-info {
                    flex: 1;
                }

                .template-info h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #fff;
                    margin-bottom: 0.25rem;
                }

                .template-info p {
                    font-size: 0.9rem;
                    color: #666;
                }

                .template-arrow {
                    font-size: 1.5rem;
                    color: #444;
                    transition: all 0.2s;
                }

                .template:hover .template-arrow {
                    color: var(--accent);
                    transform: translateX(4px);
                }

                .loading-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #333;
                    border-top-color: var(--accent);
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  )
}
