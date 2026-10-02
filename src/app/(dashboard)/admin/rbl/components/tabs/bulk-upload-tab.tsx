"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, Plus, Upload, Loader2, Sparkles, X, Eye, Trash2 } from "lucide-react"
import { StagedFile } from "../../types"
import { formatFileSize } from "../../utils/rbl-helpers"

interface BulkUploadTabProps {
    activeBudget: any
    canEdit?: boolean
    canDelete?: boolean
    stagedFiles: StagedFile[]
    setStagedFiles: React.Dispatch<React.SetStateAction<StagedFile[]>>
    compressionStats: {
        totalOriginal: number
        totalCompressed: number
        savedPercent: number
    } | null
    isCompressing: boolean
    isUploading: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void
    onExecuteBulkUpload: () => void
    onDeleteAttachment: (id: string) => void
    onPreviewImage: (image: { url: string; name: string }) => void
    onOpenCreateBudget: () => void
}

export function BulkUploadTab({
    activeBudget,
    canEdit,
    canDelete,
    stagedFiles,
    setStagedFiles,
    compressionStats,
    isCompressing,
    isUploading,
    fileInputRef,
    onFilesSelected,
    onExecuteBulkUpload,
    onDeleteAttachment,
    onPreviewImage,
    onOpenCreateBudget,
}: BulkUploadTabProps) {
    return (
        <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-blue-600" />
                            <span>Galeri Foto Bukti Nota / Kwitansi</span>
                            {activeBudget && (
                                <Badge variant="outline" className="text-xs bg-white text-emerald-700 border-emerald-200">
                                    Terkunci ke: {activeBudget.code}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Upload bulk foto nota untuk budget aktif ini. Setiap foto dikompresi otomatis tanpa menurunkan ketajaman teks/angka.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {!activeBudget ? (
                    <div className="p-10 text-center text-slate-500 text-xs border rounded-xl bg-slate-50/60 space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <ImageIcon className="h-5 w-5" />
                        </div>
                        <div className="font-semibold text-slate-700 text-sm">Belum Ada Budget Aktif</div>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Foto nota atau kwitansi wajib terikat ke budget aktif. Buka budget baru sebelum mengunggah berkas.
                        </p>
                        <Button
                            size="sm"
                            onClick={onOpenCreateBudget}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Buka Budget Sekarang
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Dropzone Upload */}
                        {canEdit && (
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                                    onChange={onFilesSelected}
                                    className="hidden"
                                    id="bulk-receipt-upload"
                                />
                                <label
                                    htmlFor="bulk-receipt-upload"
                                    className="cursor-pointer flex flex-col items-center space-y-2"
                                >
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                        {isCompressing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-800">
                                        {isCompressing ? "Mengompresi Gambar..." : "Klik untuk Pilih Banyak Foto Sekaligus"}
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Kompresi pintar otomatis: Ukuran hemat hingga 95%, teks nota tetap 100% terbaca jelas.</span>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Staged files waiting to be uploaded */}
                        {canEdit && stagedFiles.length > 0 && (
                            <div className="space-y-3 p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    <div>
                                        <span className="font-bold text-blue-900">
                                            {stagedFiles.length} Foto Nota Siap Diunggah:
                                        </span>
                                        {compressionStats && (
                                            <span className="block text-[11px] text-blue-700 mt-0.5">
                                                Total ukuran: {formatFileSize(compressionStats.totalCompressed)} (dikompresi dari {formatFileSize(compressionStats.totalOriginal)} — hemat {compressionStats.savedPercent}%)
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStagedFiles([])}
                                            className="h-7 text-xs text-slate-500"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={onExecuteBulkUpload}
                                            disabled={isUploading}
                                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                        >
                                            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                            Upload {stagedFiles.length} Foto
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    {stagedFiles.map((sf, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1.5 bg-white pl-2 pr-1.5 py-1 rounded-lg border text-xs shadow-2xs"
                                        >
                                            <span className="truncate max-w-[120px] font-medium text-slate-700" title={sf.name}>
                                                {sf.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                ({formatFileSize(sf.compressedSize)})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setStagedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded-sm"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Gallery of already uploaded attachments */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                <span>Lampiran Nota Tersimpan ({activeBudget.attachments?.length || 0})</span>
                            </div>

                            {!activeBudget.attachments || activeBudget.attachments.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed text-slate-400 text-xs">
                                    Belum ada foto nota yang diunggah untuk budget ini.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {activeBudget.attachments.map((att: any) => (
                                        <div
                                            key={att.id}
                                            className="group relative rounded-xl border bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-all"
                                        >
                                            <div
                                                className="h-28 bg-slate-100 relative overflow-hidden cursor-pointer flex items-center justify-center"
                                                onClick={() => onPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                            >
                                                <img
                                                    src={att.fileUrl}
                                                    alt={att.fileName}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Eye className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="p-2 text-[10px] space-y-1">
                                                <div className="font-medium truncate text-slate-800" title={att.fileName}>
                                                    {att.fileName}
                                                </div>
                                                <div className="flex items-center justify-between text-slate-400">
                                                    <span>{att.fileSize ? formatFileSize(att.fileSize) : "-"}</span>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => onDeleteAttachment(att.id)}
                                                            className="text-slate-400 hover:text-rose-600 p-0.5"
                                                            title="Hapus foto"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
