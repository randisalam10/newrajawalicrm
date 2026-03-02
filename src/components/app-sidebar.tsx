"use client"

import { useState, useEffect } from "react"

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
import { Factory, HardHat, FileText, Settings, Users, Truck, LogOut, LayoutDashboard, ShieldCheck, ChevronRight, BarChart3, Receipt, CalendarClock, Layers, ShoppingCart, Box, Store, KeyRound, PenTool } from "lucide-react"
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
    const [openGroup, setOpenGroup] = useState<string | null>("Operasional & Transaksi")

    const navGroups = [
        {
            title: "Monitoring",
            defaultOpen: true,
            items: [
                { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
                { title: "Planning Pengecoran", url: "/admin/planning", icon: CalendarClock },
            ]
        },
        {
            title: "Operasional & Transaksi",
            defaultOpen: true,
            items: [
                { title: "Input Produksi", url: "/admin/produksi", icon: Factory },
                { title: "Surat Jalan & Retase", url: "/admin/retase", icon: Truck },
                { title: "Data Customer", url: "/admin/customer", icon: HardHat },
                { title: "Semen Masuk / Kartu Stok", url: "/admin/material-in", icon: FileText },
                { title: "Material Agregat & Stok", url: "/admin/material-agregat", icon: Layers },
                { title: "Penggunaan Material", url: "/admin/material-usage", icon: Factory },
            ]
        },
        {
            title: "Laporan & Tagihan",
            defaultOpen: false,
            items: [
                ...(user?.role === "SuperAdminBP" ? [{ title: "Tagihan & Invoice", url: "/admin/billing", icon: Receipt }] : []),
                { title: "Rekap Gaji Supir", url: "/admin/reports/retase", icon: BarChart3 },
            ]
        },
        {
            title: "Data Master",
            defaultOpen: false,
            items: [
                { title: "Data Karyawan", url: "/admin/karyawan", icon: Users },
                { title: "Data Kendaraan", url: "/admin/kendaraan", icon: Truck },
                { title: "Mutu Beton", url: "/admin/mutu", icon: Settings },
                { title: "Item Pekerjaan", url: "/admin/item-pekerjaan", icon: Settings },
                ...(user?.role === "SuperAdminBP" ? [{ title: "Master Cabang", url: "/admin/cabang", icon: Factory }] : [])
            ]
        },
        ...(user?.role === "SuperAdminBP" || user?.role === "AdminLogistik" || user?.role === "AdminBP" ? [
            {
                title: "Logistik & Peralatan",
                defaultOpen: false,
                items: [
                    { title: "Dashboard", url: "/logistik", icon: LayoutDashboard },
                    { title: "Buat PO Baru", url: "/logistik/po/create", icon: ShoppingCart },
                    { title: "Daftar PO", url: "/logistik/po", icon: FileText },
                    { title: "Daftar Perusahaan", url: "/logistik/perusahaan", icon: Factory },
                    { title: "Master Kategori PO", url: "/logistik/kategori", icon: KeyRound },
                    { title: "Master Supplier", url: "/logistik/supplier", icon: Store },
                    { title: "Master Barang", url: "/logistik/master-barang", icon: Box },
                ]
            }
        ] : []),
        ...(user?.role === "SuperAdminBP" ? [
            {
                title: "Administrator & Akses",
                defaultOpen: false,
                items: [
                    { title: "Manajemen User", url: "/admin/users", icon: ShieldCheck },
                ]
            }
        ] : []),
    ]

    let bestMatchUrl = ""
    for (const group of navGroups) {
        for (const item of group.items) {
            if (pathname === item.url || pathname.startsWith(item.url + '/')) {
                if (item.url !== '/admin' && item.url.length > bestMatchUrl.length) {
                    bestMatchUrl = item.url
                }
            }
        }
    }
    if (pathname === '/admin') bestMatchUrl = '/admin'

    useEffect(() => {
        // Jangan auto-expand grup Monitoring jika sedang di halaman utama Dashboard,
        // biarkan default state ("Operasional & Transaksi") yang terbuka.
        if (pathname === '/admin') return

        const activeGroup = navGroups.find(group =>
            group.items.some(item => item.url === bestMatchUrl)
        )
        if (activeGroup) {
            setOpenGroup(activeGroup.title)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

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
                {navGroups.map((group) => {
                    const isOpen = openGroup === group.title

                    return (
                        <Collapsible
                            key={group.title}
                            open={isOpen}
                            onOpenChange={(open) => setOpenGroup(open ? group.title : null)}
                            className="group/collapsible"
                        >
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
                                                const isActive = item.url === bestMatchUrl
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
                    )
                })}
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
