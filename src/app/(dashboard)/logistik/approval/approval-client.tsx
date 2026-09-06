"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    CheckSquare,
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    Printer,
    Search,
    AlertTriangle,
    Eye,
    PenTool,
    Upload,
    RotateCcw,
    Loader2,
    ShieldCheck,
    Building2,
    Sparkles,
    UserCheck,
    Send,
    ChevronRight,
    HelpCircle
} from "lucide-react"
import Link from "next/link"
import { updatePoStatus, getApproverQueue, getApproverHistory, updateUserSignature } from "../po/actions"

interface CurrentUser {
    id: string
    name: string
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
    const [activeTab, setActiveTab] = useState<"queue" | "history" | "profile">("queue")
    const [queue, setQueue] = useState<any[]>(initialQueue)
    const [history, setHistory] = useState<any[]>(initialHistory)
    const [userSig, setUserSig] = useState<string | null>(currentUser.signatureUrl)
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)

    // Modal Review PO
    const [selectedPo, setSelectedPo] = useState<any | null>(null)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)

    // Form Approval State
    const [approverNotes, setApproverNotes] = useState("")
    const [sigMode, setSigMode] = useState<"saved" | "draw" | "upload">(
        currentUser.signatureUrl ? "saved" : "draw"
    )
    const [uploadedSigUrl, setUploadedSigUrl] = useState<string | null>(null)
    const [saveAsDefault, setSaveAsDefault] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Rejection state
    const [rejectMode, setRejectMode] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")

    // Canvas Signature Ref & Drawing Logic
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)

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

    // Canvas drawing helpers
    useEffect(() => {
        if (sigMode === "draw" && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.strokeStyle = "#0f172a"
                ctx.lineWidth = 2.5
                ctx.lineCap = "round"
                ctx.lineJoin = "round"
            }
        }
    }, [sigMode, reviewModalOpen])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        setIsDrawing(true)
        const rect = canvas.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        ctx.beginPath()
        ctx.moveTo(clientX - rect.left, clientY - rect.top)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        ctx.lineTo(clientX - rect.left, clientY - rect.top)
        ctx.stroke()
        setHasDrawn(true)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasDrawn(false)
    }

    // Handle File Upload for Signature
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "signatures")

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (data.success && data.url) {
                setUploadedSigUrl(data.url)
            } else {
                alert("Gagal mengupload tanda tangan: " + (data.error || "Unknown error"))
            }
        } catch (err: any) {
            alert("Error upload: " + err.message)
        }
    }

    // Open review modal
    const openReview = (po: any) => {
        setSelectedPo(po)
        setApproverNotes("")
        setRejectMode(false)
        setRejectionReason("")
        setHasDrawn(false)
        setUploadedSigUrl(null)
        setSigMode(userSig ? "saved" : "draw")
        setReviewModalOpen(true)
    }

    // Action: Approve
    const handleApprove = async () => {
        if (!selectedPo) return

        let finalSigUrl: string | null = null

        // If not admin, require or resolve signature
        if (!isAdmin) {
            if (sigMode === "saved") {
                if (!userSig) {
                    alert("Anda belum memiliki tanda tangan tersimpan. Silakan gambar atau upload tanda tangan.")
                    return
                }
                finalSigUrl = userSig
            } else if (sigMode === "draw") {
                if (!hasDrawn || !canvasRef.current) {
                    alert("Silakan gambar tanda tangan Anda pada kotak tanda tangan terlebih dahulu.")
                    return
                }
                const dataUrl = canvasRef.current.toDataURL("image/png")
                // Upload canvas base64 to server
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file: dataUrl, folder: "signatures" }),
                })
                const uploadData = await uploadRes.json()
                if (!uploadData.success || !uploadData.url) {
                    alert("Gagal memproses gambar tanda tangan: " + (uploadData.error || "Unknown error"))
                    return
                }
                finalSigUrl = uploadData.url
            } else if (sigMode === "upload") {
                if (!uploadedSigUrl) {
                    alert("Silakan pilih dan upload file tanda tangan terlebih dahulu.")
                    return
                }
                finalSigUrl = uploadedSigUrl
            }

            // If save as default is checked, update user profile signature
            if (saveAsDefault && finalSigUrl) {
                await updateUserSignature(finalSigUrl)
                setUserSig(finalSigUrl)
            }
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

    // Action: Reject
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

    // Filtered lists
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
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                            Portal Persetujuan Purchase Order
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-slate-300">
                        Pemeriksaan rincian barang, verifikasi tanda tangan digital, dan persetujuan PO Logistik.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                        <span className="text-slate-400 block text-[10px]">Login Sebagai:</span>
                        <span className="font-semibold text-indigo-200">{currentUser.name} ({currentUser.role})</span>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs bg-white/5 border-white/20 text-white hover:bg-white/15"
                        onClick={refreshData}
                        disabled={loading}
                    >
                        <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>
            </div>

            {/* ── Tabs Navigation ── */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <TabsList className="bg-slate-100 p-1 border border-slate-200">
                        <TabsTrigger value="queue" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Menunggu Persetujuan</span>
                            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                                {queue.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Riwayat Persetujuan</span>
                            <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">
                                {history.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs gap-2">
                            <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Tanda Tangan Saya</span>
                        </TabsTrigger>
                    </TabsList>

                    {activeTab !== "profile" && (
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Cari nomor PO, supplier..."
                                className="pl-8 text-xs h-8 bg-white border-slate-200"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* ── TAB 1: ANTRIAN MENUNGGU PERSETUJUAN ── */}
                <TabsContent value="queue" className="space-y-3">
                    {filteredQueue.length === 0 ? (
                        <Card className="border-dashed py-12 text-center text-slate-500">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
                            <h3 className="font-semibold text-slate-700">Semua PO Sudah Diproses</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Saat ini tidak ada antrean Purchase Order yang membutuhkan persetujuan Anda.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredQueue.map(po => {
                                const total = po.items?.reduce((acc: number, it: any) => acc + it.subtotal, 0) || 0
                                const itemCount = po.items?.length || 0

                                return (
                                    <Card key={po.id} className="hover:shadow-md transition-shadow border-slate-200 flex flex-col justify-between">
                                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono font-bold text-blue-600 text-sm">{po.po_number}</span>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">{po.category?.name || "Kategori"}</div>
                                                </div>
                                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] font-medium border-amber-200">
                                                    Menunggu
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-3 pb-3 space-y-2 text-xs flex-1">
                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="font-medium truncate">{po.companyGroup?.name}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                                                <div>
                                                    <span className="text-slate-400 block">Proyek:</span>
                                                    <span className="text-slate-700 font-medium truncate block">{po.proyek_nama || "-"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Supplier:</span>
                                                    <span className="text-slate-700 font-medium truncate block">{po.supplier_nama || "-"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Tgl Pengajuan:</span>
                                                    <span className="text-slate-700 font-medium">
                                                        {po.submittedAt 
                                                            ? new Date(po.submittedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : new Date(po.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Jumlah Item:</span>
                                                    <span className="text-slate-700 font-medium">{itemCount} Macam Barang</span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-slate-500 font-medium text-[11px]">Total Nilai PO:</span>
                                                <span className="font-mono font-bold text-sm text-emerald-700">
                                                    Rp {total.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </CardContent>
                                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div className="text-[10px] text-slate-400">
                                                Pembuat: {po.pembuat_admin || po.submittedBy?.username || "Admin"}
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 shadow-xs"
                                                onClick={() => openReview(po)}
                                            >
                                                <CheckSquare className="w-3.5 h-3.5" /> Review & Putuskan
                                            </Button>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ── TAB 2: RIWAYAT PERSETUJUAN ── */}
                <TabsContent value="history" className="space-y-3">
                    {filteredHistory.length === 0 ? (
                        <Card className="border-dashed py-12 text-center text-slate-500">
                            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-slate-700">Belum Ada Riwayat</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Purchase order yang telah Anda setujui atau tolak akan tercatat di sini.
                            </p>
                        </Card>
                    ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="py-2.5 px-3">No. PO</th>
                                            <th className="py-2.5 px-3">Perusahaan & Proyek</th>
                                            <th className="py-2.5 px-3">Supplier</th>
                                            <th className="py-2.5 px-3 text-right">Total Nilai</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3">Catatan / Tanda Tangan</th>
                                            <th className="py-2.5 px-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredHistory.map(po => {
                                            const total = po.items?.reduce((acc: number, it: any) => acc + it.subtotal, 0) || 0
                                            const isApproved = po.status === "APPROVED"
                                            const isRejected = po.status === "REJECTED"

                                            return (
                                                <tr key={po.id} className="hover:bg-slate-50/75 transition-colors">
                                                    <td className="py-2 px-3">
                                                        <span className="font-mono font-bold text-blue-600">{po.po_number}</span>
                                                        <div className="text-[10px] text-slate-400">{po.category?.name}</div>
                                                    </td>
                                                    <td className="py-2 px-3 max-w-[180px]">
                                                        <div className="font-medium text-slate-800 truncate">{po.companyGroup?.name}</div>
                                                        <div className="text-[10px] text-slate-400 truncate">{po.proyek_nama || "-"}</div>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-700">
                                                        {po.supplier_nama || "-"}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        Rp {total.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        {isApproved && (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                                Disetujui
                                                            </Badge>
                                                        )}
                                                        {isRejected && (
                                                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                                                                Ditolak
                                                            </Badge>
                                                        )}
                                                        {!isApproved && !isRejected && (
                                                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                                                                {po.status}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 max-w-[200px]">
                                                        {isRejected && po.rejectionReason && (
                                                            <div className="text-[10px] text-rose-600 italic truncate" title={po.rejectionReason}>
                                                                Alasan: {po.rejectionReason}
                                                            </div>
                                                        )}
                                                        {isApproved && (
                                                            <div className="flex items-center gap-2">
                                                                {po.fvpSignatureUrl || po.ceoSignatureUrl ? (
                                                                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                                        <PenTool className="w-3 h-3" /> TTD Terlampir
                                                                    </div>
                                                                ) : po.isBypassed ? (
                                                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                        Bypass Admin
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
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
                                                                        title="Cetak PO dengan TTD"
                                                                    >
                                                                        <Printer className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ── TAB 3: TANDA TANGAN SAYA ── */}
                <TabsContent value="profile" className="space-y-4">
                    <Card className="max-w-2xl border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <PenTool className="w-4 h-4 text-indigo-600" />
                                Kelola Tanda Tangan Digital Saya
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Tanda tangan ini akan tersimpan secara aman di profil Anda dan dapat digunakan otomatis setiap kali Anda menyetujui Purchase Order.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userSig ? (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700">Tanda Tangan Aktif Saat Ini:</Label>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center max-w-sm h-36">
                                        <img 
                                            src={userSig} 
                                            alt="Tanda Tangan Saya" 
                                            className="max-h-28 object-contain"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Tanda tangan ini akan otomatis digunakan saat Anda menekan tombol Setujui PO. Anda dapat menggantinya dengan menggambar ulang di bawah.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    Anda belum memiliki tanda tangan tersimpan. Silakan gambar tanda tangan Anda di bawah dan simpan.
                                </div>
                            )}

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label className="text-xs font-semibold text-slate-700">Buat Tanda Tangan Baru (Gambar pada Kotak):</Label>
                                <div className="border border-slate-300 rounded-xl p-1 bg-white inline-block">
                                    <canvas
                                        ref={canvasRef}
                                        width={380}
                                        height={150}
                                        className="bg-slate-50/50 rounded-lg cursor-crosshair touch-none"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                    />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={clearCanvas} 
                                        className="text-xs h-7"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1" /> Bersihkan
                                    </Button>
                                    <Button 
                                        type="button" 
                                        size="sm" 
                                        disabled={!hasDrawn || isSubmitting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
                                        onClick={async () => {
                                            if (!canvasRef.current || !hasDrawn) return
                                            setIsSubmitting(true)
                                            try {
                                                const dataUrl = canvasRef.current.toDataURL("image/png")
                                                const uploadRes = await fetch("/api/upload", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ file: dataUrl, folder: "signatures" }),
                                                })
                                                const uploadData = await uploadRes.json()
                                                if (uploadData.success && uploadData.url) {
                                                    await updateUserSignature(uploadData.url)
                                                    setUserSig(uploadData.url)
                                                    alert("Tanda tangan profil berhasil diperbarui!")
                                                    clearCanvas()
                                                } else {
                                                    alert("Gagal mengupload tanda tangan: " + uploadData.error)
                                                }
                                            } finally {
                                                setIsSubmitting(false)
                                            }
                                        }}
                                    >
                                        {isSubmitting ? "Menyimpan..." : "💾 Simpan ke Profil Saya"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── MODAL REVIEW & APPROVAL DIALOG ── */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent className="!max-w-4xl sm:!max-w-4xl md:!max-w-4xl lg:!max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xl bg-white">
                    <DialogHeader className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-slate-800">
                                        Review Purchase Order: <span className="font-mono text-blue-600">{selectedPo?.po_number}</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500">
                                        Periksa rincian pembelian barang sebelum memberikan persetujuan resmi.
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                Status: {selectedPo?.status}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedPo && (
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Ringkasan Header PO */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Perusahaan:</span>
                                    <span className="font-semibold text-slate-800">{selectedPo.companyGroup?.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Proyek:</span>
                                    <span className="font-semibold text-slate-800">{selectedPo.proyek_nama || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Supplier / Toko:</span>
                                    <span className="font-semibold text-slate-800">{selectedPo.supplier_nama || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Pembayaran:</span>
                                    <span className="font-semibold text-slate-800">
                                        {selectedPo.metode_pembayaran === 'CASH' ? 'Tunai (Cash)' : 'Kredit (Tempo)'}
                                    </span>
                                </div>
                            </div>

                            {/* Daftar Barang Table */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Rincian Barang yang Dipesan:</Label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                                            <tr>
                                                <th className="py-2 px-3 w-8 text-center">No</th>
                                                <th className="py-2 px-3">Nama Barang</th>
                                                <th className="py-2 px-3">Part / Merk</th>
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
                                                                <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
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
                                                <td colSpan={6} className="px-3 py-2.5 text-right text-slate-600 uppercase text-[11px]">
                                                    Total Nilai Pembelian:
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-sm text-emerald-700">
                                                    Rp {(selectedPo.items?.reduce((s: number, it: any) => s + it.subtotal, 0) || 0).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Section: Penolakan Form (if Reject Mode is Active) */}
                            {rejectMode ? (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                                        <XCircle className="w-4 h-4 text-rose-600" />
                                        Alasan Penolakan Purchase Order
                                    </div>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        placeholder="Tuliskan alasan mengapa Purchase Order ini ditolak..."
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
                                            Batal Tolak
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
                            ) : (
                                /* Section: Tanda Tangan & Persetujuan (if Approver) */
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                                            <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                                            Verifikasi & Tanda Tangan Digital
                                        </span>
                                        {isAdmin && (
                                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-white">
                                                Bypass Administratif
                                            </Badge>
                                        )}
                                    </div>

                                    {isAdmin ? (
                                        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-blue-900 text-xs">
                                            <p className="leading-relaxed">
                                                Anda login dengan hak akses <strong>{currentUser.role}</strong>. Persetujuan ini bersifat administratif (bypass) dan <strong>tidak memerlukan input tanda tangan gambar</strong>. Pada cetakan PO resmi akan tercantum stempel administratif.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Pilihan Metode Tanda Tangan */}
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {userSig && (
                                                    <Button
                                                        type="button"
                                                        variant={sigMode === "saved" ? "default" : "outline"}
                                                        size="sm"
                                                        className={`text-xs h-7 ${sigMode === "saved" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                                                        onClick={() => setSigMode("saved")}
                                                    >
                                                        Tanda Tangan Tersimpan
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant={sigMode === "draw" ? "default" : "outline"}
                                                    size="sm"
                                                    className={`text-xs h-7 ${sigMode === "draw" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                                                    onClick={() => setSigMode("draw")}
                                                >
                                                    Gambar Baru
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={sigMode === "upload" ? "default" : "outline"}
                                                    size="sm"
                                                    className={`text-xs h-7 ${sigMode === "upload" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                                                    onClick={() => setSigMode("upload")}
                                                >
                                                    Upload File
                                                </Button>
                                            </div>

                                            {/* Preview or Input Box */}
                                            {sigMode === "saved" && userSig && (
                                                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-4">
                                                    <div className="h-20 w-44 bg-slate-50 rounded border border-slate-100 flex items-center justify-center p-1">
                                                        <img src={userSig} alt="Tanda Tangan Tersimpan" className="max-h-full object-contain" />
                                                    </div>
                                                    <div className="text-xs text-slate-600 space-y-0.5">
                                                        <div className="font-semibold text-slate-800">Tanda Tangan Default Profil</div>
                                                        <div className="text-[11px] text-slate-500">Tanda tangan ini akan dicetak pada lembar PO.</div>
                                                    </div>
                                                </div>
                                            )}

                                            {sigMode === "draw" && (
                                                <div className="space-y-1.5">
                                                    <div className="border border-slate-300 rounded-xl p-1 bg-white inline-block">
                                                        <canvas
                                                            ref={canvasRef}
                                                            width={380}
                                                            height={130}
                                                            className="bg-slate-50/50 rounded-lg cursor-crosshair touch-none"
                                                            onMouseDown={startDrawing}
                                                            onMouseMove={draw}
                                                            onMouseUp={stopDrawing}
                                                            onMouseLeave={stopDrawing}
                                                            onTouchStart={startDrawing}
                                                            onTouchMove={draw}
                                                            onTouchEnd={stopDrawing}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={clearCanvas} 
                                                            className="text-xs h-6 px-2"
                                                        >
                                                            <RotateCcw className="w-3 h-3 mr-1" /> Bersihkan
                                                        </Button>
                                                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={saveAsDefault} 
                                                                onChange={e => setSaveAsDefault(e.target.checked)}
                                                                className="rounded text-indigo-600"
                                                            />
                                                            Simpan sebagai tanda tangan profil saya
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {sigMode === "upload" && (
                                                <div className="space-y-2">
                                                    <Input
                                                        type="file"
                                                        accept="image/png,image/jpeg"
                                                        onChange={handleFileUpload}
                                                        className="text-xs max-w-sm bg-white"
                                                    />
                                                    {uploadedSigUrl && (
                                                        <div className="h-20 w-44 bg-slate-50 rounded border border-slate-200 flex items-center justify-center p-1">
                                                            <img src={uploadedSigUrl} alt="Uploaded Sig" className="max-h-full object-contain" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Catatan Persetujuan Optional */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-700">Catatan Persetujuan (Opsional):</Label>
                                        <Input
                                            value={approverNotes}
                                            onChange={e => setApproverNotes(e.target.value)}
                                            placeholder="Contoh: Disetujui dengan pengiriman bertahap..."
                                            className="text-xs bg-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="px-6 py-3 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0">
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
                                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-8"
                                    onClick={() => setRejectMode(true)}
                                    disabled={isSubmitting}
                                >
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak PO
                                </Button>
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-8 gap-1.5 shadow-sm"
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
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
