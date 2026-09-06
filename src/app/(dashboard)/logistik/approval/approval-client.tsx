"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    CheckCircle2,
    XCircle,
    Printer,
    Search,
    AlertTriangle,
    Eye,
    Upload,
    RotateCcw,
    Loader2,
    CheckSquare,
    Clock,
    FileText,
    Trash2,
    ImageIcon
} from "lucide-react"
import Link from "next/link"
import { updatePoStatus, getApproverQueue, getApproverHistory, updateUserSignature } from "../po/actions"

interface CurrentUser {
    id: string
    role: string
    signatureUrl: string | null
}

export function ApprovalClient({
    initialQueue,
    initialHistory,
    currentUser,
}: {
    initialQueue: any[]
    initialHistory: any[]
    currentUser: CurrentUser
}) {
    const [activeTab, setActiveTab] = useState("queue")
    const [queue, setQueue] = useState<any[]>(initialQueue)
    const [history, setHistory] = useState<any[]>(initialHistory)
    const [userSig, setUserSig] = useState<string | null>(currentUser.signatureUrl)
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)

    // Modal Review PO State
    const [selectedPo, setSelectedPo] = useState<any | null>(null)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)

    // Approval Form State
    const [approverNotes, setApproverNotes] = useState("")
    const [modalSigUrl, setModalSigUrl] = useState<string | null>(null)
    const [modalSaveAsDefault, setModalSaveAsDefault] = useState(false)
    const [uploadingSig, setUploadingSig] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Profile Signature Upload State (Tab Tanda Tangan)
    const [profileUploadFile, setProfileUploadFile] = useState<File | null>(null)
    const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
    const [savingProfileSig, setSavingProfileSig] = useState(false)

    // Rejection state
    const [rejectMode, setRejectMode] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")

    const isAdmin = ['SuperAdminBP', 'AdminLogistik'].includes(currentUser.role)

    // Refresh Queue & History
    const refreshData = async () => {
        setLoading(true)
        try {
            const [qRes, hRes] = await Promise.all([
                getApproverQueue(),
                getApproverHistory(),
            ])
            if (qRes.success) setQueue(qRes.data)
            if (hRes.success) setHistory(hRes.data)
        } finally {
            setLoading(false)
        }
    }

    // Helper: Upload PNG file to server
    const uploadPngFile = async (file: File): Promise<string | null> => {
        if (!file.type.includes("png") && !file.name.toLowerCase().endsWith(".png")) {
            alert("Format file harus PNG (disarankan berlatar belakang transparan).")
            return null
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "signatures")

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        })
        const data = await res.json()
        if (data.success && data.url) {
            return data.url
        } else {
            alert("Gagal mengupload file PNG: " + (data.error || "Unknown error"))
            return null
        }
    }

    // Handle Profile Tab File Selection
    const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.includes("png") && !file.name.toLowerCase().endsWith(".png")) {
            alert("Mohon pilih file dengan format standard .PNG")
            return
        }

        setProfileUploadFile(file)
        const objectUrl = URL.createObjectURL(file)
        setProfilePreviewUrl(objectUrl)
    }

    // Save Profile Signature
    const handleSaveProfileSignature = async () => {
        if (!profileUploadFile) return
        setSavingProfileSig(true)
        try {
            const uploadedUrl = await uploadPngFile(profileUploadFile)
            if (!uploadedUrl) return

            const res = await updateUserSignature(uploadedUrl)
            if (res.success) {
                setUserSig(uploadedUrl)
                setProfileUploadFile(null)
                setProfilePreviewUrl(null)
                alert("Tanda tangan PNG berhasil disimpan ke profil Anda!")
            } else {
                alert("Gagal menyimpan ke profil: " + res.error)
            }
        } finally {
            setSavingProfileSig(false)
        }
    }

    // Delete Profile Signature
    const handleDeleteProfileSignature = async () => {
        if (!confirm("Hapus tanda tangan PNG tersimpan dari profil Anda?")) return
        setSavingProfileSig(true)
        try {
            const res = await updateUserSignature("")
            if (res.success) {
                setUserSig(null)
                setProfileUploadFile(null)
                setProfilePreviewUrl(null)
                alert("Tanda tangan profil berhasil dihapus.")
            } else {
                alert("Gagal menghapus: " + res.error)
            }
        } finally {
            setSavingProfileSig(false)
        }
    }

    // Handle Modal File Upload
    const handleModalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingSig(true)
        try {
            const uploadedUrl = await uploadPngFile(file)
            if (uploadedUrl) {
                setModalSigUrl(uploadedUrl)
            }
        } finally {
            setUploadingSig(false)
        }
    }

    // Open review modal
    const openReview = (po: any) => {
        setSelectedPo(po)
        setApproverNotes("")
        setRejectMode(false)
        setRejectionReason("")
        setModalSigUrl(userSig || null)
        setModalSaveAsDefault(false)
        setReviewModalOpen(true)
    }

    // Action: Approve PO
    const handleApprove = async () => {
        if (!selectedPo) return

        let finalSigUrl = modalSigUrl || userSig || null

        // Approver non-admin wajib memiliki TTD PNG
        if (!isAdmin && !finalSigUrl) {
            alert("Harap upload tanda tangan PNG terlebih dahulu sebelum menyetujui PO.")
            return
        }

        // Simpan sebagai default jika dicentang
        if (!isAdmin && modalSaveAsDefault && finalSigUrl) {
            await updateUserSignature(finalSigUrl)
            setUserSig(finalSigUrl)
        }

        setIsSubmitting(true)
        try {
            const res = await updatePoStatus(selectedPo.id, "APPROVED", {
                notes: approverNotes || undefined,
                signatureUrl: finalSigUrl || undefined,
                channel: "WEB",
            })

            if (res.success) {
                alert(`Purchase Order ${selectedPo.po_number} berhasil disetujui!`)
                setReviewModalOpen(false)
                refreshData()
            } else {
                alert("Gagal menyetujui PO: " + res.error)
            }
        } catch (err: any) {
            alert("Error: " + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Action: Reject PO
    const handleReject = async () => {
        if (!selectedPo) return
        if (!rejectionReason.trim()) {
            alert("Mohon masukkan alasan penolakan PO.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await updatePoStatus(selectedPo.id, "REJECTED", {
                notes: rejectionReason,
                channel: "WEB",
            })

            if (res.success) {
                alert(`Purchase Order ${selectedPo.po_number} telah ditolak.`)
                setReviewModalOpen(false)
                refreshData()
            } else {
                alert("Gagal menolak PO: " + res.error)
            }
        } catch (err: any) {
            alert("Error: " + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Filter lists
    const filteredQueue = queue.filter(po => {
        const q = searchQuery.toLowerCase()
        return (
            po.po_number.toLowerCase().includes(q) ||
            (po.supplier_nama && po.supplier_nama.toLowerCase().includes(q)) ||
            (po.companyGroup?.name && po.companyGroup.name.toLowerCase().includes(q)) ||
            (po.proyek_nama && po.proyek_nama.toLowerCase().includes(q))
        )
    })

    const filteredHistory = history.filter(po => {
        const q = searchQuery.toLowerCase()
        return (
            po.po_number.toLowerCase().includes(q) ||
            (po.supplier_nama && po.supplier_nama.toLowerCase().includes(q)) ||
            (po.companyGroup?.name && po.companyGroup.name.toLowerCase().includes(q)) ||
            (po.proyek_nama && po.proyek_nama.toLowerCase().includes(q))
        )
    })

    return (
        <div className="space-y-4">
            {/* ── Page Title & Actions ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Persetujuan Purchase Order</h1>
                    <p className="text-muted-foreground text-sm">
                        Daftar antrean persetujuan PO logistik, riwayat approval, dan tanda tangan digital.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 gap-1.5 self-start sm:self-auto"
                    onClick={refreshData}
                    disabled={loading}
                >
                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
                </Button>
            </div>

            {/* ── Tabs Navigation ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <TabsList className="bg-slate-100 p-1 border border-slate-200">
                        <TabsTrigger value="queue" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Menunggu Persetujuan</span>
                            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 font-semibold">
                                {queue.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Riwayat Persetujuan</span>
                            <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 font-semibold">
                                {history.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tanda Tangan Saya</span>
                        </TabsTrigger>
                    </TabsList>

                    {activeTab !== "profile" && (
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Cari no PO, supplier, proyek..."
                                className="pl-8 text-xs h-8 bg-white border-slate-200"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* ── TAB 1: ANTREAN MENUNGGU PERSETUJUAN ── */}
                <TabsContent value="queue">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow className="text-xs border-b border-slate-200">
                                        <TableHead className="py-2.5 px-3">No. PO & Kategori</TableHead>
                                        <TableHead className="py-2.5 px-3">Perusahaan & Proyek</TableHead>
                                        <TableHead className="py-2.5 px-3">Supplier</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">Tgl Terbit</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">Jml Item</TableHead>
                                        <TableHead className="py-2.5 px-3 text-right">Total Nilai</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredQueue.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground h-32 text-xs">
                                                {searchQuery ? "Tidak ada PO yang cocok dengan pencarian." : "Tidak ada antrean Purchase Order yang menunggu persetujuan Anda."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredQueue.map(po => {
                                            const total = po.items?.reduce((acc: number, it: any) => acc + (it.subtotal || 0), 0) || 0
                                            const itemCount = po.items?.length || 0

                                            return (
                                                <TableRow key={po.id} className="hover:bg-slate-50/75 transition-colors text-xs border-b border-slate-100">
                                                    <TableCell className="py-2.5 px-3">
                                                        <div className="font-mono font-bold text-blue-600">{po.po_number}</div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">{po.category?.name || "-"}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 max-w-[180px]">
                                                        <div className="font-medium text-slate-800 truncate">{po.companyGroup?.name || "-"}</div>
                                                        <div className="text-[11px] text-slate-500 truncate">{po.proyek_nama || "-"}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 max-w-[140px] text-slate-800 font-medium truncate">
                                                        {po.supplier_nama || "-"}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap text-[11px]">
                                                        {po.tanggal_terbit
                                                            ? new Date(po.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : "-"
                                                        }
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-center font-medium">
                                                        {itemCount} Item
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        Rp {total.toLocaleString('id-ID')}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-center">
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3 gap-1.5 font-medium shadow-xs"
                                                            onClick={() => openReview(po)}
                                                        >
                                                            <CheckSquare className="w-3.5 h-3.5" /> Review & Putuskan
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB 2: RIWAYAT PERSETUJUAN ── */}
                <TabsContent value="history">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow className="text-xs border-b border-slate-200">
                                        <TableHead className="py-2.5 px-3">No. PO</TableHead>
                                        <TableHead className="py-2.5 px-3">Perusahaan & Proyek</TableHead>
                                        <TableHead className="py-2.5 px-3">Supplier</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">Tgl Keputusan</TableHead>
                                        <TableHead className="py-2.5 px-3 text-right">Total Nilai</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">Status</TableHead>
                                        <TableHead className="py-2.5 px-3">Catatan</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground h-32 text-xs">
                                                {searchQuery ? "Tidak ada riwayat yang cocok dengan pencarian." : "Belum ada riwayat persetujuan atau penolakan PO."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredHistory.map(po => {
                                            const total = po.items?.reduce((acc: number, it: any) => acc + (it.subtotal || 0), 0) || 0
                                            const isApproved = po.status === "APPROVED"
                                            const isRejected = po.status === "REJECTED"

                                            return (
                                                <TableRow key={po.id} className="hover:bg-slate-50/75 transition-colors text-xs border-b border-slate-100">
                                                    <TableCell className="py-2.5 px-3">
                                                        <div className="font-mono font-bold text-blue-600">{po.po_number}</div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">{po.category?.name || "-"}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 max-w-[180px]">
                                                        <div className="font-medium text-slate-800 truncate">{po.companyGroup?.name || "-"}</div>
                                                        <div className="text-[11px] text-slate-500 truncate">{po.proyek_nama || "-"}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 max-w-[140px] text-slate-800 font-medium truncate">
                                                        {po.supplier_nama || "-"}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap text-[11px]">
                                                        {po.updatedAt
                                                            ? new Date(po.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : "-"
                                                        }
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        Rp {total.toLocaleString('id-ID')}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-center whitespace-nowrap">
                                                        {isApproved && (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium">
                                                                Disetujui
                                                            </Badge>
                                                        )}
                                                        {isRejected && (
                                                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-medium">
                                                                Ditolak
                                                            </Badge>
                                                        )}
                                                        {!isApproved && !isRejected && (
                                                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-medium">
                                                                {po.status}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 max-w-[180px]">
                                                        {isRejected && po.rejectionReason && (
                                                            <span className="text-[11px] text-rose-600 italic truncate block" title={po.rejectionReason}>
                                                                Alasan: {po.rejectionReason}
                                                            </span>
                                                        )}
                                                        {isApproved && (
                                                            <span className="text-[11px] text-slate-600 truncate block">
                                                                {po.fvpNotes || po.ceoNotes || (po.isBypassed ? "Disetujui Administratif" : "Sesuai rincian")}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                                                title="Lihat Detail PO"
                                                                onClick={() => openReview(po)}
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </Button>
                                                            {isApproved && (
                                                                <Link href={`/print/po/${po.id}`} target="_blank">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                                                        title="Cetak Dokumen PO"
                                                                    >
                                                                        <Printer className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB 3: TANDA TANGAN SAYA (UPLOAD STANDAR PNG) ── */}
                <TabsContent value="profile">
                    <Card className="max-w-2xl border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-bold text-slate-900">
                                Tanda Tangan Digital (Format PNG)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Upload gambar tanda tangan bertipe PNG (standard). Tanda tangan ini akan otomatis dilampirkan pada formulir Purchase Order saat Anda menyetujuinya.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* Preview TTD Aktif */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-700">Tanda Tangan Aktif Saat Ini:</Label>
                                {userSig ? (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md">
                                        <div className="h-20 max-w-[200px] flex items-center justify-center p-1 bg-white rounded border border-slate-100">
                                            <img src={userSig} alt="Tanda Tangan Aktif" className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-8 gap-1.5"
                                            onClick={handleDeleteProfileSignature}
                                            disabled={savingProfileSig}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 max-w-md">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        Belum ada tanda tangan tersimpan di profil Anda.
                                    </div>
                                )}
                            </div>

                            {/* Form Upload File PNG Baru */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <Label className="text-xs font-semibold text-slate-700">
                                    {userSig ? "Ganti Tanda Tangan Baru (Upload File PNG):" : "Upload Tanda Tangan Baru (File PNG):"}
                                </Label>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <Input
                                        type="file"
                                        accept=".png,image/png"
                                        onChange={handleProfileFileChange}
                                        className="text-xs max-w-xs bg-white cursor-pointer"
                                    />
                                    {profileUploadFile && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 shadow-xs"
                                            onClick={handleSaveProfileSignature}
                                            disabled={savingProfileSig}
                                        >
                                            {savingProfileSig ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengupload...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-3.5 h-3.5" /> Simpan Tanda Tangan PNG
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {profilePreviewUrl && (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-xs space-y-1.5">
                                        <span className="text-[11px] font-medium text-slate-500 block">Preview File yang Dipilih:</span>
                                        <div className="h-16 flex items-center justify-center bg-white border border-slate-100 rounded p-1">
                                            <img src={profilePreviewUrl} alt="Preview" className="max-h-full object-contain" />
                                        </div>
                                    </div>
                                )}

                                <p className="text-[11px] text-slate-500">
                                    * Standar format yang didukung: <strong>.PNG</strong> (disarankan file hasil scan/export dengan background transparan).
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── MODAL REVIEW & PERSETUJUAN PO ── */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent className="!max-w-4xl sm:!max-w-4xl md:!max-w-4xl lg:!max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl border border-slate-200 shadow-xl bg-white">
                    <DialogHeader className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-900">
                                    Review PO: <span className="font-mono text-blue-600">{selectedPo?.po_number}</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    Periksa rincian pembelian barang sebelum memberikan keputusan persetujuan.
                                </DialogDescription>
                            </div>
                            <Badge className={
                                selectedPo?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs' :
                                selectedPo?.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200 text-xs' :
                                'bg-amber-50 text-amber-700 border-amber-200 text-xs'
                            }>
                                Status: {selectedPo?.status}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedPo && (
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Metadata Ringkas PO */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Perusahaan:</span>
                                    <span className="font-semibold text-slate-800">{selectedPo.companyGroup?.name || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Proyek:</span>
                                    <span className="font-semibold text-slate-800">{selectedPo.proyek_nama || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Supplier / Toko:</span>
                                    <span className="font-semibold text-slate-800">{selectedPo.supplier_nama || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Pembayaran:</span>
                                    <span className="font-semibold text-slate-800">
                                        {selectedPo.metode_pembayaran === 'CASH' ? 'Tunai (Cash)' : 'Kredit (Tempo)'}
                                    </span>
                                </div>
                            </div>

                            {/* Daftar Barang */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Rincian Barang:</Label>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                                            <tr>
                                                <th className="py-2 px-3 w-8 text-center">No</th>
                                                <th className="py-2 px-3">Nama Barang</th>
                                                <th className="py-2 px-3">Merk / Tipe</th>
                                                <th className="py-2 px-3 text-right">Qty</th>
                                                <th className="py-2 px-3">Satuan</th>
                                                <th className="py-2 px-3 text-right">Harga Satuan</th>
                                                <th className="py-2 px-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedPo.items?.map((it: any, idx: number) => {
                                                const masterItem = it.masterItem
                                                const hasPriceHike = masterItem && Number(it.harga_satuan) > Number(masterItem.harga)

                                                return (
                                                    <tr key={it.id} className="hover:bg-slate-50/50">
                                                        <td className="py-2 px-3 text-center text-slate-400 text-[10px]">{idx + 1}</td>
                                                        <td className="py-2 px-3 font-medium text-slate-800">
                                                            {masterItem?.name || "Barang"}
                                                            {hasPriceHike && (
                                                                <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-normal">
                                                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> Kenaikan Harga
                                                                </span>
                                                            )}
                                                            {it.keterangan && (
                                                                <div className="text-[10px] text-slate-400">{it.keterangan}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                                                            {masterItem?.merk || masterItem?.part_number || "-"}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-bold text-slate-800">
                                                            {it.quantity}
                                                        </td>
                                                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                                                            {masterItem?.satuan || "Pcs"}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                                                            Rp {Number(it.harga_satuan).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                                                            Rp {Number(it.subtotal).toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
                                            <tr>
                                                <td colSpan={6} className="px-3 py-2 text-right text-slate-600 text-xs">
                                                    Total Nilai PO:
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-bold text-sm text-emerald-700">
                                                    Rp {(selectedPo.items?.reduce((s: number, it: any) => s + (it.subtotal || 0), 0) || 0).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Section: Penolakan PO (Jika tombol Tolak ditekan) */}
                            {rejectMode ? (
                                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                                    <Label className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                                        <XCircle className="w-4 h-4 text-rose-600" />
                                        Alasan Penolakan Purchase Order:
                                    </Label>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        placeholder="Masukkan alasan mengapa PO ini ditolak..."
                                        className="text-xs bg-white border-rose-300"
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-8"
                                            onClick={() => setRejectMode(false)}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
                                            onClick={handleReject}
                                            disabled={isSubmitting || !rejectionReason.trim()}
                                        >
                                            {isSubmitting ? "Memproses..." : "Konfirmasi Tolak PO"}
                                        </Button>
                                    </div>
                                </div>
                            ) : selectedPo.status === "SUBMITTED" ? (
                                /* Section: Tanda Tangan & Catatan Approval */
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                    {isAdmin ? (
                                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs">
                                            Persetujuan Anda sebagai <strong>Administrator</strong> bersifat bypass administratif (tanpa lampiran tanda tangan gambar).
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-700 block">
                                                Tanda Tangan Digital (PNG):
                                            </Label>

                                            {modalSigUrl ? (
                                                <div className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg max-w-md">
                                                    <div className="h-14 w-28 bg-slate-50 border rounded flex items-center justify-center p-1">
                                                        <img src={modalSigUrl} alt="TTD" className="max-h-full object-contain" />
                                                    </div>
                                                    <div className="text-xs space-y-1">
                                                        <span className="text-slate-600 font-medium block">
                                                            {modalSigUrl === userSig ? "Tanda Tangan Default Profil" : "Tanda Tangan Baru Terunggah"}
                                                        </span>
                                                        <label className="text-blue-600 hover:underline cursor-pointer text-[11px] block">
                                                            <span>Ganti File PNG</span>
                                                            <input
                                                                type="file"
                                                                accept=".png,image/png"
                                                                onChange={handleModalFileChange}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="file"
                                                            accept=".png,image/png"
                                                            onChange={handleModalFileChange}
                                                            disabled={uploadingSig}
                                                            className="text-xs max-w-xs bg-white cursor-pointer"
                                                        />
                                                        {uploadingSig && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                                                    </div>
                                                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={modalSaveAsDefault}
                                                            onChange={e => setModalSaveAsDefault(e.target.checked)}
                                                            className="rounded text-blue-600"
                                                        />
                                                        Simpan sebagai tanda tangan profil saya
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Catatan Approval Opsional */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-700">Catatan Persetujuan (Opsional):</Label>
                                        <Input
                                            value={approverNotes}
                                            onChange={e => setApproverNotes(e.target.value)}
                                            placeholder="Contoh: Disetujui, pengiriman dijadwalkan besok..."
                                            className="text-xs bg-white"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <DialogFooter className="px-6 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setReviewModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Tutup
                        </Button>

                        {!rejectMode && selectedPo?.status === "SUBMITTED" && (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-8 gap-1"
                                    onClick={() => setRejectMode(true)}
                                    disabled={isSubmitting}
                                >
                                    <XCircle className="w-3.5 h-3.5" /> Tolak PO
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-8 gap-1.5 shadow-xs"
                                    onClick={handleApprove}
                                    disabled={isSubmitting || uploadingSig}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Purchase Order
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
