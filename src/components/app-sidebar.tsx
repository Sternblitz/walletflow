"use client"

import Link from "next/link"
import * as React from "react"
import {
    SquareTerminal,
    Bot,
    Settings2,
    LifeBuoy,
    Send,
    Plus,
    LayoutDashboard,
    Users,
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
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" className="border-r border-white/5 bg-zinc-950/90 backdrop-blur-xl" {...props}>
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-white/5 px-4 mb-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent data-[state=open]:bg-transparent">
                            <Link href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-400 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                    <img src="/LOGO.svg" alt="QARD" className="size-4 invert" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                    <span className="truncate font-bold tracking-tight text-white">QARD</span>
                                    <span className="truncate text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Engine</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="px-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-2 px-2">Platform</SidebarGroupLabel>
                    <SidebarMenu className="space-y-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Dashboard" asChild className="hover:bg-white/5 hover:text-white transition-colors">
                                <Link href="/admin">
                                    <LayoutDashboard className="text-zinc-400 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white">Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Neue Kampagne" asChild className="hover:bg-white/5 hover:text-white transition-colors">
                                <Link href="/admin/create">
                                    <Plus className="text-green-500" />
                                    <span className="font-bold text-white">Neue Kampagne</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Clients" asChild className="hover:bg-white/5 hover:text-white transition-colors">
                                <Link href="/admin/clients">
                                    <Users className="text-zinc-400 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white">Clients</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Push Inbox" asChild className="hover:bg-white/5 hover:text-white transition-colors">
                                <Link href="/admin/push">
                                    <Send className="text-zinc-400 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white">Push Requests</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="mt-auto pb-4">
                    <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-2 px-2">System</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Einstellungen" asChild className="hover:bg-white/5 hover:text-white transition-colors">
                                <Link href="#">
                                    <Settings2 className="text-zinc-400 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-zinc-400 group-hover:text-white">Settings</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-white/5 p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white/5"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg border border-white/10">
                                        <AvatarFallback className="rounded-lg bg-zinc-900 font-bold text-zinc-400">CN</AvatarFallback>
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
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-zinc-900 border-white/10 text-zinc-400"
                            >
                                <DropdownMenuItem>
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400 focus:text-red-300">
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
