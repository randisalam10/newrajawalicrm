"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface POPaginationProps {
    page: number
    totalPages: number
    currentCount: number
    totalCount: number
    isLoading: boolean
    onPageChange: (p: number) => void
}

export function POPagination({
    page,
    totalPages,
    currentCount,
    totalCount,
    isLoading,
    onPageChange,
}: POPaginationProps) {
    return (
        <div className="flex items-center justify-between px-2">
            <div className="text-xs text-slate-500">
                Menampilkan <span className="font-semibold text-slate-800">{currentCount}</span> dari <span className="font-semibold text-slate-800">{totalCount}</span> PO
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1 || isLoading}
                    className="gap-1 h-8 text-xs"
                >
                    <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                </Button>
                <div className="text-xs font-medium text-slate-700">
                    Halaman {page} dari {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages || isLoading}
                    className="gap-1 h-8 text-xs"
                >
                    Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    )
}
