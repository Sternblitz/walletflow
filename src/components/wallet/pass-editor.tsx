'use client'

import { useState } from 'react'
import { WalletPassDraft } from '@/lib/wallet/types'
import { getLayoutDefinition } from '@/lib/wallet/layout-definitions'
import { validateDraft } from '@/lib/wallet/validator'
import { PassPreview } from './pass-preview'
import { FieldsEditor } from './fields-editor'
import { ColorsEditor } from './colors-editor'
import { ImagesEditor } from './images-editor'
import { SettingsEditor } from './settings-editor'
import {
  Palette,
  TextCursor,
  Image,
  Settings,
  ChevronLeft,
  Download,
  Eye,
  Watch,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface PassEditorProps {
  draft: WalletPassDraft
  onChange: (draft: WalletPassDraft) => void
  onBack: () => void
  onExport?: () => void
}

type TabId = 'colors' | 'fields' | 'images' | 'settings'

const TABS: { id: TabId; label: string; icon: typeof Palette }[] = [
  { id: 'colors', label: 'Farben', icon: Palette },
  { id: 'fields', label: 'Inhalte', icon: TextCursor },
  { id: 'images', label: 'Bilder', icon: Image },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export function PassEditor({ draft, onChange, onBack, onExport }: PassEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('colors')
  const [watchPreview, setWatchPreview] = useState(false)

  const def = getLayoutDefinition(draft.meta.style)
  const validation = validateDraft(draft)

  return (
    <div className="pass-editor">
      {/* Header */}
      <header className="editor-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
          Zurück
        </button>
        <div className="header-info">
          <span className="pass-type">{def.displayName}</span>
          <span className={`validation-badge ${validation.valid ? 'valid' : 'invalid'}`}>
            {validation.valid ? (
              <><CheckCircle size={14} /> Gültig</>
            ) : (
              <><AlertTriangle size={14} /> {validation.errors.length} Fehler</>
            )}
          </span>
        </div>
        <div className="header-actions">
          <button
            className={`watch-toggle ${watchPreview ? 'active' : ''}`}
            onClick={() => setWatchPreview(!watchPreview)}
            title="Apple Watch Vorschau"
          >
            <Watch size={18} />
          </button>
          <button
            className="export-btn"
            onClick={onExport}
            disabled={!validation.valid}
          >
            <Download size={18} />
            Exportieren
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="editor-content">
        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="preview-container">
            <PassPreview draft={draft} scale={watchPreview ? 0.6 : 0.85} />
            {watchPreview && (
              <div className="watch-badge">
                <Watch size={14} /> Watch Preview
              </div>
            )}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="editor-panel">
          {/* Tab Bar */}
          <nav className="tab-bar">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'colors' && (
              <ColorsEditor draft={draft} onChange={onChange} />
            )}
            {activeTab === 'fields' && (
              <FieldsEditor draft={draft} onChange={onChange} />
            )}
            {activeTab === 'images' && (
              <ImagesEditor draft={draft} onChange={onChange} />
            )}
            {activeTab === 'settings' && (
              <SettingsEditor draft={draft} onChange={onChange} />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pass-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0a0a;
        }
        
        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
        }
        
        .back-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .back-btn:hover {
          background: #333;
          color: #fff;
        }
        
        .header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .pass-type {
          font-weight: 600;
          color: #fff;
        }
        
        .validation-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .validation-badge.valid {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        
        .validation-badge.invalid {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .watch-toggle {
          background: transparent;
          border: 1px solid #333;
          color: #666;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .watch-toggle:hover,
        .watch-toggle.active {
          border-color: #555;
          color: #fff;
        }
        
        .export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .export-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }
        
        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .editor-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .preview-panel {
          flex: 0 0 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
          border-right: 1px solid #333;
          padding: 2rem;
        }
        
        .preview-container {
          position: relative;
        }
        
        .watch-badge {
          position: absolute;
          bottom: -32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.1);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          color: #888;
        }
        
        .editor-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .tab-bar {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
        }
        
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: #666;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        
        .tab-btn:hover {
          background: #333;
          color: #999;
        }
        
        .tab-btn.active {
          background: #333;
          color: #fff;
        }
        
        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
      `}</style>
    </div>
  )
}
