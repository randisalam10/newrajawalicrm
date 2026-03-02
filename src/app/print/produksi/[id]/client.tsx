"use client"
// Client component untuk print Surat Jalan
// Menggunakan PdfViewerWrapper + SuratJalanDocument

import { PdfViewerWrapper } from "@/components/pdf/pdf-viewer-wrapper"
import { SuratJalanDocument } from "@/components/pdf/surat-jalan-document"
import { format } from "date-fns"

export function SuratJalanPrintClient({ tx }: { tx: any }) {
    const noSJ = `${tx.id.split("-")[0].toUpperCase()}/SJ/${format(new Date(tx.date), "MM/yy")}`

    return (
        <PdfViewerWrapper
            document={<SuratJalanDocument tx={tx} />}
            fileName={`Surat_Jalan_${noSJ}.pdf`}
        />
    )
}
