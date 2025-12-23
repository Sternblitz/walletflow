'use client'

import { useState } from 'react'
import { WalletPassDraft, BarcodeFormat } from '@/lib/wallet/types'
import { validateDraft } from '@/lib/wallet/validator'
import { Barcode, Settings2, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

interface SettingsEditorProps {
  draft: WalletPassDraft
  onChange: (draft: WalletPassDraft) => void
}

const BARCODE_FORMATS: { value: BarcodeFormat; label: string; description: string }[] = [
  { value: 'PKBarcodeFormatQR', label: 'QR Code', description: 'Quadratisch, vielseitig' },
  { value: 'PKBarcodeFormatAztec', label: 'Aztec', description: 'Quadratisch, kompakt' },
  { value: 'PKBarcodeFormatPDF417', label: 'PDF417', description: 'Rechteckig, mehr Daten' },
  { value: 'PKBarcodeFormatCode128', label: 'Code 128', description: 'Linear, klassisch' }
]

export function SettingsEditor({ draft, onChange }: SettingsEditorProps) {
  const [showValidation, setShowValidation] = useState(false)
  const validation = validateDraft(draft)

  const updateBarcode = (update: Partial<WalletPassDraft['barcode']>) => {
    onChange({
      ...draft,
      barcode: { ...draft.barcode, ...update }
    })
  }

  const updateContent = (update: Partial<WalletPassDraft['content']>) => {
    onChange({
      ...draft,
      content: { ...draft.content, ...update }
    })
  }

  return (
    <div className="settings-editor">
      {/* Content Settings */}
      <section className="settings-section">
        <h3><FileText size={18} /> Allgemeine Infos</h3>



        <div className="form-field">
          <label>Beschreibung *</label>
          <input
            type="text"
            value={draft.content.description}
            onChange={e => updateContent({ description: e.target.value })}
            placeholder="z.B. Stempelkarte für Café XY"
          />
          <span className="hint">Wird auf dem Lockscreen angezeigt</span>
        </div>

        <div className="form-field">
          <label>Organisation</label>
          <input
            type="text"
            value={draft.content.organizationName}
            onChange={e => updateContent({ organizationName: e.target.value })}
            placeholder="Unternehmensname"
          />
        </div>
      </section>

      {/* Barcode Settings */}
      <section className="settings-section">
        <h3><Barcode size={18} /> Barcode</h3>

        <div className="form-field">
          <label>Format</label>
          <div className="barcode-formats">
            {BARCODE_FORMATS.map(format => (
              <button
                key={format.value}
                className={`format-btn ${draft.barcode.format === format.value ? 'selected' : ''}`}
                onClick={() => updateBarcode({ format: format.value })}
              >
                <span className="format-name">{format.label}</span>
                <span className="format-desc">{format.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Barcode-Inhalt</label>
          <input
            type="text"
            value={draft.barcode.message}
            onChange={e => updateBarcode({ message: e.target.value })}
            placeholder="URL, Nummer, oder Text"
          />
          <span className="hint">Dieser Wert wird gescannt</span>
        </div>

        <div className="form-field">
          <label>Alt-Text (optional)</label>
          <input
            type="text"
            value={draft.barcode.altText || ''}
            onChange={e => updateBarcode({ altText: e.target.value })}
            placeholder="Text unter dem Barcode"
          />
        </div>
      </section>

      {/* Validation Status */}
      <section className="settings-section validation-section">
        <h3><Settings2 size={18} /> Validierung</h3>

        <div className={`validation-status ${validation.valid ? 'valid' : 'invalid'}`}>
          {validation.valid ? (
            <>
              <CheckCircle size={20} />
              <span>Pass ist gültig</span>
            </>
          ) : (
            <>
              <AlertTriangle size={20} />
              <span>{validation.errors.length} Fehler gefunden</span>
            </>
          )}
        </div>

        {(validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="validation-details">
            {validation.errors.map((err, i) => (
              <div key={i} className="validation-item error">
                <AlertTriangle size={14} />
                <span>{err.message}</span>
              </div>
            ))}
            {validation.warnings.map((warn, i) => (
              <div key={i} className="validation-item warning">
                <AlertTriangle size={14} />
                <span>{warn.message}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .settings-editor {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .settings-section {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 1rem;
        }
        
        .settings-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #333;
        }
        
        .form-field {
          margin-bottom: 1rem;
        }
        
        .form-field:last-child {
          margin-bottom: 0;
        }
        
        .form-field label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #888;
          margin-bottom: 0.5rem;
        }
        
        .form-field input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.9rem;
          color: #fff;
        }
        
        .form-field input:focus {
          border-color: #555;
          outline: none;
        }
        
        .hint {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
          display: block;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .checkbox-label {
          margin-bottom: 0 !important;
          color: #bbb !important;
          cursor: pointer;
        }
        
        input[type="checkbox"] {
          width: 16px !important;
          height: 16px;
          cursor: pointer;
        }
        
        .barcode-formats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .format-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px;
          background: #0a0a0a;
          border: 2px solid #333;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .format-btn:hover {
          border-color: #555;
        }
        
        .format-btn.selected {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }
        
        .format-name {
          font-weight: 600;
          color: #fff;
          font-size: 0.85rem;
        }
        
        .format-desc {
          font-size: 0.7rem;
          color: #666;
        }
        
        .validation-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 12px;
          border-radius: 8px;
          font-weight: 500;
        }
        
        .validation-status.valid {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        
        .validation-status.invalid {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .validation-details {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .validation-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
        }
        
        .validation-item.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        
        .validation-item.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
      `}</style>
    </div>
  )
}
