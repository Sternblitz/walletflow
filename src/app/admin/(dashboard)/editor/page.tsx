'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Legacy redirect - now using main campaign wizard
 */
export default function EditorRedirectPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to main campaign creation
        router.replace('/admin/create')
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground">Weiterleitung...</p>
            </div>
        </div>
    )
}
