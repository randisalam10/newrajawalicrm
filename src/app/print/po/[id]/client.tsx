"use client"
// Client component untuk print Purchase Order

import { PdfViewerWrapper } from "@/components/pdf/pdf-viewer-wrapper"
import { PODocument } from "@/components/pdf/po-document"

export function POPrintClient({ po }: { po: any }) {
    const cleanName = po.po_number.replace(/\//g, "-")
    return (
        <PdfViewerWrapper
            document={<PODocument po={po} />}
            fileName={`PO_${cleanName}.pdf`}
        />
    )
}
