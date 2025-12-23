'use client'

import { useEffect } from 'react'
import { WalletPassDraft, createEmptyField } from '@/lib/wallet/types'
import { getLayoutDefinition } from '@/lib/wallet/layout-definitions'
import { canAddField, getRemainingFieldCount } from '@/lib/wallet/validator'
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react'

interface FieldsEditorProps {
  draft: WalletPassDraft
  onChange: (draft: WalletPassDraft) => void
}

type FieldGroup = keyof WalletPassDraft['fields']

const FIELD_GROUPS: { key: FieldGroup; label: string; description: string }[] = [
  { key: 'headerFields', label: 'Header', description: 'Oben rechts neben Logo' },
  { key: 'primaryFields', label: 'Primär', description: 'Großer Hauptwert' },
  { key: 'secondaryFields', label: 'Sekundär', description: 'Mittlere Felder' },
  { key: 'auxiliaryFields', label: 'Zusatz', description: 'Kleinere Details' },
  { key: 'backFields', label: 'Rückseite', description: 'Nur auf Rückseite' }
]

export function FieldsEditor({ draft, onChange }: FieldsEditorProps) {
  const def = getLayoutDefinition(draft.meta.style)

  // Sync Input Fields with Draft State (Effect)
  useEffect(() => {
    const stampField = draft.fields.primaryFields.find(f => f.key === 'stamps')
    if (stampField?.value) {
      const match = String(stampField.value).match(/(\d+)\s*(?:von|\/)\s*(\d+)/)
      if (match) {
        const currentEl = document.getElementById('stamp-current') as HTMLInputElement
        const totalEl = document.getElementById('stamp-count') as HTMLInputElement

        // Only update if not currently focused (to avoid jumping values while typing)
        if (currentEl && document.activeElement !== currentEl) {
          currentEl.value = match[1]
        }
        if (totalEl && document.activeElement !== totalEl) {
          totalEl.value = match[2]
        }
      }
    }
  }, [draft.fields.primaryFields])


  const addField = (group: FieldGroup) => {
    if (!canAddField(draft, group)) return

    const newField = createEmptyField()
    const newDraft = {
      ...draft,
      fields: {
        ...draft.fields,
        [group]: [...draft.fields[group], newField]
      }
    }
    onChange(newDraft)
  }

  const updateField = (group: FieldGroup, index: number, update: Partial<{ label: string; value: string }>) => {
    const newFields = [...draft.fields[group]]
    newFields[index] = { ...newFields[index], ...update }

    onChange({
      ...draft,
      fields: {
        ...draft.fields,
        [group]: newFields
      }
    })
  }

  const removeField = (group: FieldGroup, index: number) => {
    const newFields = draft.fields[group].filter((_, i) => i !== index)
    onChange({
      ...draft,
      fields: {
        ...draft.fields,
        [group]: newFields
      }
    })
  }

  return (
    <div className="fields-editor">
      {/* Logo Text (Global Content) */}
      <div className="field-group">
        <div className="field-group-header">
          <h3>Logo-Text</h3>
        </div>
        <div className="field-inputs-col">
          <input
            type="text"
            value={draft.content.logoText || ''}
            onChange={e => onChange({ ...draft, content: { ...draft.content, logoText: e.target.value } })}
            placeholder="Name neben dem Logo"
            disabled={draft.content.hideLogoText}
            className="full-width-input"
          />
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="hideLogoText"
              checked={draft.content.hideLogoText || false}
              onChange={e => onChange({ ...draft, content: { ...draft.content, hideLogoText: e.target.checked } })}
            />
            <label htmlFor="hideLogoText" className="checkbox-label">Text verbergen (nur Logo anzeigen)</label>
          </div>
        </div>
      </div>

      {/* Stamp Logic (Only for StoreCard / EventTicket) */}
      {(draft.meta.style === 'storeCard' || draft.meta.style === 'eventTicket') && (
        <div className="field-group bg-emerald-900/10 border-emerald-900/30">
          <div className="field-group-header">
            <h3>Stempel-Logik (Automatik)</h3>
            <p className="text-emerald-500 text-xs">Wähle dein Emoji - wird automatisch gespeichert</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Aktuell</label>
              <input
                type="number"
                placeholder="1"
                className="full-width-input"
                value={draft.stampConfig?.current ?? 1}
                onChange={(e) => {
                  const current = Math.max(0, parseInt(e.target.value) || 0)
                  onChange({
                    ...draft,
                    stampConfig: {
                      icon: draft.stampConfig?.icon || '🟢',
                      inactiveIcon: draft.stampConfig?.inactiveIcon || '⚪',
                      total: draft.stampConfig?.total || 10,
                      current: Math.min(current, draft.stampConfig?.total || 10)
                    }
                  })
                }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ziel</label>
              <input
                type="number"
                placeholder="10"
                className="full-width-input"
                value={draft.stampConfig?.total ?? 10}
                onChange={(e) => {
                  const total = Math.max(1, parseInt(e.target.value) || 10)
                  onChange({
                    ...draft,
                    stampConfig: {
                      icon: draft.stampConfig?.icon || '🟢',
                      inactiveIcon: draft.stampConfig?.inactiveIcon || '⚪',
                      total: total,
                      current: Math.min(draft.stampConfig?.current || 1, total)
                    }
                  })
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Aktiv Emoji</label>
              <input
                type="text"
                placeholder="🟢"
                className="full-width-input text-2xl text-center"
                value={draft.stampConfig?.icon || '🟢'}
                onChange={(e) => {
                  onChange({
                    ...draft,
                    stampConfig: {
                      icon: e.target.value || '🟢',
                      inactiveIcon: draft.stampConfig?.inactiveIcon || '⚪',
                      total: draft.stampConfig?.total || 10,
                      current: draft.stampConfig?.current || 1
                    }
                  })
                }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Inaktiv Emoji</label>
              <input
                type="text"
                placeholder="⚪"
                className="full-width-input text-2xl text-center"
                value={draft.stampConfig?.inactiveIcon || '⚪'}
                onChange={(e) => {
                  onChange({
                    ...draft,
                    stampConfig: {
                      icon: draft.stampConfig?.icon || '🟢',
                      inactiveIcon: e.target.value || '⚪',
                      total: draft.stampConfig?.total || 10,
                      current: draft.stampConfig?.current || 1
                    }
                  })
                }}
              />
            </div>
          </div>

          <button
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors mb-2"
            onClick={() => {
              const icon = draft.stampConfig?.icon || '🟢'
              const inactive = draft.stampConfig?.inactiveIcon || '⚪'
              const current = draft.stampConfig?.current ?? 1
              const total = draft.stampConfig?.total ?? 10

              // Generate Visual Emoji String
              const safeCurrent = Math.min(Math.max(0, current), total)
              const activeStr = icon.repeat(safeCurrent)
              const inactiveStr = inactive.repeat(total - safeCurrent)
              const visual = Array.from(activeStr).join(' ') + ' ' + Array.from(inactiveStr).join(' ')

              // Generate Text String
              let textValue = `${safeCurrent} von ${total}`
              if (draft.meta.style === 'eventTicket') {
                textValue = `${safeCurrent} / ${total}`
              }

              // Update Fields
              const newFields = { ...draft.fields }

              // Update Primary (Text)
              const primaryIdx = newFields.primaryFields.findIndex(f => f.key === 'stamps')
              if (primaryIdx >= 0) {
                newFields.primaryFields[primaryIdx] = { ...newFields.primaryFields[primaryIdx], value: textValue }
              } else if (newFields.primaryFields.length < 1) {
                newFields.primaryFields.push({ key: 'stamps', label: 'DEINE STEMPEL', value: textValue })
              }

              // Move 'Powered By' to Secondary if in Auxiliary
              const poweredInAuxIdx = newFields.auxiliaryFields.findIndex(f => f.key === 'powered')
              if (poweredInAuxIdx >= 0) {
                const field = newFields.auxiliaryFields[poweredInAuxIdx]
                newFields.auxiliaryFields.splice(poweredInAuxIdx, 1)
                if (!newFields.secondaryFields.find(f => f.key === 'powered')) {
                  newFields.secondaryFields.push(field)
                }
              }

              // Update Visual Field in Auxiliary
              let auxFields = [...newFields.auxiliaryFields]
              const visualIdx = auxFields.findIndex(f => f.key === 'progress_visual')
              if (visualIdx >= 0) {
                auxFields[visualIdx] = { ...auxFields[visualIdx], value: visual.trim(), label: 'DEIN FORTSCHRITT' }
              } else if (auxFields.length < 4) {
                auxFields.push({
                  key: 'progress_visual',
                  label: 'DEIN FORTSCHRITT',
                  value: visual.trim(),
                  textAlignment: 'PKTextAlignmentCenter'
                })
              }
              newFields.auxiliaryFields = auxFields

              onChange({
                ...draft,
                fields: newFields
              })
            }}
          >
            Vorschau aktualisieren
          </button>

          <p className="text-xs text-gray-500 text-center">
            Emoji wird automatisch gespeichert: <span className="text-emerald-400 text-lg">{draft.stampConfig?.icon || '🟢'}</span>
          </p>
        </div>
      )}

      {FIELD_GROUPS.map(({ key, label, description }) => {
        const fields = draft.fields[key]
        const remaining = getRemainingFieldCount(draft, key)
        const canAdd = canAddField(draft, key)
        const limit = def.fieldLimits[key]
        const isUnlimited = limit === -1

        return (
          <div key={key} className="field-group">
            <div className="field-group-header">
              <div>
                <h3>{label}</h3>
                <p>{description}</p>
              </div>
              <div className="field-limit">
                {isUnlimited ? (
                  <span className="limit-badge unlimited">∞</span>
                ) : (
                  <span className={`limit-badge ${remaining === 0 ? 'full' : ''}`}>
                    {fields.length}/{limit}
                  </span>
                )}
              </div>
            </div>

            <div className="field-list">
              {fields.map((field, index) => (
                <div key={field.key} className="field-item">
                  <div className="field-drag">
                    <GripVertical size={16} />
                  </div>
                  <div className="field-inputs">
                    <input
                      type="text"
                      placeholder="Label"
                      value={field.label}
                      onChange={e => updateField(key, index, { label: e.target.value })}
                      className="input-label"
                    />
                    <input
                      type="text"
                      placeholder="Wert"
                      value={String(field.value)}
                      onChange={e => updateField(key, index, { value: e.target.value })}
                      className="input-value"
                    />
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => removeField(key, index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="empty-state">
                  Keine Felder definiert
                </div>
              )}
            </div>

            <button
              className={`btn-add ${!canAdd ? 'disabled' : ''}`}
              onClick={() => addField(key)}
              disabled={!canAdd}
            >
              <Plus size={16} />
              {canAdd ? 'Feld hinzufügen' : 'Limit erreicht'}
            </button>
          </div>
        )
      })}

      <style jsx>{`
        .fields-editor {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .field-group {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 1rem;
        }
        
        .field-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .field-group-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        
        .field-group-header p {
          font-size: 0.75rem;
          color: #888;
          margin: 0;
        }
        
        .limit-badge {
          background: #333;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #888;
        }
        
        .limit-badge.full {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .limit-badge.unlimited {
          color: #22c55e;
        }
        
        .field-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .field-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #0a0a0a;
          padding: 8px;
          border-radius: 8px;
        }
        
        .field-drag {
          color: #555;
          cursor: grab;
        }
        
        .field-inputs {
          flex: 1;
          display: flex;
          gap: 0.5rem;
        }
        
        .field-inputs input {
          flex: 1;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.85rem;
          color: #fff;
        }
        
        .field-inputs input:focus {
          border-color: #555;
          outline: none;
        }
        
        .input-label {
          max-width: 120px;
          text-transform: uppercase;
          font-size: 0.75rem !important;
        }
        
        .btn-remove {
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .btn-remove:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        .empty-state {
          text-align: center;
          color: #555;
          font-size: 0.8rem;
          padding: 1rem;
        }
        
        .btn-add {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 2px dashed #333;
          border-radius: 8px;
          color: #888;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-add:hover:not(.disabled) {
          border-color: #555;
          color: #fff;
        }
        
        .btn-add.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .field-inputs-col {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .full-width-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.85rem;
          color: #fff;
        }

        .checkbox-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.25rem;
        }

        .checkbox-label {
            margin-bottom: 0 !important;
            color: #bbb !important;
            cursor: pointer;
            font-size: 0.8rem;
        }
        
        input[type="checkbox"] {
            width: 16px !important;
            height: 16px;
            cursor: pointer;
        }
      `}</style>
    </div>
  )
}
