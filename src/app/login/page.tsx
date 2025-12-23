import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "../auth/actions"
import Link from "next/link"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6 p-6 glass-card rounded-xl border border-white/10">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-sm text-zinc-400">Enter your email to enter the cockpit</p>
                </div>

                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="m@example.com" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                        </div>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <Button
                        formAction={async (formData) => {
                            'use server'
                            await login(formData)
                        }}
                        className="w-full"
                    >
                        Sign In
                    </Button>
                </form>

                <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    )
}
