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
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Neue Kampagne</h1>
                <p className="text-muted-foreground">Schritt {step} von 2: {stepTitles[step - 1]}</p>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2">
                {[1, 2].map(i => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-white/10'
                            }`}
                    />
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 min-h-[400px]">
                {step === 1 && <Step1Client data={formData} update={updateData} />}
                {step === 2 && <Step2Concept data={formData} update={updateData} />}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück
                </Button>

                {step < 2 ? (
                    <Button onClick={handleNext} className="gap-2">
                        Weiter
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={onSubmit}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Designen & Starten
                                <Palette className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                )}
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
