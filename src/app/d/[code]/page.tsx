import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DynamicRedirectPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params
    const supabase = await createClient()

    // Lookup the dynamic route
    const { data: route, error } = await supabase
        .from('dynamic_routes')
        .select('target_slug, is_active')
        .eq('code', code.toUpperCase())
        .single()

    if (error || !route || !route.is_active) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-10 text-center">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Link nicht gefunden</h1>
                    <p className="text-gray-400">Dieser QR-Code ist leider nicht mehr aktiv.</p>
                    <p className="text-gray-500 text-sm mt-4 font-mono">{code}</p>
                </div>
            </div>
        )
    }

    // Redirect to the target campaign slug
    redirect(`/start/${route.target_slug}`)
}
