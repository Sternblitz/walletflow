'use client'

import { useState } from 'react'
import { WalletPassDraft, ImageSlot } from '@/lib/wallet/types'
import { getLayoutDefinition } from '@/lib/wallet/layout-definitions'
import { Upload, X, AlertCircle, Sparkles, Loader2, Type, Pencil, Wand2, Palette } from 'lucide-react'
import { ImageAdjustmentModal } from './image-adjustment-modal'
import { FadeEditorModal } from './fade-editor-modal'
import { IconEditor } from '@/components/ui/icon-editor'

interface ImagesEditorProps {
  draft: WalletPassDraft
  onChange: (draft: WalletPassDraft) => void
}

const IMAGE_SLOT_INFO: Record<ImageSlot, { label: string; description: string; aspect: string }> = {
  logo: { label: 'Logo', description: 'Oben links, max 160×50pt', aspect: '160/50' },
  icon: { label: 'Icon', description: 'App-Icon, 29×29pt', aspect: '1/1' },
  strip: { label: 'Strip', description: 'Banner-Bild, 375×144pt', aspect: '375/144' },
  thumbnail: { label: 'Thumbnail', description: 'Profilbild, 90×90pt', aspect: '1/1' },
  background: { label: 'Background', description: 'Hintergrundbild, 180×220pt', aspect: '180/220' },
  footer: { label: 'Footer', description: 'Boarding Pass Footer, 286×15pt', aspect: '286/15' }
}

export function ImagesEditor({ draft, onChange }: ImagesEditorProps) {
  const def = getLayoutDefinition(draft.meta.style)
  const [uploading, setUploading] = useState<ImageSlot | null>(null)
  const [generatingSlot, setGeneratingSlot] = useState<ImageSlot | null>(null)
  const [editingSlot, setEditingSlot] = useState<ImageSlot | null>(null)
  const [fadeSlot, setFadeSlot] = useState<ImageSlot | null>(null)
  const [thumbnailMode, setThumbnailMode] = useState<'text' | 'ai'>('text')
  const [prompts, setPrompts] = useState<Partial<Record<ImageSlot, string>>>({})
  const [errors, setErrors] = useState<Partial<Record<ImageSlot, string>>>({})
  const [showIconEditor, setShowIconEditor] = useState(false)

  // Generic AI Image Generation
  const generateAIImage = async (slot: ImageSlot) => {
    const prompt = prompts[slot] || ''

    if (!prompt.trim()) {
      setErrors(prev => ({ ...prev, [slot]: 'Bitte beschreibe kurz was auf dem Bild sein soll' }))
      return
    }

    setGeneratingSlot(slot)
    setErrors(prev => ({ ...prev, [slot]: undefined }))

    console.log(`🎨 Starting ${slot} generation with prompt:`, prompt)

    try {
      const response = await fetch('/api/design/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDescription: prompt,
          businessName: draft.content.logoText || draft.content.organizationName || 'Premium Store',
          backgroundColor: draft.colors.backgroundColor,
          accentColor: draft.colors.labelColor,
          style: 'modern premium',
          type: slot // 'strip' or 'background'
        })
      })

      const data = await response.json()
      console.log('Image API response:', data)

      if (data.imageUrl) {
        console.log('✅ Image URL received:', data.imageUrl)
        onChange({
          ...draft,
          images: {
            ...draft.images,
            [slot]: { url: data.imageUrl, fileName: `ai-generated-${slot}.png` }
          }
        })
        setPrompts(prev => ({ ...prev, [slot]: '' }))
      } else if (data.error) {
        console.error('Image API error:', data.error)
        setErrors(prev => ({ ...prev, [slot]: data.error }))
      }
    } catch (error) {
      console.error('Image generation error:', error)
      setErrors(prev => ({ ...prev, [slot]: 'Fehler bei der Generierung' }))
    }
    setGeneratingSlot(null)
  }

  const handleUpload = async (slot: ImageSlot, file: File) => {
    setUploading(slot)

    try {
      // Resize image to max 1024px width/height to keep payload small
      const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              let width = img.width
              let height = img.height
              const MAX_SIZE = 1024

              if (width > height) {
                if (width > MAX_SIZE) {
                  height *= MAX_SIZE / width
                  width = MAX_SIZE
                }
              } else {
                if (height > MAX_SIZE) {
                  width *= MAX_SIZE / height
                  height = MAX_SIZE
                }
              }

              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx?.drawImage(img, 0, 0, width, height)

              // Compress to PNG to preserve transparency
              resolve(canvas.toDataURL('image/png'))
            }
            img.src = e.target?.result as string
          }
          reader.readAsDataURL(file)
        })
      }

      const resizedBase64 = await resizeImage(file)

      onChange({
        ...draft,
        images: {
          ...draft.images,
          [slot]: { url: resizedBase64, fileName: file.name }
        }
      })
      setUploading(null)
    } catch (error) {
      console.error('Upload error:', error)
      setUploading(null)
    }
  }

  const removeImage = (slot: ImageSlot) => {
    const { [slot]: removed, ...rest } = draft.images
    onChange({ ...draft, images: rest })
  }

  // Check eventTicket strip rule
  const isBlockedByStrip = (slot: ImageSlot) => {
    if (!def.rules.stripBlocksBackgroundAndThumbnail) return false
    if (slot === 'background' || slot === 'thumbnail') {
      return !!draft.images.strip
    }
    return false
  }

  return (
    <div className="images-editor">
      <div className="slots-grid">
        {def.allowedImages.map(slot => {
          const info = IMAGE_SLOT_INFO[slot]
          const image = draft.images[slot]
          const isBlocked = isBlockedByStrip(slot)
          const isLoading = uploading === slot

          return (
            <div
              key={slot}
              className={`image-slot ${image ? 'has-image' : ''} ${isBlocked ? 'blocked' : ''}`}
            >
              <div className="slot-header">
                <span className="slot-label">{info.label}</span>
                {isBlocked && (
                  <span className="blocked-badge">
                    <AlertCircle size={14} /> Strip aktiv
                  </span>
                )}
              </div>

              <div
                className="slot-preview"
                style={{ aspectRatio: info.aspect }}
              >
                {image ? (
                  <>
                    <img src={image.url} alt={info.label} />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        className="action-btn edit"
                        onClick={() => setEditingSlot(slot)}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="action-btn remove"
                        onClick={() => removeImage(slot)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className={`upload-area ${isBlocked ? 'disabled' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file && !isBlocked) handleUpload(slot, file)
                      }}
                      disabled={isBlocked}
                    />
                    {isLoading ? (
                      <span className="loading">Lädt...</span>
                    ) : (
                      <>
                        <Upload size={24} />
                        <span>Hochladen</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* AI Generate section for Strip & Background */}
              {(slot === 'strip' || slot === 'background') && (
                <div className="ai-strip-section">
                  <input
                    type="text"
                    className="strip-prompt-input"
                    placeholder={slot === 'background' ? "z.B. Abstrakt, Dunkel, Textur..." : "z.B. Kaffeebohnen, Zitronen, Blumen..."}
                    value={prompts[slot] || ''}
                    onChange={e => setPrompts(prev => ({ ...prev, [slot]: e.target.value }))}
                    disabled={generatingSlot === slot}
                  />
                  <div className="flex gap-2">
                    <button
                      className="ai-generate-btn flex-1"
                      onClick={() => generateAIImage(slot)}
                      disabled={generatingSlot === slot || !prompts[slot]?.trim()}
                    >
                      {generatingSlot === slot ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          Generiere...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          {image ? 'Neu generieren' : 'Generieren'}
                        </>
                      )}
                    </button>
                    {/* FADE EDITOR (Background Only) */}
                    {slot === 'background' && image && (
                      <button
                        className="ai-generate-btn bg-slate-700 hover:bg-slate-600 w-auto px-3"
                        title="Öffne Fade Editor (Erweitert)"
                        onClick={() => setFadeSlot(slot)}
                      >
                        Fade Editor
                      </button>
                    )}

                  </div>
                  {errors[slot] && (
                    <span className="strip-error">{errors[slot]}</span>
                  )}
                </div>
              )
              }

              {/* Icon Editor Button */}
              {slot === 'icon' && (
                <button
                  className="ai-generate-btn mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                  onClick={() => setShowIconEditor(true)}
                >
                  <Palette size={16} />
                  Icon Editor (Vorlagen & AI)
                </button>
              )}

              {/* Thumbnail/Icon Generator Options (Text vs AI) */}
              {(slot === 'thumbnail') && (
                <div className="flex flex-col gap-2 mt-2">
                  {/* Toggle Mode */}
                  <div className="flex gap-2 p-1 bg-black/20 rounded-lg">
                    <button
                      className={`flex-1 text-xs py-1 rounded ${thumbnailMode === 'text' ? 'bg-white text-black' : 'text-gray-400'}`}
                      onClick={() => setThumbnailMode('text')}
                    >
                      Text
                    </button>
                    <button
                      className={`flex-1 text-xs py-1 rounded ${thumbnailMode === 'ai' ? 'bg-white text-black' : 'text-gray-400'}`}
                      onClick={() => setThumbnailMode('ai')}
                    >
                      AI Icon
                    </button>
                  </div>

                  {/* BACKGROUND REMOVAL & RECOLOR TOOLS */}
                  {image && (
                    <div className="flex flex-col gap-2">
                      <button
                        className="ai-generate-btn bg-pink-600 hover:bg-pink-500 w-full"
                        title="Kostenlos & Lokal (Browser)"
                        onClick={async () => {
                          const canvas = document.createElement('canvas')
                          const ctx = canvas.getContext('2d')
                          const img = new Image()
                          img.crossOrigin = 'anonymous'
                          img.src = image.url
                          await new Promise(r => img.onload = r)

                          canvas.width = img.width
                          canvas.height = img.height

                          if (ctx) {
                            ctx.drawImage(img, 0, 0)
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                            const data = imageData.data

                            // Magic Wand: Remove White/Near-White
                            for (let i = 0; i < data.length; i += 4) {
                              const r = data[i]
                              const g = data[i + 1]
                              const b = data[i + 2]

                              // Threshold for "White" (allow slight variance)
                              if (r > 240 && g > 240 && b > 240) {
                                data[i + 3] = 0 // Transparent
                              }
                            }
                            ctx.putImageData(imageData, 0, 0)
                          }

                          const newUrl = canvas.toDataURL('image/png')
                          onChange({
                            ...draft,
                            images: { ...draft.images, [slot]: { url: newUrl, fileName: 'transparent-icon.png' } }
                          })
                        }}
                      >
                        <Wand2 size={16} />
                        Hintergrund entfernen (Magic Wand)
                      </button>

                      <button
                        className="ai-generate-btn bg-indigo-600 hover:bg-indigo-500 w-full"
                        title="Färbt das Icon in deine Akzentfarbe"
                        onClick={async () => {
                          const canvas = document.createElement('canvas')
                          const ctx = canvas.getContext('2d')
                          const img = new Image()
                          img.crossOrigin = 'anonymous'
                          img.src = image.url
                          await new Promise(r => img.onload = r)

                          canvas.width = img.width
                          canvas.height = img.height

                          if (ctx) {
                            // 1. Draw original image
                            ctx.drawImage(img, 0, 0)

                            // 2. Set composite operation to source-in
                            // This keeps the alpha channel of the original image but uses the color of the next draw
                            ctx.globalCompositeOperation = 'source-in'

                            // 3. Fill with accent color
                            ctx.fillStyle = draft.colors.labelColor // Accent Color
                            ctx.fillRect(0, 0, canvas.width, canvas.height)

                            // Reset composite
                            ctx.globalCompositeOperation = 'source-over'
                          }

                          const newUrl = canvas.toDataURL('image/png')
                          onChange({
                            ...draft,
                            images: { ...draft.images, [slot]: { url: newUrl, fileName: 'recolored-icon.png' } }
                          })
                        }}
                      >
                        <span className="w-4 h-4 rounded-full border border-white/30" style={{ background: draft.colors.labelColor }} />
                        Einfärben (Akzentfarbe)
                      </button>

                      <div className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
                        <Sparkles size={10} />
                        <span>Tools laufen lokal im Browser (Kostenlos)</span>
                      </div>
                    </div>
                  )}

                  {/* TEXT MODE */}
                  {thumbnailMode === 'text' && (
                    <div className="ai-strip-section">
                      <input
                        type="text"
                        className="strip-prompt-input"
                        placeholder="z.B. 3/10"
                        value={prompts[slot] || ''}
                        onChange={e => setPrompts(prev => ({ ...prev, [slot]: e.target.value }))}
                        disabled={generatingSlot === slot}
                        maxLength={5}
                      />
                      <button
                        className="ai-generate-btn"
                        onClick={async () => {
                          const text = prompts[slot] || ''
                          if (!text.trim()) return
                          setGeneratingSlot(slot)
                          try {
                            const res = await fetch('/api/design/generate-thumbnail', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                text,
                                color: draft.colors.labelColor,
                                backgroundColor: 'transparent'
                              })
                            })
                            const d = await res.json()
                            if (d.imageUrl) {
                              onChange({
                                ...draft,
                                images: {
                                  ...draft.images,
                                  thumbnail: { url: d.imageUrl, fileName: 'thumbnail-text.png' }
                                }
                              })
                              setPrompts(prev => ({ ...prev, [slot]: '' }))
                            }
                          } catch (e) { console.error(e) }
                          setGeneratingSlot(null)
                        }}
                        disabled={generatingSlot === slot || !prompts[slot]?.trim()}
                      >
                        {generatingSlot === slot ? <Loader2 size={16} className="spin" /> : <Type size={16} />}
                        Erstellen
                      </button>
                    </div>
                  )}

                  {/* AI MODE */}
                  {thumbnailMode === 'ai' && (
                    <div className="ai-strip-section">
                      <input
                        type="text"
                        className="strip-prompt-input"
                        placeholder="z.B. Sushi, Pizza, Burger (Icon)"
                        value={prompts[slot] || ''}
                        onChange={e => setPrompts(prev => ({ ...prev, [slot]: e.target.value }))}
                        disabled={generatingSlot === slot}
                      />
                      <button
                        className="ai-generate-btn"
                        onClick={() => generateAIImage(slot)}
                        disabled={generatingSlot === slot || !prompts[slot]?.trim()}
                      >
                        {generatingSlot === slot ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                        Generieren
                      </button>
                    </div>
                  )}
                </div>
              )}

              <span className="slot-description">{info.description}</span>
            </div>
          )
        })}
      </div>

      {
        editingSlot && draft.images[editingSlot] && (
          <ImageAdjustmentModal
            imageUrl={draft.images[editingSlot]!.url}
            isOpen={!!editingSlot}
            onClose={() => setEditingSlot(null)}
            onSave={(newUrl, file) => handleUpload(editingSlot, file)}
          />
        )
      }

      {
        fadeSlot && draft.images[fadeSlot] && (
          <FadeEditorModal
            isOpen={!!fadeSlot}
            onClose={() => setFadeSlot(null)}
            imageUrl={draft.images[fadeSlot]!.url}
            backgroundColor={draft.colors.backgroundColor}
            onSave={(newUrl) => {
              onChange({
                ...draft,
                images: { ...draft.images, [fadeSlot]: { url: newUrl, fileName: 'faded-bg.png' } }
              })
              setFadeSlot(null)
            }}
          />
        )
      }

      {
        def.rules.stripBlocksBackgroundAndThumbnail && (
          <div className="rule-info">
            <AlertCircle size={16} />
            <span>Bei Event-Tickets: Strip deaktiviert Background und Thumbnail</span>
          </div>
        )
      }

      {/* Icon Editor Modal */}
      <IconEditor
        isOpen={showIconEditor}
        onClose={() => setShowIconEditor(false)}
        onSave={(iconUrl) => {
          onChange({
            ...draft,
            images: {
              ...draft.images,
              icon: { url: iconUrl, fileName: 'custom-icon.png' }
            }
          })
        }}
        backgroundColor={draft.colors.backgroundColor}
        businessType={draft.content.logoText || draft.content.organizationName || ''}
      />

      <style jsx>{`
        .images-editor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        
        .image-slot {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 0.75rem;
        }
        
        .image-slot.blocked {
          opacity: 0.5;
        }
        
        .slot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .slot-label {
          font-weight: 600;
          color: #fff;
          font-size: 0.9rem;
        }
        
        .blocked-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          color: #f59e0b;
        }
        
        .slot-preview {
          position: relative;
          background: #0a0a0a;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .slot-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .action-btn {
          background: rgba(0,0,0,0.6);
          border: none;
          border-radius: 4px;
          padding: 4px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .action-btn:hover {
          background: rgba(0,0,0,0.9);
        }

        .action-btn.edit:hover {
            color: #3B82F6;
        }

        .action-btn.remove:hover {
            color: #EF4444;
        }
        
        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 80px;
          border: 2px dashed #333;
          border-radius: 8px;
          cursor: pointer;
          color: #666;
          gap: 4px;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .upload-area:hover:not(.disabled) {
          border-color: #555;
          color: #999;
        }
        
        .upload-area.disabled {
          cursor: not-allowed;
        }
        
        .upload-area input {
          display: none;
        }
        
        .loading {
          color: #888;
        }
        
        .slot-description {
          font-size: 0.7rem;
          color: #666;
          margin-top: 0.5rem;
          display: block;
        }
        
        .rule-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          color: #f59e0b;
          font-size: 0.8rem;
        }

        .ai-generate-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          margin-top: 8px;
          background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-generate-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .ai-generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ai-strip-section {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .strip-prompt-input {
          width: 100%;
          padding: 8px 10px;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 6px;
          color: #fff;
          font-size: 0.8rem;
        }

        .strip-prompt-input::placeholder {
          color: #666;
        }

        .strip-prompt-input:focus {
          outline: none;
          border-color: #8B5CF6;
        }

        .strip-error {
          font-size: 0.7rem;
          color: #EF4444;
        }
      `}</style>
    </div >
  )
}
