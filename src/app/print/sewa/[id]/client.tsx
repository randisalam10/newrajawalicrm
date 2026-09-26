"use client"
// Client component for Sewa Surat Jalan print/preview
import { PdfViewerWrapper } from "@/components/pdf/pdf-viewer-wrapper"
import { SewaDocument, SewaDocumentData } from "@/components/pdf/sewa-document"

export function SewaPrintClient({ tx }: { tx: SewaDocumentData }) {
    return (
        <PdfViewerWrapper
            document={<SewaDocument tx={tx} />}
            fileName={`Surat_Jalan_Sewa_${tx.sewa_number.replace(/[\/\\]/g, "_")}.pdf`}
        />
    )
}
