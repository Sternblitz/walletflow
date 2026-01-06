"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, createContext, useContext } from "react"
import {
    LayoutDashboard,
    Plus,
    Users,
    Send,
    Settings2,
    ChevronLeft,
    ChevronRight,
    LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

// Context for sidebar state
const SidebarContext = createContext<{
    collapsed: boolean
    setCollapsed: (v: boolean) => void
}>({ collapsed: false, setCollapsed: () => { } })

export function useSidebarState() {
    return useContext(SidebarContext)
}

interface SimpleSidebarProviderProps {
    children: React.ReactNode
}

export function SimpleSidebarProvider({ children }: SimpleSidebarProviderProps) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            <div className="flex h-screen w-full overflow-hidden bg-zinc-950">
                {children}
            </div>
        </SidebarContext.Provider>
    )
}

const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/create", icon: Plus, label: "Neue Kampagne", highlight: true },
    { href: "/admin/clients", icon: Users, label: "Clients" },
    { href: "/admin/push", icon: Send, label: "Push Requests" },
]

const systemItems = [
    { href: "/admin/settings", icon: Settings2, label: "Einstellungen" },
]

export function SimpleSidebar() {
    const { collapsed, setCollapsed } = useSidebarState()
    const pathname = usePathname()

    return (
        <aside
            className={cn(
                "relative flex flex-col h-full bg-zinc-900/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out shrink-0",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Header */}
            <div className={cn(
                "h-16 flex items-center border-b border-white/5 px-4",
                collapsed ? "justify-center" : "gap-3"
            )}>
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/10 shrink-0 shadow-lg backdrop-blur-md">
                    <img src="/LOGO.svg" alt="QARD" className="w-6 h-6 object-contain" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">QARD</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Engine</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                <div className={cn("text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2", collapsed ? "text-center" : "px-3")}>
                    {collapsed ? "•" : "Platform"}
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                                collapsed && "justify-center px-0",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5",
                                item.highlight && !isActive && "text-green-400"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0", item.highlight && !isActive && "text-green-400")} />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    )
                })}

                <div className={cn("text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-6 mb-2", collapsed ? "text-center" : "px-3")}>
                    {collapsed ? "•" : "System"}
                </div>
                {systemItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                                collapsed && "justify-center px-0",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/5 p-3">
                <div className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer",
                    collapsed && "justify-center px-0"
                )}>
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-bold shrink-0">
                        A
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">Admin</div>
                            <div className="text-xs text-zinc-500 truncate">admin@qard.io</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-zinc-800 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-50"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
        </aside>
    )
}

export function SimpleContent({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex-1 flex flex-col h-full overflow-auto bg-zinc-950">
            {children}
        </main>
    )
}
