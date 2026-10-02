import React from "react"

interface PaginationBarProps {
    page: number
    total: number
    perPage: number
    onPageChange: (p: number) => void
}

export function PaginationBar({ page, total, perPage, onPageChange }: PaginationBarProps) {
    const totalPages = Math.ceil(total / perPage)
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-slate-500">
            <span>Menampilkan {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} dari {total}</span>
            <div className="flex items-center gap-1">
                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="px-2 py-1 rounded border text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                    ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                    return (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`px-2 py-1 rounded border cursor-pointer ${
                                p === page ? 'bg-blue-600 text-white border-blue-600 font-semibold' : 'hover:bg-slate-100'
                            }`}
                        >
                            {p}
                        </button>
                    )
                })}
                <button
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="px-2 py-1 rounded border text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                    ›
                </button>
            </div>
        </div>
    )
}
