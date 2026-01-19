import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DarkModeEnforcer } from "@/components/admin/DarkModeEnforcer"


export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // CRITICAL: Server-side auth check
    // This protects the entire /admin section
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        // Not authenticated - redirect to login
        // Works correctly on admin.getqard.com/login
        redirect('/login')
    }

    return (
        <SidebarProvider>
            {/* Force Dark Mode for Admin */}
            <DarkModeEnforcer />

            {/* Ambient Background */}
            <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
                <div className="dark:block hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-fuchsia-900/10 blur-[120px] animate-pulse-slow delay-1000" />
                    <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] rounded-full bg-cyan-900/5 blur-[100px]" />
                </div>
            </div>

            {/* Sidebar - It handles its own fixed positioning and creates a spacer */}
            <AppSidebar />

            {/* Main Content Area - SidebarInset automatically gets margin-left from sidebar */}
            <SidebarInset>
                {/* Header inside the content area */}
                <header className="sticky top-0 z-40 h-14 border-b border-border/40 bg-background/95 backdrop-blur-xl flex items-center gap-4 px-4">
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
                    <Separator orientation="vertical" className="h-5 bg-border/60" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                        <h2 className="text-xs font-mono font-bold text-foreground/80 uppercase tracking-[0.2em] hidden sm:block">
                            QARD <span className="text-muted-foreground font-normal">COMMAND CENTER</span>
                        </h2>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto min-h-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
