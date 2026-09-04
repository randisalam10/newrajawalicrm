"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-colors"
        >
            <Printer className="h-4 w-4" />
            Cetak / Simpan PDF
        </button>
    )
}
