"use client"
// Client component untuk print Slip Retase Sopir

import { PdfViewerWrapper } from "@/components/pdf/pdf-viewer-wrapper"
import { RetaseDocument } from "@/components/pdf/retase-document"

export function RetasePrintClient({ driver, year, month, locationName }: {
    driver: any
    year: number
    month: number
    locationName: string
}) {
    const MONTH_NAMES = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    return (
        <PdfViewerWrapper
            document={
                <RetaseDocument
                    driver={driver}
                    year={year}
                    month={month}
                    locationName={locationName}
                />
            }
            fileName={`Slip_Retase_${driver.name.replace(/\s+/g, "_")}_${MONTH_NAMES[month - 1]}_${year}.pdf`}
        />
    )
}
