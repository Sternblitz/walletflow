'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Check, RotateCcw, Sliders } from 'lucide-react'

interface ImageAdjustmentModalProps {
    imageUrl: string
    isOpen: boolean
    onClose: () => void
    onSave: (newUrl: string, file: File) => void
}

export function ImageAdjustmentModal({ imageUrl, isOpen, onClose, onSave }: ImageAdjustmentModalProps) {
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
    const [saturation, setSaturation] = useState(100)
    const [loading, setLoading] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [previewUrl, setPreviewUrl] = useState(imageUrl)

    // Reset Filters
    const reset = () => {
        setBrightness(100)
        setContrast(100)
        setSaturation(100)
    }

    // Apply filters via CSS for preview 
    // (We use CSS for instant feedback, but Canvas for final save)
    const filterStyle = {
        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
    }

    const handleSave = async () => {
        setLoading(true)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.crossOrigin = "anonymous" // crucial for canvas export
        img.src = imageUrl

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height

            if (ctx) {
                // Apply filters to context
                ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                ctx.drawImage(img, 0, 0, img.width, img.height)

                // Export
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "edited-image.png", { type: "image/png" })
                        const url = URL.createObjectURL(blob)
                        onSave(url, file)
                        onClose()
                    }
                    setLoading(false)
                }, 'image/png')
            }
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-[#333] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[#333]">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Sliders size={18} /> Bild bearbeiten
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-[500px]">
                    {/* Preview Area */}
                    <div className="flex-1 bg-[#0f0f0f] flex items-center justify-center p-6 overflow-hidden relative">
                        <img
                            src={imageUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain shadow-lg rounded-md transition-all duration-100"
                            style={filterStyle}
                        />
                    </div>

                    {/* Controls Side */}
                    <div className="w-full md:w-80 bg-[#161616] border-l border-[#333] p-6 flex flex-col gap-8">

                        {/* Brightness */}
                        <div className="control-group">
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Helligkeit</label>
                                <span className="text-xs text-white">{brightness}%</span>
                            </div>
                            <input
                                type="range" min="0" max="200" value={brightness}
                                onChange={(e) => setBrightness(Number(e.target.value))}
                                className="w-full accent-emerald-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Contrast */}
                        <div className="control-group">
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kontrast</label>
                                <span className="text-xs text-white">{contrast}%</span>
                            </div>
                            <input
                                type="range" min="0" max="200" value={contrast}
                                onChange={(e) => setContrast(Number(e.target.value))}
                                className="w-full accent-emerald-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Saturation */}
                        <div className="control-group">
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sättigung (Weißwert)</label>
                                <span className="text-xs text-white">{saturation}%</span>
                            </div>
                            <input
                                type="range" min="0" max="200" value={saturation}
                                onChange={(e) => setSaturation(Number(e.target.value))}
                                className="w-full accent-emerald-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="mt-auto flex gap-3">
                            <button
                                onClick={reset}
                                className="flex-1 py-2 px-4 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} /> Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-[2] py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Speichere...' : (
                                    <>
                                        <Check size={16} /> Speichern
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
