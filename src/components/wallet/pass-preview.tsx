'use client'

import { useState } from 'react'
import { WalletPassDraft, PassField } from '@/lib/wallet/types'
import { getLayoutDefinition } from '@/lib/wallet/layout-definitions'
import { RotateCcw } from 'lucide-react'

interface PassPreviewProps {
  draft: WalletPassDraft
  scale?: number
}

/**
 * PassPreview - Matches Apple Wallet layout as closely as possible
 * Now with flip functionality to show back side!
 * 
 * Apple's Store Card Layout:
 * ┌─────────────────────────────────┐
 * │ [LOGO]              HEADER →    │ ← Logo left, header right
 * ├─────────────────────────────────┤
 * │         [STRIP IMAGE]           │ ← Strip covers this area
 * │      ┌─────────────────┐        │
 * │      │   PRIMARY VAL   │        │ ← Primary value LARGE
 * │      │   primary label │        │ ← Primary label small
 * │      └─────────────────┘        │
 * ├─────────────────────────────────┤
 * │ SEC1   SEC2   AUX1   AUX2       │ ← All on ONE row
 * ├─────────────────────────────────┤
 * │         [QR CODE]               │
 * └─────────────────────────────────┘
 */
export function PassPreview({ draft, scale = 1 }: PassPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const { colors, fields, content, barcode } = draft
  const def = getLayoutDefinition(draft.meta.style)

  // Combine secondary + auxiliary fields (Apple shows them on one row for store cards)
  const bottomFields = [...fields.secondaryFields, ...fields.auxiliaryFields]

  return (
    <div className="pass-preview-wrapper" style={{ transform: `scale(${scale})` }}>
      {/* Flip Button */}
      <button
        className="flip-button"
        onClick={() => setIsFlipped(!isFlipped)}
        title={isFlipped ? 'Vorderseite zeigen' : 'Rückseite zeigen'}
      >
        <RotateCcw size={16} />
        {isFlipped ? 'Vorne' : 'Hinten'}
      </button>

      <div className={`flip-container ${isFlipped ? 'flipped' : ''}`}>
        {/* FRONT SIDE */}
        <div
          className="pass-preview pass-front"
          style={{
            backgroundColor: colors.backgroundColor,
            color: colors.foregroundColor,
            ...(draft.images.background && !draft.images.strip ? {
              backgroundImage: `url(${draft.images.background.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {})
          }}
        >
          {/* Helper overlay for background tint if needed */}
          {draft.images.background && !draft.images.strip && (
            <div className="background-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
          )}

          {/* Content Content Container (Relative for z-index) */}
          <div className="pass-content">
            {/* Logo + Header Row */}
            <div className="pass-header">
              <div className="logo-area">
                {draft.images.logo ? (
                  <img src={draft.images.logo.url} alt="Logo" className="logo-image" />
                ) : (
                  <span className="logo-text">{content.logoText || content.organizationName || 'LOGO'}</span>
                )}
              </div>
              <div className="header-fields">
                {fields.headerFields.map(f => (
                  <div className="field header-field" key={f.key}>
                    <span className="field-value">{f.value}</span>
                    {f.label && <span className="field-label" style={{ color: colors.labelColor }}>{f.label}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Strip Area (storeCard, coupon, or eventTicket with strip) */}
            {def.allowedImages.includes('strip') && (
              <div className="strip-area">
                {draft.images.strip ? (
                  <img src={draft.images.strip.url} alt="Strip" />
                ) : (
                  // Only show placeholder if NOT eventTicket with background
                  !(def.style === 'eventTicket' && (draft.images.background || draft.images.thumbnail)) && (
                    <div className="strip-placeholder" />
                  )
                )}

                {/* Primary field overlays the strip */}
                <div className="primary-overlay">
                  {fields.primaryFields.map(f => (
                    <div className="field primary-field" key={f.key}>
                      <span className="primary-value">{f.value}</span>
                      {f.label && <span className="primary-label" style={{ color: colors.labelColor }}>{f.label}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thumbnail Area (generic or eventTicket WITHOUT strip) */}
            {def.allowedImages.includes('thumbnail') && (!draft.images.strip) && (
              <div className="content-with-thumbnail">
                <div className="primary-no-strip">
                  {/* If we didn't show primary fields in strip area (because no strip), show them here */}
                  {(!def.allowedImages.includes('strip') || !draft.images.strip) && fields.primaryFields.map(f => (
                    <div className="field primary-field" key={f.key}>
                      <span className="primary-value">{f.value}</span>
                      {f.label && <span className="primary-label" style={{ color: colors.labelColor }}>{f.label}</span>}
                    </div>
                  ))}
                </div>
                {draft.images.thumbnail && (
                  <div className="thumbnail-area">
                    <img src={draft.images.thumbnail.url} alt="Thumbnail" />
                  </div>
                )}
              </div>
            )}

            {/* Secondary + Auxiliary Fields (ONE ROW per Apple) */}
            {bottomFields.length > 0 && (
              <div className="bottom-fields">
                {bottomFields.map(f => (
                  <div className="field bottom-field" key={f.key}>
                    <span className="field-value">{f.value}</span>
                    {f.label && <span className="field-label" style={{ color: colors.labelColor }}>{f.label}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Barcode */}
            <div className="barcode-area">
              <div className="barcode-container">
                {barcode.format.includes('QR') || barcode.format.includes('Aztec') ? (
                  <div className="qr-code" />
                ) : (
                  <div className="linear-barcode" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="pass-preview pass-back"
          style={{
            backgroundColor: colors.backgroundColor,
            color: colors.foregroundColor,
          }}
        >
          <div className="back-content">
            <div className="back-header">
              <span className="back-title">ⓘ Kartendetails</span>
            </div>

            {fields.backFields && fields.backFields.length > 0 ? (
              <div className="back-fields">
                {fields.backFields.map((f, idx) => (
                  <div className="back-field" key={f.key || idx}>
                    <span className="back-field-label" style={{ color: colors.labelColor }}>{f.label}</span>
                    <span className="back-field-value">{f.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="back-empty">
                <p>Keine Rückseiten-Infos</p>
                <p className="back-hint">Füge Felder unter "Rückseite" im Editor hinzu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pass-preview-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform-origin: top center;
          perspective: 1000px;
        }

        .flip-button {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .flip-button:hover {
          background: rgba(255,255,255,0.2);
        }

        .flip-container {
          position: relative;
          width: 340px;
          min-height: 440px;
          transform-style: preserve-3d;
          transition: transform 0.6s ease;
        }

        .flip-container.flipped {
          transform: rotateY(180deg);
        }
        
        .pass-preview {
          position: absolute;
          width: 340px;
          min-height: 440px;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 
            0 20px 60px rgba(0,0,0,0.4),
            0 0 0 1px rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
          backface-visibility: hidden;
        }

        .pass-front {
          z-index: 2;
        }

        .pass-back {
          transform: rotateY(180deg);
          z-index: 1;
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .pass-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          flex: 1;
        }
        
        /* Header: Logo + Header Fields */
        .pass-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 16px 8px;
        }
        
        .logo-area {
          flex: 0 0 auto;
        }
        
        .logo-image {
          max-height: 44px;
          max-width: 140px;
          object-fit: contain;
        }
        
        .logo-text {
          font-size: 1.1rem;
          font-weight: 700;
        }
        
        .header-fields {
          display: flex;
          gap: 12px;
          text-align: right;
        }
        
        .header-field {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .header-field .field-value {
          font-size: 0.95rem;
          font-weight: 600;
        }
        
        .header-field .field-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }
        
        /* Strip Area */
        .strip-area {
          position: relative;
          height: 144px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .strip-area img {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .strip-placeholder {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 100%);
        }
        
        .primary-overlay {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 20px;
        }
        
        .primary-field {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .primary-value {
          font-size: 2.8rem;
          font-weight: 300;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        
        .primary-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 6px;
          opacity: 0.9;
        }
        
        /* Thumbnail layout (generic) */
        .content-with-thumbnail {
          display: flex;
          padding: 16px;
          gap: 16px;
        }
        
        .primary-no-strip {
          flex: 1;
        }
        
        .thumbnail-area img {
          width: 90px;
          height: 90px;
          border-radius: 8px;
          object-fit: cover;
        }
        
        /* Bottom Fields (Secondary + Auxiliary) */
        .bottom-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          padding: 12px 16px;
        }
        
        .bottom-field {
          display: flex;
          flex-direction: column;
        }
        
        .bottom-field .field-value {
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .bottom-field .field-label {
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.7;
        }
        
        /* Barcode Area */
        .barcode-area {
          margin-top: auto;
          padding: 16px;
          display: flex;
          justify-content: center;
        }
        
        .barcode-container {
          background: white;
          border-radius: 8px;
          padding: 12px;
        }
        
        .qr-code {
          width: 100px;
          height: 100px;
          background-image: 
            linear-gradient(45deg, #333 25%, transparent 25%),
            linear-gradient(-45deg, #333 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #333 75%),
            linear-gradient(-45deg, transparent 75%, #333 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        }
        
        .linear-barcode {
          width: 180px;
          height: 50px;
          background: repeating-linear-gradient(
            90deg,
            #000 0px,
            #000 2px,
            #fff 2px,
            #fff 5px
          );
        }

        .field-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .field-value {
          font-weight: 500;
        }

        /* BACK SIDE STYLES */
        .back-content {
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .back-header {
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }

        .back-title {
          font-size: 0.9rem;
          font-weight: 600;
          opacity: 0.8;
        }

        .back-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          flex: 1;
        }

        .back-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .back-field-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .back-field-value {
          font-size: 0.9rem;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .back-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.5;
          text-align: center;
        }

        .back-empty p {
          margin: 0;
        }

        .back-hint {
          font-size: 0.75rem;
          margin-top: 8px !important;
        }
      `}</style>
    </div>
  )
}

