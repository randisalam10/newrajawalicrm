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
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Factory, HardHat, FileText, Settings, Users, Truck, LogOut, LayoutDashboard, ShieldCheck, ChevronRight, BarChart3, Receipt } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type AppSidebarProps = {
    user: {
        username?: string | null
        role?: "AdminBP" | "OperatorBP" | string
    }
}

export function AppSidebar({ user }: AppSidebarProps) {
    const pathname = usePathname()

    const navGroups = [
        {
            title: "Utama",
            items: [
                { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
            ]
        },
        {
            title: "Operasional & Transaksi",
            items: [
                { title: "Input Produksi", url: "/admin/produksi", icon: Factory },
                { title: "Semen Masuk / Kartu Stok", url: "/admin/material-in", icon: FileText },
                { title: "Surat Jalan & Retase", url: "/admin/retase", icon: Truck },
                { title: "Penggunaan Material", url: "/admin/material-usage", icon: Factory },
            ]
        },
        {
            title: "Laporan & Tagihan",
            items: [
                { title: "Rekap Tagihan (Invoice)", url: "/admin/reports/billing", icon: Receipt },
                { title: "Rekap Gaji Supir", url: "/admin/reports/retase", icon: BarChart3 },
            ]
        },
        {
            title: "Data Master",
            items: [
                { title: "Data Karyawan", url: "/admin/karyawan", icon: Users },
                { title: "Data Kendaraan", url: "/admin/kendaraan", icon: Truck },
                { title: "Data Customer", url: "/admin/customer", icon: HardHat },
                { title: "Mutu Beton", url: "/admin/mutu", icon: Settings },
                { title: "Item Pekerjaan", url: "/admin/item-pekerjaan", icon: Settings },
                ...(user?.role === "SuperAdminBP" ? [{ title: "Master Cabang", url: "/admin/cabang", icon: Factory }] : [])
            ]
        },
        ...(user?.role === "SuperAdminBP" ? [
            {
                title: "Administrator & Akses",
                items: [
                    { title: "Manajemen User", url: "/admin/users", icon: ShieldCheck },
                ]
            }
        ] : []),
    ]

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

            <SidebarContent className="px-3 pt-4 gap-4">
                {navGroups.map((group) => (
                    <Collapsible key={group.title} defaultOpen={true} className="group/collapsible">
                        <SidebarGroup className="p-0">
                            <CollapsibleTrigger asChild>
                                <SidebarGroupLabel className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 cursor-pointer hover:text-primary transition-colors">
                                    {group.title}
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarGroupLabel>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.url || (pathname.startsWith(item.url + '/') && item.url !== '/admin')
                                            return (
                                                <SidebarMenuItem key={item.title}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={isActive}
                                                        tooltip={item.title}
                                                        className="rounded-lg h-9 font-medium text-[13px] border border-transparent data-[active=true]:border-slate-200 data-[active=true]:bg-slate-100/50 data-[active=true]:shadow-sm transition-all"
                                                    >
                                                        <Link href={item.url}>
                                                            <item.icon className="!h-4 !w-4 opacity-70" />
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            )
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                ))}
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
