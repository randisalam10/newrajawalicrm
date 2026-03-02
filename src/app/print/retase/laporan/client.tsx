"use client"
import { PdfViewerWrapper } from "@/components/pdf/pdf-viewer-wrapper"
import { RetaseLaporanDocument } from "@/components/pdf/retase-laporan-document"

export function RetaseLaporanPrintClient({ data }: { data: any }) {
    const filename = `Laporan_Retase_${data.dateFrom}_${data.dateTo}.pdf`
    return <PdfViewerWrapper document={<RetaseLaporanDocument data={data} />} fileName={filename} />
}
