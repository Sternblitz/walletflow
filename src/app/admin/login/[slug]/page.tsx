'use client'

import { useState } from 'react'
import { verifyPinAndLogin } from '@/app/client/actions'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, ArrowRight } from 'lucide-react'

export default function ClientLoginPage({ params }: { params: { slug: string } }) {
    const [pin, setPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const { slug } = params

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!pin.trim()) return

        setLoading(true)
        setError('')

        try {
            const res = await verifyPinAndLogin(slug, pin)

            if (res.error) {
                setError(res.error)
                setPin('')
            } else if (res.redirect) {
                router.push(res.redirect)
            }
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-8 animate-in zoom-in-50 duration-500">

                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800 shadow-xl">
                        <Lock className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Login</h1>
                    <p className="text-zinc-500">Gib deinen PIN Code ein</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative group">
                        <input
                            type="password"
                            inputMode="numeric"
                            autoFocus
                            placeholder="0000"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value)
                                setError('')
                            }}
                            className="w-full text-center text-4xl tracking-[1em] font-bold bg-zinc-900/50 border border-zinc-800 rounded-2xl py-6 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-700 placeholder:tracking-widest"
                            maxLength={4}
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg animate-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || pin.length < 4}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                Weiter <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-zinc-600 mt-4">
                            Demo PINs: Admin <b>1234</b> | Personal <b>0000</b>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}
