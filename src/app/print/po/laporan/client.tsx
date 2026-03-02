"use client"
// Client component untuk print Laporan Bulanan PO

import { PdfViewerWrapper } from "@/components/pdf/pdf-viewer-wrapper"
import { LaporanPODocument } from "@/components/pdf/po-laporan-document"

export function LaporanPOClient({ data }: { data: any }) {
    const filename = `Laporan_PO_${data.tahun}-${String(data.bulan).padStart(2, "0")}.pdf`
    return (
        <PdfViewerWrapper
            document={<LaporanPODocument data={data} />}
            fileName={filename}
        />
    )
}
