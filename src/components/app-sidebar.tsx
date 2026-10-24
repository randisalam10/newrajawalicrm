"use client"

import { useState, useEffect, useTransition } from "react"

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
import { Factory, HardHat, FileText, Settings, Users, Truck, LogOut, LayoutDashboard, ShieldCheck, ChevronRight, BarChart3, Receipt, CalendarClock, Layers, ShoppingCart, Box, Store, KeyRound, PenTool, WalletCards, CheckSquare, Fuel, Calculator, Tag, Landmark, BookLock, Loader2, Mountain, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { logout } from "@/app/login/actions"

type AppSidebarProps = {
    user: {
        username?: string | null
        role?: "AdminBP" | "OperatorBP" | string
        permissions?: string[]
        roleScope?: "ALL_BRANCHES" | "OWN_BRANCH" | string
        locationId?: string | null
        locationType?: "BATCHING_PLANT" | "STONE_CRUSHER" | "HEAD_OFFICE" | string | null
        locationName?: string | null
    }
}

export function AppSidebar({ user }: AppSidebarProps) {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const userRoleLower = (user?.role || "").toLowerCase()
    const isCrusherLocation = user?.locationType === "STONE_CRUSHER"
    const isBPLocation = user?.locationType === "BATCHING_PLANT"
    const isCrusherRole = isCrusherLocation || userRoleLower === "operatorcrusher" || userRoleLower === "admincrusher" || userRoleLower.includes("crusher") || userRoleLower.startsWith("sc")

    const [openGroup, setOpenGroup] = useState<string | null>(
        isCrusherRole ? "Stone Crusher" : "Operasional & Transaksi"
    )
    const [isLoggingOut, startTransition] = useTransition()

    const handleLogout = () => {
        startTransition(async () => {
            await logout()
        })
    }

    useEffect(() => {
        setMounted(true)
    }, [])

    const isSuperAdmin = user?.role === "SuperAdminBP"
    const isCorporate = isSuperAdmin || user?.roleScope === "ALL_BRANCHES" || user?.role === "AdminLogistik" || ["CEO", "FVP", "Approver"].includes(user?.role || "")

    // Real-time Database-driven Permission Check (Single Source of Truth)
    const hasPerm = (code: string) => {
        if (isSuperAdmin) return true
        if (user?.permissions && Array.isArray(user.permissions)) {
            return user.permissions.includes(code)
        }
        return false
    }

    const hasAnyPerm = (...codes: string[]) => {
        if (isSuperAdmin) return true
        return codes.some(code => hasPerm(code))
    }

    const rawNavGroups = [
        // ================= OPERASIONAL (PALING ATAS) =================
        {
            title: "Monitoring",
            defaultOpen: true,
            items: [
                ...((hasPerm("DASHBOARD_VIEW") || hasPerm("CRUSHER_VIEW")) ? [{
                    title: "Dashboard",
                    url: user?.role === "OperatorBP" ? "/operator" : (isCrusherLocation || (hasPerm("CRUSHER_VIEW") && !hasPerm("PRODUKSI_VIEW")) ? "/crusher" : (user?.role === "AdminLogistik" && !hasPerm("PRODUKSI_VIEW") ? "/logistik" : "/admin")),
                    icon: LayoutDashboard,
                    isSuperAdminOnly: false,
                }] : []),
                ...(hasPerm("PLANNING_VIEW") ? [{ title: "Planning Pengecoran", url: "/admin/planning", icon: CalendarClock, isSuperAdminOnly: false }] : []),
            ]
        },
        {
            title: "Operasional & Transaksi",
            defaultOpen: true,
            items: [
                ...(hasPerm("PRODUKSI_VIEW") ? [{ title: "Input Produksi", url: "/admin/produksi", icon: Factory, isSuperAdminOnly: false }] : []),
                ...(hasPerm("SEWA_VIEW") ? [{ title: "Sewa Alat / Kendaraan", url: "/admin/sewa", icon: KeyRound, isSuperAdminOnly: false }] : []),
                ...(hasPerm("RETASE_VIEW") ? [{ title: "Surat Jalan & Retase", url: "/admin/retase", icon: Truck, isSuperAdminOnly: false }] : []),
                ...(hasPerm("MATERIAL_SEMEN_VIEW") ? [{ title: "Semen Masuk / Kartu Stok", url: "/admin/material-in", icon: FileText, isSuperAdminOnly: false }] : []),
                ...(hasPerm("MATERIAL_AGREGAT_VIEW") ? [{ title: "Material Agregat & Stok", url: "/admin/material-agregat", icon: Layers, isSuperAdminOnly: false }] : []),
                ...(hasAnyPerm("FUEL_VIEW", "VEHICLE_VIEW", "RBL_VIEW") ? [{ title: "Monitoring BBM Armada", url: "/admin/fuel", icon: Fuel, isSuperAdminOnly: false }] : []),
            ]
        },
        ...(hasPerm("CRUSHER_VIEW") ? [{
            title: "Stone Crusher",
            defaultOpen: true,
            items: [
                { title: "Dashboard & Rekap", url: "/crusher", icon: Mountain, isSuperAdminOnly: false },
                { title: "Operasional dan Gangguan", url: "/crusher/mesin", icon: Clock, isSuperAdminOnly: false },
                { title: "Pengisian BBM (Solar)", url: "/crusher/solar", icon: Fuel, isSuperAdminOnly: false },
                { title: "Material Masuk", url: "/crusher/material-masuk", icon: Layers, isSuperAdminOnly: false },
                { title: "Material Keluar", url: "/crusher/material-keluar", icon: Truck, isSuperAdminOnly: false },
                { title: "Retase Operator & Helper", url: "/crusher/operator", icon: HardHat, isSuperAdminOnly: false },
            ]
        }] : []),
        {
            title: "Pengadaan & Logistik",
            defaultOpen: false,
            items: [
                ...(hasPerm("LOGISTIK_VIEW") && isCorporate && user?.role !== "AdminLogistik" ? [{ title: "Dashboard Logistik", url: "/logistik", icon: LayoutDashboard, isSuperAdminOnly: false }] : []),
                ...(hasPerm("LOGISTIK_VIEW") && (isCorporate || isBPLocation || (!isCrusherLocation && !hasPerm("CRUSHER_VIEW"))) ? [
                    { title: "PO Umum", url: "/logistik/po", icon: FileText, isSuperAdminOnly: false },
                ] : []),
                ...((hasPerm("CRUSHER_VIEW") || hasPerm("LOGISTIK_VIEW")) && (isCorporate || isCrusherLocation || hasPerm("CRUSHER_VIEW")) ? [
                    { title: "PO Stone Crusher", url: "/crusher/po", icon: ShoppingCart, badge: "SC", isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("LOGISTIK_APPROVE") ? [
                    { title: "Persetujuan PO", url: "/logistik/approval", icon: CheckSquare, isSuperAdminOnly: false }
                ] : []),
                ...(hasPerm("LOGISTIK_VIEW") || hasPerm("CRUSHER_VIEW") ? [
                    { title: "Master Kategori PO", url: "/logistik/kategori", icon: KeyRound, isSuperAdminOnly: false },
                    { title: "Master Supplier", url: "/logistik/supplier", icon: Store, isSuperAdminOnly: false },
                    { title: "Master Barang", url: "/logistik/master-barang", icon: Box, isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("LOGISTIK_PERUSAHAAN_VIEW") || hasPerm("LOGISTIK_PERUSAHAAN_MANAGE") || isSuperAdmin || user?.role === "AdminLogistik" ? [
                    { title: "Daftar Perusahaan", url: "/logistik/perusahaan", icon: Factory, isSuperAdminOnly: false },
                ] : [])
            ]
        },
        {
            title: "Laporan & Tagihan",
            defaultOpen: false,
            items: [
                ...(hasPerm("BILLING_VIEW") ? [{ title: "Tagihan & Invoice", url: "/admin/billing", icon: Receipt, isSuperAdminOnly: false }] : []),
                ...(hasPerm("RBL_VIEW") ? [
                    { title: "Rekap Bulanan (RBL)", url: "/admin/rbl", icon: WalletCards, isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("MATERIAL_USAGE_VIEW") ? [{ title: "Penggunaan Material", url: "/admin/material-usage", icon: Factory, isSuperAdminOnly: false }] : []),
                ...(hasAnyPerm("REPORTS_VIEW", "MATERIAL_AGREGAT_VIEW", "MATERIAL_VIEW") ? [
                    { title: "Laporan Biaya Material", url: "/admin/reports/material", icon: Layers, isSuperAdminOnly: false },
                ] : []),
                ...(hasAnyPerm("REPORTS_VIEW", "VEHICLE_VIEW") ? [
                    { title: "Laporan Kendaraan & Alat", url: "/admin/reports/kendaraan", icon: Truck, isSuperAdminOnly: false },
                ] : []),
                ...(hasAnyPerm("REPORTS_VIEW", "RETASE_EXPORT", "INSENTIF_VIEW") ? [{ title: "Retase Batchingplant", url: "/admin/reports/retase", icon: BarChart3, isSuperAdminOnly: false }] : []),
                ...(hasAnyPerm("CRUSHER_VIEW", "CRUSHER_WAGES_VIEW") || isSuperAdmin || ["CEO", "FVP", "Finance"].includes(user?.role || "") ? [
                    { title: "Retase Stone Crusher", url: "/admin/retase-crusher", icon: Mountain, isSuperAdminOnly: false }
                ] : []),
            ]
        },
        {
            title: "Finance & Keuangan",
            defaultOpen: true,
            items: [
                ...(isSuperAdmin ? [{
                    title: "Simulator Kas & Break-Even",
                    url: "/admin/finance/cashflow-simulator",
                    icon: Calculator,
                    isSuperAdminOnly: true,
                }] : []),
                ...(isSuperAdmin ? [{
                    title: "Laporan Bulanan Manajemen",
                    url: "/admin/reports/monthly-management",
                    icon: BarChart3,
                    isSuperAdminOnly: true,
                }] : []),
                ...(isSuperAdmin ? [{
                    title: "Tutup Buku",
                    url: "/admin/finance/tutup-buku",
                    icon: BookLock,
                    isSuperAdminOnly: true,
                }] : []),
                ...(hasAnyPerm("FINANCE_VIEW", "FINANCE_CREDIT_VIEW") ? [
                    { title: "Kredit & Kewajiban", url: "/admin/finance/kredit", icon: Landmark, isSuperAdminOnly: false }
                ] : []),
            ]
        },

        // ================= DATA MASTER (PALING BAWAH) =================
        {
            title: "Data Master",
            defaultOpen: false,
            items: [
                ...(hasPerm("CUSTOMER_VIEW") ? [
                    { title: "Data Customer", url: "/admin/customer", icon: HardHat, isSuperAdminOnly: false }
                ] : []),
                ...(hasPerm("KARYAWAN_VIEW") ? [
                    { title: "Data Karyawan", url: "/admin/karyawan", icon: Users, isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("VEHICLE_VIEW") ? [
                    { title: "Data Kendaraan & Alat", url: "/admin/kendaraan", icon: Truck, isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("SEWA_VIEW") ? [
                    { title: "Master Sewa Alat", url: "/admin/master-sewa", icon: Box, isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("MUTU_VIEW") ? [
                    { title: "Mutu Beton", url: "/admin/mutu", icon: Settings, isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("ITEM_PEKERJAAN_VIEW") ? [
                    { title: "Item Pekerjaan", url: "/admin/item-pekerjaan", icon: Settings, isSuperAdminOnly: false },
                ] : []),
                ...(hasPerm("INSENTIF_VIEW") ? [
                    { title: "Master Insentif & Tarif", url: "/admin/master-insentif", icon: Calculator, isSuperAdminOnly: false },
                ] : []),
                ...(hasAnyPerm("MATERIAL_AGREGAT_VIEW", "PRODUKSI_VIEW", "MUTU_VIEW") || isCorporate ? [
                    { title: "Master Harga Material", url: "/admin/master-material", icon: Tag, isSuperAdminOnly: false }
                ] : []),
                ...(hasPerm("MASTER_CABANG_VIEW") ? [{ title: "Master Cabang", url: "/admin/cabang", icon: Factory, isSuperAdminOnly: false }] : []),
                ...(hasPerm("CRUSHER_VIEW") ? [
                    { title: "Master Sumber & Jarak (SC)", url: "/crusher/sumber", icon: MapPin, isSuperAdminOnly: false },
                    { title: "Master Tujuan Non-BP (SC)", url: "/admin/master-tujuan-crusher", icon: MapPin, isSuperAdminOnly: false },
                    { title: "Master Kendaraan (SC)", url: "/crusher/kendaraan", icon: Truck, isSuperAdminOnly: false },
                    { title: "Master Karyawan (SC)", url: "/crusher/karyawan", icon: Users, isSuperAdminOnly: false },
                ] : []),
                ...(isSuperAdmin ? [
                    { title: "Master Biaya & Target", url: "/admin/fixed-costs", icon: Landmark, isSuperAdminOnly: true }
                ] : [])
            ]
        },

        // ================= ADMINISTRATOR & AKSES (PALING AKHIR) =================
        {
            title: "Administrator & Akses",
            defaultOpen: false,
            items: [
                ...(hasAnyPerm("USER_MGMT_VIEW", "USER_VIEW") ? [{ title: "Manajemen User", url: "/admin/users", icon: Users, isSuperAdminOnly: false }] : []),
                ...(hasAnyPerm("RBAC_MGMT_VIEW", "ROLE_VIEW") ? [{ title: "Role & Hak Akses", url: "/admin/roles", icon: ShieldCheck, isSuperAdminOnly: false }] : [])
            ]
        }
    ]

    const navGroups = rawNavGroups.filter(group => group.items.length > 0)

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
        if (pathname === '/admin') return

        const activeGroup = navGroups.find(group =>
            group.items.some(item => item.url === bestMatchUrl)
        )
        if (activeGroup) {
            setOpenGroup(activeGroup.title)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    if (!mounted) {
        return <Sidebar collapsible="icon" />
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 p-0 px-3.5 border-b border-sidebar-border flex flex-row items-center justify-between shrink-0 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:justify-center">
                <Link href="/admin" className="flex items-center gap-2.5 font-semibold text-slate-900 overflow-hidden min-w-0 group-data-[collapsible=icon]:justify-center">
                    <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
                        <Image
                            src="/RajawalimixLogo.png"
                            alt="RajawaliMix Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-base font-bold tracking-tight text-slate-900 leading-tight">
                            RajawaliMix
                        </span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 pt-4 gap-1">
                {navGroups.map((group) => {
                    const isOpen = openGroup === group.title

                    return (
                        <Collapsible
                            key={group.title}
                            id={`sidebar-group-${group.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
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
                                            {group.items.map((item: any) => {
                                                const isActive = item.url === bestMatchUrl
                                                return (
                                                    <SidebarMenuItem key={item.title}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={isActive}
                                                            tooltip={item.title}
                                                            className="rounded-lg h-9 font-medium text-[13px] border border-transparent data-[active=true]:border-slate-200 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900 data-[active=true]:font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                                                        >
                                                            <Link href={item.url} className="flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <item.icon className="!h-4 !w-4 opacity-70" />
                                                                    <span className="truncate">{item.title}</span>
                                                                </div>
                                                                {item.badge ? (
                                                                    <span className="ml-auto text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                                                        {item.badge}
                                                                    </span>
                                                                ) : item.isSuperAdminOnly ? (
                                                                    <span className="ml-auto text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                                                        HQ
                                                                    </span>
                                                                ) : null}
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
                {isSuperAdmin ? (
                    <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs">
                        <div className="relative shrink-0">
                            <Avatar className="h-9 w-9 border border-slate-200 shadow-2xs">
                                <AvatarFallback className="bg-slate-800 text-white font-bold text-xs">
                                    {user?.username?.charAt(0).toUpperCase() || "S"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate font-semibold capitalize text-slate-900">{user?.username || "Super Admin"}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-medium tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                                    SUPER ADMIN
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center shrink-0">
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                title="Sign Out"
                                className="cursor-pointer p-1 rounded hover:bg-slate-200/60 transition-colors disabled:opacity-50"
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                ) : (
                                    <LogOut className="h-4 w-4 text-slate-400 hover:text-red-500 transition-colors" />
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-3 py-2">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-200">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold capitalize text-slate-800">{user?.username || "Guest"}</span>
                            <span className="truncate text-[11px] font-medium text-slate-500 uppercase tracking-wider">{user?.role}</span>
                        </div>
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                title="Sign Out"
                                className="cursor-pointer p-1 rounded hover:bg-slate-200/60 transition-colors disabled:opacity-50"
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                ) : (
                                    <LogOut className="h-5 w-5 text-slate-400 hover:text-red-500 transition-colors" />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}
