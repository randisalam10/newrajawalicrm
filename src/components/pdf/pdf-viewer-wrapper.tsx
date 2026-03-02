"use client"
// Generic PDF Viewer wrapper — renders any @react-pdf/renderer Document
// in a full-screen iframe, with a Download button

import { useState, useEffect } from "react"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyReactElement = any

export function PdfViewerWrapper({
    document: doc,
    fileName,
}: {
    // Use any to avoid @react-pdf/renderer's strict DocumentProps requirement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document: AnyReactElement
    fileName: string
}) {
    const [mounted, setMounted] = useState(false)
    // Dynamically import to avoid SSR issues
    const [PdfComponents, setPdfComponents] = useState<{
        PDFViewer: any
        BlobProvider: any
    } | null>(null)

    useEffect(() => {
        setMounted(true)
        import("@react-pdf/renderer").then((mod) => {
            setPdfComponents({ PDFViewer: mod.PDFViewer, BlobProvider: mod.BlobProvider })
        })
    }, [])

    if (!mounted || !PdfComponents) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                    <div className="text-slate-500 text-sm">Menyiapkan dokumen PDF…</div>
                </div>
            </div>
        )
    }

    const { PDFViewer, BlobProvider } = PdfComponents

    return (
        <div className="flex flex-col h-screen">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white text-sm shrink-0">
                <span className="font-medium truncate">{fileName}</span>
                <div className="flex items-center gap-3">
                    <BlobProvider document={doc}>
                        {({ url, loading }: { url: string | null; loading: boolean }) => (
                            <a
                                href={url ?? "#"}
                                download={fileName}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors
                  ${loading
                                        ? "bg-slate-600 text-slate-400 cursor-not-allowed pointer-events-none"
                                        : "bg-blue-500 hover:bg-blue-400 text-white"
                                    }`}
                            >
                                {loading ? "⏳ Menyiapkan..." : "⬇ Download PDF"}
                            </a>
                        )}
                    </BlobProvider>
                    <button
                        onClick={() => window.close()}
                        className="px-3 py-1.5 rounded text-xs bg-slate-700 hover:bg-slate-600 text-white"
                    >
                        ✕ Tutup
                    </button>
                </div>
            </div>

            {/* PDF Viewer */}
            <PDFViewer
                style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
                showToolbar={true}
            >
                {doc}
            </PDFViewer>
        </div>
    )
}
