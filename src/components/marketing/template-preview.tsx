"use client"

import { cn } from "@/lib/utils"


interface TemplatePreviewProps {
    template: 'table-tent' | 'sticker-square' | 'sticker-round' | 'flyer-a4'
    data: {
        headline: string
        subline: string
        accentColor: string
        qrUrl: string
    }
    className?: string
}

export function TemplatePreview({ template, data, className }: TemplatePreviewProps) {
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data.qrUrl)}`

    // Common container styles
    const containerBase = "bg-white text-black overflow-hidden relative print:shadow-none print:border-0"

    // Scale container for preview (CSS transform scale would be applied by parent if needed)
    // Here we define the content layout for A4/A5/etc relative dimensions

    if (template === 'table-tent') {
        // A5 Folded Tent Card approach (Front Face shown)
        return (
            <div className={cn(containerBase, "aspect-[148/210] w-full flex flex-col items-center justify-between p-8 border", className)}>
                <div className="w-full h-4 bg-black/10 absolute top-0 left-0" style={{ background: data.accentColor }} />

                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <h1 className="text-3xl font-bold uppercase tracking-tight max-w-[80%]">
                        {data.headline}
                    </h1>

                    <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrImage} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                    </div>

                    <p className="text-lg text-zinc-600 font-medium max-w-[80%]">
                        {data.subline}
                    </p>
                </div>

                <div className="text-xs text-zinc-400 font-mono uppercase tracking-widest mt-auto">
                    Scannen & Sammeln
                </div>
                <div className="w-full h-2 absolute bottom-0 left-0" style={{ background: data.accentColor }} />
            </div>
        )
    }

    if (template === 'sticker-square') {
        return (
            <div className={cn(containerBase, "aspect-square w-full flex flex-col items-center justify-center p-6 border text-center space-y-4", className)}>
                <div className="w-full h-full absolute inset-0 opacity-10" style={{ background: data.accentColor }} />
                <h2 className="text-xl font-bold relative z-10">{data.headline}</h2>
                <div className="bg-white p-2 rounded-lg shadow-sm relative z-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrImage} alt="QR Code" className="w-32 h-32" />
                </div>
                <p className="text-sm font-medium relative z-10">{data.subline}</p>
            </div>
        )
    }

    if (template === 'sticker-round') {
        return (
            <div className={cn(containerBase, "aspect-square w-full rounded-full flex flex-col items-center justify-center p-8 border text-center space-y-3", className)}>
                <div className="w-full h-full absolute inset-0 opacity-5" style={{ background: data.accentColor }} />
                <h2 className="text-lg font-bold relative z-10 max-w-[90%] leading-tight">{data.headline}</h2>
                <div className="bg-white p-1.5 rounded-md relative z-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrImage} alt="QR Code" className="w-24 h-24" />
                </div>
            </div>
        )
    }

    if (template === 'flyer-a4') {
        return (
            <div className={cn(containerBase, "aspect-[210/297] w-full flex flex-col relative border", className)}>
                {/* Header Graphic */}
                <div className="h-1/4 w-full relative overflow-hidden" style={{ background: data.accentColor }}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                </div>

                <div className="flex-1 flex flex-col items-center text-center p-12 -mt-16 z-10">
                    <div className="bg-white p-6 rounded-2xl shadow-xl mb-12">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrImage} alt="QR Code" className="w-64 h-64" />
                    </div>

                    <h1 className="text-5xl font-black text-zinc-900 mb-6 leading-tight">
                        {data.headline}
                    </h1>
                    <p className="text-2xl text-zinc-600 max-w-md">
                        {data.subline}
                    </p>

                    <div className="mt-auto pt-12 flex flex-col items-center gap-4 opacity-50">
                        <div className="h-1 w-24 bg-zinc-200" />
                        <span className="font-mono text-sm uppercase tracking-widest">Powered by QARD</span>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
