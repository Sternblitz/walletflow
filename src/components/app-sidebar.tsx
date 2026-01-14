"use client"

import Link from "next/link"
import * as React from "react"
import {
    LayoutDashboard,
    Users,
    Zap,
    Megaphone,
    BarChart3,
    LogOut,
    Plus,
    Settings2,
    CreditCard,
    MoreHorizontal,
    Database,
    Radio
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
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

    return (
        <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar/95 backdrop-blur-2xl transition-all duration-300" {...props}>
            {/* Header: Adaptive height for collapsed state */}
            <SidebarHeader className="h-28 group-data-[collapsible=icon]:h-14 flex items-center justify-center pt-8 pb-4 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:pt-4 transition-all duration-300">
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent data-[state=open]:bg-transparent group/logo group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center">
                            <Link href="/admin" className="flex items-center gap-4 pl-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-full">
                                {/* Techy Logo Container - Icon Centered */}
                                <div className="relative flex aspect-square size-12 group-data-[collapsible=icon]:size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)] group-hover/logo:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4)] transition-all duration-500">
                                    <div className="absolute inset-0 bg-indigo-500/10 rounded-xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>
                                    <img src="/LOGO.svg" alt="QARD" className="size-6 group-data-[collapsible=icon]:size-5 object-contain drop-shadow-lg" />
                                </div>
                                <div className="grid flex-1 text-left leading-none space-y-1.5 group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-bold tracking-tight text-sidebar-foreground text-lg">QARD</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse"></span>
                                        <span className="truncate text-[9px] text-muted-foreground font-mono font-medium uppercase tracking-widest">ENGINE v2.0</span>
                                    </div>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4 space-y-6 custom-scrollbar group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:space-y-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:w-full">

                {/* Primary Action - INTENSIFIED Button */}
                <SidebarMenu className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Neuer Kunde"
                            className="group h-11 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0 bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border border-primary/50 hover:border-primary/80 text-primary-foreground font-bold transition-all duration-300 shadow-[0_0_15px_-4px_rgba(99,102,241,0.5)] justify-center group-data-[collapsible=icon]:rounded-md"
                        >
                            <Link href="/admin/create" className="flex items-center justify-center gap-2 w-full h-full">
                                <Plus className="w-5 h-5 text-indigo-300 group-hover:text-white transition-all group-hover:rotate-90 duration-300 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-5" />
                                <span className="font-mono text-xs font-bold tracking-wider uppercase text-indigo-100 group-hover:text-white group-data-[collapsible=icon]:hidden">Neuer Kunde</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Mainframe */}
                <SidebarGroup className="space-y-1 group-data-[collapsible=icon]:space-y-1 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center">
                    <SidebarGroupLabel className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground/70 uppercase px-2 mb-2 flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <LayoutDashboard className="w-3 h-3" /> MAINFRAME
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Übersicht" asChild className="h-10 rounded-md hover:bg-sidebar-accent/50 data-[active=true]:bg-sidebar-accent/50 transition-all text-sidebar-foreground/70 hover:text-sidebar-foreground group border border-transparent hover:border-sidebar-border/50 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center">
                                <Link href="/admin" className="gap-3 flex items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:w-full">
                                    <LayoutDashboard className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-colors" />
                                    <span className="font-medium tracking-wide text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden">Übersicht</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Analytics" asChild disabled className="h-10 rounded-md opacity-50 cursor-not-allowed border border-transparent group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center">
                                <Link href="#" className="gap-3 flex items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:w-full">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="font-medium tracking-wide text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden">Analytics</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Database */}
                <SidebarGroup className="space-y-1 group-data-[collapsible=icon]:space-y-1 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center">
                    <SidebarGroupLabel className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground/70 uppercase px-2 mb-2 flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <Database className="w-3 h-3" /> DATABASE
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Kunden" asChild className="h-10 rounded-md hover:bg-sidebar-accent/50 transition-all text-sidebar-foreground/70 hover:text-sidebar-foreground group border border-transparent hover:border-sidebar-border/50 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center">
                                <Link href="/admin/clients" className="gap-3 flex items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:w-full">
                                    <Users className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:text-emerald-400 transition-colors" />
                                    <span className="font-medium tracking-wide text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden">Alle Kunden</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Signals */}
                <SidebarGroup className="space-y-1 group-data-[collapsible=icon]:space-y-1 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center">
                    <SidebarGroupLabel className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground/70 uppercase px-2 mb-2 flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <Radio className="w-3 h-3" /> SIGNALS
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Push Inbox" asChild className="h-10 rounded-md hover:bg-sidebar-accent/50 transition-all text-sidebar-foreground/70 hover:text-sidebar-foreground group border border-transparent hover:border-sidebar-border/50 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center">
                                <Link href="/admin/push-requests" className="gap-3 flex items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:w-full">
                                    <Megaphone className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:text-blue-400 transition-colors" />
                                    <span className="font-medium tracking-wide text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden">Push Inbox</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Automations" asChild className="h-10 rounded-md hover:bg-sidebar-accent/50 transition-all text-sidebar-foreground/70 hover:text-sidebar-foreground group border border-transparent hover:border-sidebar-border/50 group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center">
                                <Link href="/admin/automations" className="gap-3 flex items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:w-full">
                                    <Zap className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:text-yellow-400 transition-colors" />
                                    <span className="font-medium tracking-wide text-sm whitespace-nowrap group-data-[collapsible=icon]:hidden">Automations</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-sidebar-border/40 bg-sidebar/50 backdrop-blur-xl">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent hover:bg-sidebar-accent transition-colors rounded-lg gap-3 h-12 px-2 border border-transparent hover:border-sidebar-border/50"
                                >
                                    <div className="relative">
                                        <Avatar className="h-9 w-9 rounded-lg border border-sidebar-border shadow-sm">
                                            <AvatarFallback className="rounded-lg bg-sidebar-primary/10 font-bold text-xs text-sidebar-primary">QA</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-sidebar-background rounded-full"></div>
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold text-sidebar-foreground text-xs">Agency Admin</span>
                                        <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wider font-mono">System Owner</span>
                                    </div>
                                    <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="bottom"
                                align="end"
                                className="w-56 rounded-xl bg-popover border-border text-popover-foreground p-2 shadow-2xl backdrop-blur-xl mb-2"
                            >
                                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">Account</DropdownMenuLabel>
                                <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground cursor-pointer rounded-lg px-2 py-2">
                                    <Settings2 className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground cursor-pointer rounded-lg px-2 py-2">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border my-2" />
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg px-2 py-2">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail className="hover:after:bg-sidebar-primary" />
        </Sidebar>
    )
}
