'use client'

import { WalletPassDraft } from '@/lib/wallet/types'

interface ColorsEditorProps {
    draft: WalletPassDraft
    onChange: (draft: WalletPassDraft) => void
}

const COLOR_FIELDS: { key: keyof WalletPassDraft['colors']; label: string; description: string }[] = [
    { key: 'backgroundColor', label: 'Hintergrund', description: 'Hauptfarbe der Karte' },
    { key: 'foregroundColor', label: 'Text', description: 'Farbe für Werte' },
    { key: 'labelColor', label: 'Labels', description: 'Farbe für Überschriften' }
]

// Preset color palettes
// Preset color palettes
const PRESETS = [
    {
        name: 'Dark',
        colors: { backgroundColor: '#18181B', foregroundColor: '#FFFFFF', labelColor: '#A1A1AA' }
    },
    {
        name: 'Light',
        colors: { backgroundColor: '#FFFFFF', foregroundColor: '#000000', labelColor: '#52525B' }
    },
    {
        name: 'Vibrant',
        colors: { backgroundColor: '#4F46E5', foregroundColor: '#FFFFFF', labelColor: '#E0E7FF' }
    },
    {
        name: 'Gold',
        colors: { backgroundColor: '#1A1500', foregroundColor: '#FFD700', labelColor: '#B8860B' }
    },
    {
        name: 'Forest',
        colors: { backgroundColor: '#064E3B', foregroundColor: '#ECFDF5', labelColor: '#6EE7B7' }
    },
    {
        name: 'Midnight',
        colors: { backgroundColor: '#1E1B4B', foregroundColor: '#C7D2FE', labelColor: '#818CF8' }
    }
]

export function ColorsEditor({ draft, onChange }: ColorsEditorProps) {
    const updateColor = (key: keyof WalletPassDraft['colors'], value: string) => {
        onChange({
            ...draft,
            colors: {
                ...draft.colors,
                [key]: value
            }
        })
    }

    const applyPreset = (preset: typeof PRESETS[0]) => {
        onChange({
            ...draft,
            colors: preset.colors
        })
    }

    return (
        <div className="colors-editor">
            {/* Presets */}
            <div className="section">
                <h3>Schnellauswahl</h3>
                <div className="presets-grid">
                    {PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            className="preset-btn"
                            onClick={() => applyPreset(preset)}
                            style={{
                                backgroundColor: preset.colors.backgroundColor,
                                color: preset.colors.foregroundColor,
                                borderColor: preset.colors.labelColor
                            }}
                        >
                            <span className="preset-label" style={{ color: preset.colors.labelColor }}>
                                LABEL
                            </span>
                            <span className="preset-value">{preset.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Individual Color Pickers */}
            <div className="section">
                <h3>Feinabstimmung</h3>
                <div className="color-fields">
                    {COLOR_FIELDS.map(({ key, label, description }) => (
                        <div key={key} className="color-field">
                            <div className="color-info">
                                <span className="color-label">{label}</span>
                                <span className="color-desc">{description}</span>
                            </div>
                            <div className="color-controls">
                                <div
                                    className="color-swatch"
                                    style={{ backgroundColor: draft.colors[key] }}
                                />
                                <input
                                    type="color"
                                    value={draft.colors[key]}
                                    onChange={e => updateColor(key, e.target.value)}
                                    className="color-input"
                                />
                                <input
                                    type="text"
                                    value={draft.colors[key]}
                                    onChange={e => updateColor(key, e.target.value)}
                                    className="color-hex"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Preview */}
            <div className="section">
                <h3>Vorschau</h3>
                <div
                    className="color-preview"
                    style={{ backgroundColor: draft.colors.backgroundColor }}
                >
                    <span style={{ color: draft.colors.labelColor }}>LABEL</span>
                    <span style={{ color: draft.colors.foregroundColor, fontSize: '1.5rem', fontWeight: 700 }}>
                        Wert
                    </span>
                </div>
            </div>

            <style jsx>{`
        .colors-editor {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .section h3 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }
        
        .presets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        
        .preset-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          border: 2px solid;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .preset-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .preset-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .preset-value {
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .color-fields {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .color-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1a1a1a;
          padding: 12px;
          border-radius: 10px;
        }
        
        .color-info {
          display: flex;
          flex-direction: column;
        }
        
        .color-label {
          font-weight: 600;
          color: #fff;
        }
        
        .color-desc {
          font-size: 0.75rem;
          color: #666;
        }
        
        .color-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 2px solid #333;
        }
        
        .color-input {
          width: 40px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        
        .color-hex {
          width: 80px;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 6px 10px;
          color: #fff;
          font-family: monospace;
          font-size: 0.85rem;
        }
        
        .color-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          border-radius: 12px;
          gap: 4px;
        }
      `}</style>
        </div>
    )
}
