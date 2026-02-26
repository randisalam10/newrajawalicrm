"use client"

import React, { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleDataTableProps<T> {
    data: T[]
    searchKeys: (keyof T)[]
    children: (items: T[], sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null, toggleSort: (key: keyof T) => void) => React.ReactNode
    pageSize?: number
    searchPlaceholder?: string
    showSearch?: boolean
    showPagination?: boolean
}

export function SimpleDataTable<T>({
    data,
    searchKeys,
    children,
    pageSize = 10,
    searchPlaceholder = "Cari data...",
    showSearch = true,
    showPagination = true
}: SimpleDataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null)

    // Toggle Sort
    const toggleSort = (key: keyof T) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    // Filter
    const filteredData = useMemo(() => {
        if (!searchQuery) return data
        return data.filter((item) => {
            return searchKeys.some((key) => {
                const value = (item as any)[key]
                if (value === null || value === undefined) return false
                return String(value).toLowerCase().includes(searchQuery.toLowerCase())
            })
        })
    }, [data, searchQuery, searchKeys])

    // Sort
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData
        return [...filteredData].sort((a: any, b: any) => {
            const aVal = a[sortConfig.key]
            const bVal = b[sortConfig.key]

            if (aVal === bVal) return 0
            if (aVal === null || aVal === undefined) return 1
            if (bVal === null || bVal === undefined) return -1

            const result = aVal < bVal ? -1 : 1
            return sortConfig.direction === 'asc' ? result : -result
        })
    }, [filteredData, sortConfig])

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return sortedData.slice(startIndex, startIndex + pageSize)
    }, [sortedData, currentPage, pageSize])

    const totalPages = Math.ceil(sortedData.length / pageSize)

    // Reset page on search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    return (
        <div className="space-y-4">
            {showSearch && (
                <div className="flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={handleSearch}
                            className="pl-9 h-9 bg-white"
                        />
                    </div>
                </div>
            )}

            <div className="rounded-md border bg-white overflow-hidden">
                {children(paginatedData, sortConfig, toggleSort)}
            </div>

            {showPagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground font-medium">
                        Halaman {currentPage} dari {totalPages || 1}
                        <span className="ml-2 text-xs italic font-normal">(Total {sortedData.length} data)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 text-xs"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Sebelumnya
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages || totalPages === 0}
                            className="h-8 text-xs"
                        >
                            Selanjutnya
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Helper component for sortable headers
 */
export function SortableHeader<T>({
    label,
    sortKey,
    sortConfig,
    onSort
}: {
    label: string,
    sortKey: keyof T,
    sortConfig: any,
    onSort: (key: keyof T) => void
}) {
    const isActive = sortConfig?.key === sortKey

    return (
        <div
            className={cn(
                "flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors group",
                isActive && "text-slate-900"
            )}
            onClick={() => onSort(sortKey)}
        >
            {label}
            {isActive ? (
                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            ) : (
                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
            )}
        </div>
    )
}
