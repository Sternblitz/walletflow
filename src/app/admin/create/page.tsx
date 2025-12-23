"use client"

import { useState, useCallback } from "react"
import { Step1Client } from "./steps/step1-client"
import { Step2Concept } from "./steps/step2-concept"
import { Step3DesignV2 } from "./steps/step3-editor"
import { Button } from "@/components/ui/button"
import { createCampaignAction } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft, ArrowRight } from "lucide-react"

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

    const [successView, setSuccessView] = useState<React.ReactNode | null>(null)

    const onSubmit = async () => {
        setLoading(true)
        const result = await createCampaignAction(formData)
        setLoading(false)

        if (result.success) {
            // Use the actual slug returned from server (which might have a random suffix)
            const finalSlug = result.slug || formData.slug
            const smartLink = `${window.location.origin}/start/${finalSlug}`
            setSuccessView(
                <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-50">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
                        <Check className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Erfolgreich erstellt! 🚀</h1>
                        <p className="text-xl text-muted-foreground">Deine Kampagne ist live.</p>
                    </div>

                    <div className="p-8 bg-zinc-900 rounded-2xl border border-white/10 max-w-md mx-auto space-y-4">
                        <p className="font-bold text-sm text-zinc-400 uppercase tracking-widest">Dein Smart Link</p>
                        <div className="bg-black p-4 rounded-lg border border-white/5 break-all font-mono text-green-400 select-all">
                            {smartLink}
                        </div>
                        <p className="text-xs text-zinc-500">
                            Teile diesen Link. Wir erkennen das Gerät automatisch.
                        </p>
                    </div>

                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" size="lg" onClick={() => router.push('/admin')}>
                            Zurück zum Cockpit
                        </Button>
                        <Button size="lg" onClick={() => window.open(smartLink, '_blank')}>
                            Smart Link öffnen 🔗
                        </Button>
                    </div>
                </div>
            )
        } else {
            toast.error(result.error || "Fehler aufgetreten")
        }
    }

    if (successView) return successView

    const stepTitles = ['Kunde', 'Kartentyp', 'Design']

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Neue Kampagne</h1>
                <p className="text-muted-foreground">Schritt {step} von 3: {stepTitles[step - 1]}</p>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2">
                {[1, 2, 3].map(i => (
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
                {step === 3 && <Step3DesignV2 data={formData} update={updateData} />}
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

                {step < 3 ? (
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
                            <>Erstelle...</>
                        ) : (
                            <>
                                Kampagne starten
                                <Check className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
