"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Pencil,
    Trash2,
    Plus,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
} from "lucide-react"
import { CustomerWithProjects, CustomerProject, ConcreteQualityItem, SortKey, SortDir } from "../types"
import { ProjectPriceManager } from "./project-price-manager"

interface CustomerTableProps {
    customers: CustomerWithProjects[]
    isCorporate: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    qualities: ConcreteQualityItem[]
    // Expansion
    expandedCustomer: string | null
    setExpandedCustomer: (id: string | null) => void
    expandedProject: string | null
    setExpandedProject: (id: string | null) => void
    // Sorting
    sortKey: SortKey
    sortDir: SortDir
    onSort: (key: SortKey) => void
    // Action handlers
    onOpenEditCustomer: (cust: CustomerWithProjects) => void
    onDeleteCustomer: (id: string) => void
    onOpenCreateProject: (cust: CustomerWithProjects) => void
    onOpenEditProject: (cust: CustomerWithProjects, proj: CustomerProject) => void
    onDeleteProject: (id: string) => void
    // Price Form
    priceForm: {
        qualityId: string
        price: string
        ppnMode: string
        ppnRate: string
    }
    setPriceForm: React.Dispatch<
        React.SetStateAction<{
            qualityId: string
            price: string
            ppnMode: string
            ppnRate: string
        }>
    >
    priceLoading: boolean
    setPriceLoading: (loading: boolean) => void
    // Pagination
    currentPage: number
    totalPages: number
    totalFiltered: number
    onPageChange: (page: number) => void
}

export function CustomerTable({
    customers,
    isCorporate,
    canCreate,
    canEdit,
    canDelete,
    qualities,
    expandedCustomer,
    setExpandedCustomer,
    expandedProject,
    setExpandedProject,
    sortKey,
    sortDir,
    onSort,
    onOpenEditCustomer,
    onDeleteCustomer,
    onOpenCreateProject,
    onOpenEditProject,
    onDeleteProject,
    priceForm,
    setPriceForm,
    priceLoading,
    setPriceLoading,
    currentPage,
    totalPages,
    totalFiltered,
    onPageChange,
}: CustomerTableProps) {
    function SortIcon({ k }: { k: SortKey }) {
        if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
        return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
    }

    function SortableHead({ label, k }: { label: string; k: SortKey }) {
        return (
            <div
                className="flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors group select-none"
                onClick={() => onSort(k)}
            >
                {label}
                <SortIcon k={k} />
            </div>
        )
    }

    const colSpan = (isCorporate ? 1 : 0) + (canCreate || canEdit || canDelete ? 1 : 0) + 4

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/70 border-b border-slate-200">
                            <TableHead className="w-8"></TableHead>
                            {isCorporate && (
                                <TableHead className="w-32">
                                    <SortableHead label="Cabang" k="location" />
                                </TableHead>
                            )}
                            <TableHead>
                                <SortableHead label="Nama Customer" k="customer_name" />
                            </TableHead>
                            <TableHead>
                                <SortableHead label="Alamat Tagih" k="address" />
                            </TableHead>
                            <TableHead className="w-32">
                                <SortableHead label="Proyek" k="project_count" />
                            </TableHead>
                            {(canCreate || canEdit || canDelete) && (
                                <TableHead className="w-[110px] text-right pr-4">Aksi</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={colSpan} className="text-center text-slate-400 h-28 text-sm">
                                    Tidak ada customer yang sesuai dengan filter atau pencarian.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((cust) => {
                                const isExpanded = expandedCustomer === cust.id
                                const projectCount = cust.projects?.length ?? 0

                                return (
                                    <React.Fragment key={cust.id}>
                                        <TableRow
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-100"
                                            onClick={() => setExpandedCustomer(isExpanded ? null : cust.id)}
                                        >
                                            <TableCell className="pl-4">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                )}
                                            </TableCell>
                                            {isCorporate && (
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                        {cust.location?.name || "N/A"}
                                                    </span>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="font-semibold text-sm text-slate-800">
                                                    {cust.customer_name}
                                                </div>
                                                {cust.sharedLocations && cust.sharedLocations.length > 0 && (
                                                    <div
                                                        className="text-[11px] text-slate-400 mt-0.5 max-w-[240px] truncate"
                                                        title={`Di-share ke: ${cust.sharedLocations.map((l) => l.name).join(", ")}`}
                                                    >
                                                        <span className="font-medium text-slate-500">Di-share ke:</span>{" "}
                                                        {cust.sharedLocations.map((l) => l.name).join(", ")}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">{cust.address}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        projectCount > 0
                                                            ? "bg-slate-100 text-slate-700 font-normal hover:bg-slate-100"
                                                            : "bg-amber-50 text-amber-700 border border-amber-200 font-normal hover:bg-amber-50"
                                                    }
                                                >
                                                    {projectCount} proyek
                                                </Badge>
                                            </TableCell>
                                            {(canCreate || canEdit || canDelete) && (
                                                <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canCreate && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                title="Tambah Proyek"
                                                                onClick={() => onOpenCreateProject(cust)}
                                                            >
                                                                <FolderOpen className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {canEdit && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                                                title="Edit Customer"
                                                                onClick={() => onOpenEditCustomer(cust)}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {canDelete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                                title="Hapus Customer"
                                                                onClick={() => onDeleteCustomer(cust.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>

                                        {/* Expanded Projects Sub-table */}
                                        {isExpanded && (
                                            <TableRow className="bg-slate-50/70 border-t-0 hover:bg-slate-50/70">
                                                <TableCell colSpan={colSpan} className="p-0">
                                                    <div className="px-10 py-3 border-l-4 border-blue-500 bg-blue-50/20">
                                                        <div className="flex justify-between items-center mb-2.5">
                                                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                                Proyek milik{" "}
                                                                <span className="text-blue-700 font-bold">
                                                                    {cust.customer_name}
                                                                </span>
                                                            </p>
                                                            {canCreate && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => onOpenCreateProject(cust)}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Proyek
                                                                </Button>
                                                            )}
                                                        </div>

                                                        {!cust.projects || cust.projects.length === 0 ? (
                                                            <p className="text-xs text-slate-400 italic py-2">
                                                                Belum ada proyek untuk customer ini.
                                                            </p>
                                                        ) : (
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-slate-200/80">
                                                                        <th className="text-left py-1.5 pr-4 font-semibold text-slate-600">
                                                                            Nama Proyek
                                                                        </th>
                                                                        <th className="text-left py-1.5 pr-4 font-semibold text-slate-600">
                                                                            Lokasi Pengecoran
                                                                        </th>
                                                                        <th className="text-left py-1.5 pr-4 font-semibold text-slate-600">
                                                                            Jarak (KM)
                                                                        </th>
                                                                        <th className="text-left py-1.5 font-semibold text-slate-600">
                                                                            PPN (%)
                                                                        </th>
                                                                        {(canEdit || canDelete) && (
                                                                            <th className="w-[80px]"></th>
                                                                        )}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {cust.projects.map((proj) => {
                                                                        const isProjectOpen = expandedProject === proj.id
                                                                        const hasPrice = proj.prices && proj.prices.length > 0

                                                                        return (
                                                                            <React.Fragment key={proj.id}>
                                                                                <tr className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors">
                                                                                    <td className="py-2 pr-4">
                                                                                        <button
                                                                                            type="button"
                                                                                            className="flex items-center gap-1 font-medium text-slate-800 hover:text-blue-600 text-left"
                                                                                            onClick={() =>
                                                                                                setExpandedProject(
                                                                                                    isProjectOpen ? null : proj.id
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            {isProjectOpen ? (
                                                                                                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                                                                                            ) : (
                                                                                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                                                                            )}
                                                                                            <span>{proj.name}</span>
                                                                                            {!hasPrice && (
                                                                                                <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-normal">
                                                                                                    Belum ada tarif
                                                                                                </span>
                                                                                            )}
                                                                                        </button>
                                                                                    </td>
                                                                                    <td className="py-2 pr-4 text-slate-500">
                                                                                        {proj.address}
                                                                                    </td>
                                                                                    <td className="py-2 pr-4 text-slate-600 font-medium">
                                                                                        {proj.default_distance} km
                                                                                    </td>
                                                                                    <td className="py-2 text-slate-600">
                                                                                        {proj.tax_ppn}%
                                                                                    </td>
                                                                                    {(canEdit || canDelete) && (
                                                                                        <td className="py-2 text-right">
                                                                                            <div className="flex items-center justify-end gap-1">
                                                                                                {canEdit && (
                                                                                                    <Button
                                                                                                        variant="ghost"
                                                                                                        size="icon"
                                                                                                        className="h-7 w-7 text-slate-500 hover:text-slate-800"
                                                                                                        onClick={() =>
                                                                                                            onOpenEditProject(cust, proj)
                                                                                                        }
                                                                                                    >
                                                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                                                    </Button>
                                                                                                )}
                                                                                                {canDelete && (
                                                                                                    <Button
                                                                                                        variant="ghost"
                                                                                                        size="icon"
                                                                                                        className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                                                                        onClick={() =>
                                                                                                            onDeleteProject(proj.id)
                                                                                                        }
                                                                                                    >
                                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                                    </Button>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    )}
                                                                                </tr>

                                                                                {/* Inline Project Pricing */}
                                                                                {isProjectOpen && (
                                                                                    <tr>
                                                                                        <td colSpan={5} className="pb-3 pt-0">
                                                                                            <ProjectPriceManager
                                                                                                project={proj}
                                                                                                qualities={qualities}
                                                                                                customerLocationId={cust.locationId}
                                                                                                canCreate={canCreate}
                                                                                                canDelete={canDelete}
                                                                                                priceForm={priceForm}
                                                                                                setPriceForm={setPriceForm}
                                                                                                priceLoading={priceLoading}
                                                                                                setPriceLoading={setPriceLoading}
                                                                                            />
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
                                                                            </React.Fragment>
                                                                        )
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 pt-1">
                    <div className="text-xs text-slate-500 font-medium">
                        Halaman {currentPage} dari {totalPages}
                        <span className="ml-1.5 text-slate-400 font-normal">
                            (Total {totalFiltered} customer)
                        </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="h-8 text-xs bg-white border-slate-200"
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            className="h-8 text-xs bg-white border-slate-200"
                        >
                            Selanjutnya <ChevronLeft className="h-3.5 w-3.5 ml-1 rotate-180" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
