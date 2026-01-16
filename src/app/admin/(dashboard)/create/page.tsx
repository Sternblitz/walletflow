"use client"

import { useState, useCallback } from "react"
import { Step1Client } from "./steps/step1-client"
import { Step2Concept } from "./steps/step2-concept"
import { Button } from "@/components/ui/button"
import { createCampaignAction } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft, ArrowRight, Palette } from "lucide-react"

export default function CreateWizardPage() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        clientName: "",
        slug: "",
        concept: "STAMP_CARD",
        designConfig: null,
    })
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleNext = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)

    const updateData = useCallback((data: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...data }))
    }, [])

    // Track created ID to redirect to editor
    const [createdId, setCreatedId] = useState<string | null>(null)

    const onSubmit = async () => {
        setLoading(true)
        const result = await createCampaignAction(formData)
        setLoading(false)

        if (result.success) {
            setCreatedId(result.id) // Assuming action returns id
            router.push(`/admin/campaign/${result.id}/edit`)
            toast.success("Kampagne erstellt! Leite zum Editor weiter...")
        } else {
            toast.error(result.error || "Fehler aufgetreten")
        }
    }

    const stepTitles = ['Kunde & Standort', 'Konzept']

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 bg-dot-white/[0.2]">
            <div className="w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header & Progress */}
                <div className="space-y-6 text-center">
                    <div className="space-y-2">
                        <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Schritt {step} von {stepTitles.length}
                        </span>
                        <h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                            {stepTitles[step - 1]}
                        </h1>
                    </div>

                    <div className="flex justify-center gap-2 max-w-xs mx-auto">
                        {[1, 2].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step
                                        ? 'bg-gradient-to-r from-white to-zinc-400 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                        : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/50 relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {step === 1 && <Step1Client data={formData} update={updateData} />}
                    {step === 2 && <Step2Concept data={formData} update={updateData} />}
                </div>

                {/* Navigation Actions */}
                <div className="flex justify-between items-center px-4">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="gap-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück
                    </Button>

                    {step < 2 ? (
                        <Button onClick={handleNext} size="lg" className="rounded-full px-8 bg-white text-black hover:bg-zinc-200 transition-all hover:scale-105">
                            Weiter
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={onSubmit}
                            disabled={loading}
                            size="lg"
                            className="rounded-full px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Designen & Starten
                                    <Palette className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
