"use client"

import Link from "next/link"
import * as React from "react"
import {
    SquareTerminal,
    Settings2,
    Send,
    Plus,
    LayoutDashboard,
    Users,
    Zap,
    LogOut,
    CreditCard,
    Megaphone,
    BarChart3
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" className="border-r border-white/5 bg-black/95 backdrop-blur-xl" {...props}>
            <SidebarHeader className="h-20 flex items-center justify-center px-4 mb-2 pt-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent data-[state=open]:bg-transparent group">
                            <Link href="/admin" className="flex items-center gap-3">
                                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300 ring-1 ring-white/10 group-hover:scale-105">
                                    <img src="/LOGO.svg" alt="QARD" className="size-6 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                                </div>
                                <div className="grid flex-1 text-left leading-tight">
                                    <span className="truncate font-bold tracking-tight text-white text-base">QARD</span>
                                    <span className="truncate text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-0.5">Engine</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="px-3 pt-4 space-y-6">

                {/* Main Action - Prominent */}
                <div className="px-2">
                    <Link href="/admin/create">
                        <div className="bg-gradient-to-r from-white to-zinc-200 text-black h-11 rounded-lg flex items-center justify-center gap-2 font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-white/10 cursor-pointer">
                            <Plus className="w-5 h-5" />
                            <span>Kunde anlegen</span>
                        </div>
                    </Link>
                </div>

                {/* Overview Group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-2 px-2">Cockpit</SidebarGroupLabel>
                    <SidebarMenu className="space-y-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Dashboard" asChild className="h-10 hover:bg-white/5 hover:text-white transition-all duration-200">
                                <Link href="/admin">
                                    <LayoutDashboard className="text-zinc-500 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white ml-2">Übersicht</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Performance" asChild className="h-10 hover:bg-white/5 hover:text-white transition-all duration-200 opacity-50 cursor-not-allowed">
                                <Link href="#" onClick={(e) => e.preventDefault()}>
                                    <BarChart3 className="text-zinc-500 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white ml-2">Analytics</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Management Group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-2 px-2">Verwaltung</SidebarGroupLabel>
                    <SidebarMenu className="space-y-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Kunden" asChild className="h-10 hover:bg-white/5 hover:text-white transition-all duration-200">
                                <Link href="/admin/clients">
                                    <Users className="text-zinc-500 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white ml-2">Alle Kunden</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Operations Group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-2 px-2">Operations</SidebarGroupLabel>
                    <SidebarMenu className="space-y-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Push Inbox" asChild className="h-10 hover:bg-white/5 hover:text-white transition-all duration-200">
                                <Link href="/admin/push-requests">
                                    <Megaphone className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white ml-2">Push Requests</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Automations" asChild className="h-10 hover:bg-white/5 hover:text-white transition-all duration-200">
                                <Link href="/admin/automations">
                                    <Zap className="text-zinc-500 group-hover:text-yellow-400 transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white ml-2">Automations</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

            </SidebarContent>

            <SidebarFooter className="border-t border-white/5 p-4 bg-black/40">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <Avatar className="h-9 w-9 rounded-lg border border-white/10 bg-zinc-900">
                                        <AvatarFallback className="rounded-lg bg-zinc-900 font-bold text-xs text-zinc-400">QA</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                        <span className="truncate font-semibold text-white">Agency Admin</span>
                                        <span className="truncate text-xs text-zinc-500">owner@qard.io</span>
                                    </div>
                                    <SquareTerminal className="ml-auto size-4 text-zinc-500" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="end"
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-zinc-900 border-white/10 text-zinc-400 p-2 shadow-xl backdrop-blur-xl"
                            >
                                <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5 my-2" />
                                <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer rounded-lg">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
