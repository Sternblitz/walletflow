'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login } from "./actions"
import { ArrowRight, Lock, Mail, QrCode, ChevronRight, Terminal, AlertCircle } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFormStatus } from "react-dom"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(79,70,229,0.3)] border border-white/10 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? (
                <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verbindung...
                </span>
            ) : (
                <>
                    <span className="mr-2">Verbinden</span>
                    <ArrowRight className="w-5 h-5" />
                </>
            )}
        </Button>
    )
}

export default function LoginPage() {
    const [showLogin, setShowLogin] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleLogin(formData: FormData) {
        setError(null)
        const result = await login(formData)

        if (result?.error) {
            setError(result.error)
        }
        // If no error, the action will redirect automatically
    }

    return (
        <div className="dark relative min-h-screen w-full overflow-hidden bg-[#030303] text-zinc-100 flex items-center justify-center font-sans selection:bg-indigo-500/30">
            {/* Background Ambience - Fixed Dark Mode */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/10 blur-[120px] animate-pulse-slow delay-1000" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-cyan-600/5 blur-[100px]" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] scale-150" />
            </div>

            <AnimatePresence mode="wait">
                {!showLogin ? (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="relative z-10 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setShowLogin(true)}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-center group"
                        >
                            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-black border border-white/10 mb-8 shadow-[0_0_50px_-10px_rgba(79,70,229,0.3)] group-hover:shadow-[0_0_80px_-20px_rgba(79,70,229,0.6)] transition-all duration-700">
                                <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <QrCode className="w-10 h-10 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tighter mb-4">
                                QARD Engine
                            </h1>
                            <div className="flex items-center justify-center gap-2 text-indigo-400 font-mono text-sm tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                <Terminal className="w-4 h-4" />
                                <span>System Online</span>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 1 }}
                                className="mt-16 flex flex-col items-center gap-2"
                            >
                                <span className="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-400 text-xs font-medium tracking-widest hover:bg-white/10 transition-colors">
                                    ENTER COMMAND CENTER
                                </span>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="login"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full max-w-[420px] relative z-10 p-6 perspective-1000"
                    >
                        {/* 3D Glass Card */}
                        <div className="relative flex flex-col items-center group">
                            {/* Glowing Border Gradient */}
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 rounded-[32px] blur opacity-75 animate-pulse-slow"></div>

                            <div className="relative w-full bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-[30px] border border-white/10 p-8 md:p-12 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
                                {/* Back Button */}
                                <button
                                    onClick={() => {
                                        setShowLogin(false)
                                        setError(null)
                                    }}
                                    className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>

                                {/* Header & Logo */}
                                <div className="text-center mb-10 space-y-3">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_0_30px_-5px_rgba(79,70,229,0.3)] mb-4 border border-white/20">
                                        <QrCode className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
                                        Command Center
                                    </h1>
                                    <p className="text-sm text-zinc-400 font-medium">
                                        Identifiziere dich.
                                    </p>
                                </div>

                                {/* Error Message */}
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                                        >
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-300 font-medium">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Login Form */}
                                <form action={handleLogin} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="group/input relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <Input
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-2xl focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 transition-all font-medium"
                                                placeholder="E-Mail"
                                                required
                                            />
                                        </div>
                                        <div className="group/input relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                name="password"
                                                type="password"
                                                autoComplete="current-password"
                                                className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-2xl focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 transition-all font-medium"
                                                placeholder="Zugangscode"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <SubmitButton />
                                </form>

                                {/* Footer */}
                                <div className="mt-8 text-center flex justify-center">
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        Secure Connection
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
