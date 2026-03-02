"use client"
// Client component untuk print Invoice

import { PdfViewerWrapper } from "@/components/pdf/pdf-viewer-wrapper"
import { InvoiceDocument } from "@/components/pdf/invoice-document"

export function InvoicePrintClient({ invoice }: { invoice: any }) {
    return (
        <PdfViewerWrapper
            document={<InvoiceDocument invoice={invoice} />}
            fileName={`Invoice_${invoice.invoice_number}.pdf`}
        />
    )
}
