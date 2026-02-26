"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Factory, HardHat, FileText, Settings, Users, Truck, LogOut, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type AppSidebarProps = {
    user: {
        username?: string | null
        role?: "AdminBP" | "OperatorBP" | string
    }
}

export function AppSidebar({ user }: AppSidebarProps) {
    const pathname = usePathname()

    const adminNav = [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
        { title: "Input Produksi", url: "/admin/produksi", icon: Factory },
        { title: "Surat Jalan & Retase", url: "/admin/retase", icon: FileText },
        { title: "Semen Masuk", url: "/admin/material-in", icon: FileText },
        { title: "Data Karyawan", url: "/admin/karyawan", icon: Users },
        { title: "Data Kendaraan", url: "/admin/kendaraan", icon: Truck },
        { title: "Data Customer", url: "/admin/customer", icon: HardHat },
        { title: "Mutu Beton", url: "/admin/mutu", icon: Settings },
        { title: "Item Pekerjaan", url: "/admin/item-pekerjaan", icon: Settings },
    ]

    const navItems = adminNav

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="h-16 flex justify-center border-b pt-4 px-4 overflow-hidden">
                <div className="flex items-center gap-3 font-semibold text-primary">
                    <div className="p-1.5 bg-primary rounded-xl">
                        <Factory className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="truncate text-base tracking-tight">BP ERP System</span>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 pt-4 gap-1">
                <SidebarMenu>
                    {navItems.map((item) => {
                        const isActive = pathname === item.url || (pathname.startsWith(item.url + '/') && item.url !== '/admin')
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.title}
                                    className="rounded-lg h-10 font-medium text-[14px]"
                                >
                                    <Link href={item.url}>
                                        <item.icon className="!h-4 !w-4 opacity-75" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>

            <SidebarSeparator className="mx-4" />

            <SidebarFooter className="p-4 pb-6">
                <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-3 py-2">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-200">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold capitalize text-slate-800">{user?.username || "Guest"}</span>
                        <span className="truncate text-[11px] font-medium text-slate-500 uppercase tracking-wider">{user?.role}</span>
                    </div>
                    <div className="flex items-center">
                        <Link href="/api/auth/signout" title="Sign Out">
                            <LogOut className="h-5 w-5 text-slate-400 hover:text-red-500 transition-colors" />
                        </Link>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
