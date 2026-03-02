"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Combobox } from "@/components/ui/combobox"

export function POCreateClient({ companies, projects, categories, suppliers, items }: any) {
    const [selectedCompanyId, setSelectedCompanyId] = useState("")
    const [selectedCategoryId, setSelectedCategoryId] = useState("")
    const [selectedSupplierId, setSelectedSupplierId] = useState("")

    const filteredProjects = projects.filter((p: any) => p.companyGroupId === selectedCompanyId)
    const activeCategory = categories.find((c: any) => c.id === selectedCategoryId)
    const availableItemsForSupplier = items.filter((i: any) => i.supplierId === selectedSupplierId)

    const [pimpinan, setPimpinan] = useState("")
    const [kepalaPeralatan, setKepalaPeralatan] = useState("")
    const [poItems, setPoItems] = useState<any[]>([])
    const [selectedItemId, setSelectedItemId] = useState("")
    const [metodePembayaran, setMetodePembayaran] = useState("CREDIT")
    const [pembuatAdmin] = useState("Reni Lempan Tiboyong") // Mock data dari session
    const [tanggalTerbit, setTanggalTerbit] = useState("")

    React.useEffect(() => {
        setTanggalTerbit(new Date().toISOString().split('T')[0])
    }, [])

    const handleCompanyChange = (val: string) => {
        setSelectedCompanyId(val)
        const comp = companies.find((c: any) => c.id === val)
        if (comp) setPimpinan(comp.pimpinan_default || "")
    }

    const handleAddItem = () => {
        if (!selectedItemId) return
        const itm = items.find((i: any) => i.id === selectedItemId)
        if (!itm) return
        setPoItems([...poItems, {
            ...itm,
            cartId: Math.random().toString(),
            quantity: 1,
            keterangan: ""
        }])
        setSelectedItemId("")
    }

    const totalBeforeOngkir = poItems.reduce((acc, curr) => acc + (curr.harga * curr.quantity), 0)

    const companyOptions = companies.map((c: any) => ({ value: c.id, label: c.name }))
    const projectOptions = filteredProjects.map((p: any) => ({
        value: p.id,
        label: p.kode_proyek ? `${p.name} (${p.kode_proyek})` : p.name
    }))
    const categoryOptions = categories.map((c: any) => ({ value: c.id, label: `${c.name} (${c.kode_kategori})` }))
    const supplierOptions = suppliers.map((s: any) => ({ value: s.id, label: s.name }))
    const itemOptions = availableItemsForSupplier.map((i: any) => ({
        value: i.id,
        label: `${i.name} - Rp ${i.harga.toLocaleString('id-ID')}`
    }))

    return (
        <form className="max-w-6xl space-y-6" onSubmit={e => { e.preventDefault(); alert("Mock Submit PO") }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Bagian Kiri: Header Info */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="text-lg">Informasi Dokumen & Tujuan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Perusahaan Penerbit (KOP Surat) *</Label>
                            <Combobox
                                options={companyOptions}
                                value={selectedCompanyId}
                                onChange={handleCompanyChange}
                                placeholder="Pilih Perusahaan..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tujuan / Lokasi Pemesanan (Proyek) *</Label>
                            <div className={cn(selectedCompanyId ? "" : "opacity-50 pointer-events-none")}>
                                <Combobox
                                    options={projectOptions}
                                    value=""
                                    onChange={() => { }}
                                    placeholder="Pilih Proyek..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                            <Label>Kategori PO *</Label>
                            <Combobox
                                options={categoryOptions}
                                value={selectedCategoryId}
                                onChange={setSelectedCategoryId}
                                placeholder="Pilih Kategori..."
                            />
                        </div>

                        {activeCategory?.kode_kategori === "SPR" && (
                            <div className="space-y-2 p-3 bg-red-50/50 border border-red-100 rounded-md">
                                <Label className="text-red-700 font-semibold">KM/HM Kendaraan (Opsional)</Label>
                                <Input placeholder="Contoh: 15.000 KM" />
                            </div>
                        )}

                        <div className="space-y-2 pt-2 border-t">
                            <Label>Toko / Supplier *</Label>
                            <Combobox
                                options={supplierOptions}
                                value={selectedSupplierId}
                                onChange={(val) => {
                                    setSelectedSupplierId(val)
                                    setPoItems([])
                                }}
                                placeholder="Pilih Toko..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Metode Pembayaran *</Label>
                            <Combobox
                                options={[
                                    { value: "CASH", label: "Cash / Tunai" },
                                    { value: "CREDIT", label: "Kredit" }
                                ]}
                                value={metodePembayaran}
                                onChange={setMetodePembayaran}
                                placeholder="Pilih Metode"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bagian Kanan: Penandatangan */}
                <Card className="shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <CardTitle className="text-lg">Penandatangan & Meta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Tanggal Terbit PO</Label>
                            <Input
                                type="date"
                                value={tanggalTerbit}
                                onChange={e => setTanggalTerbit(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label>Pembuat PO (Sistem)</Label>
                            <Input value={pembuatAdmin} disabled className="bg-slate-50 text-slate-500" />
                        </div>

                        <div className="space-y-2">
                            <Label>Nama Kepala Peralatan / Pemesan *</Label>
                            <Input value={kepalaPeralatan} onChange={e => setKepalaPeralatan(e.target.value)} placeholder="Contoh: MUSRAN" required />
                            <p className="text-xs text-slate-500">Tampil di TTD paling kanan</p>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label>Jabatan Pimpinan Perusahaan</Label>
                            <Input defaultValue="Pimpinan Perusahaan" disabled className="bg-slate-50" />
                        </div>

                        <div className="space-y-2">
                            <Label>Nama Pimpinan Perusahaan *</Label>
                            <Input value={pimpinan} onChange={e => setPimpinan(e.target.value)} placeholder="Nama Pimpinan" required />
                            <p className="text-xs text-slate-500">Tampil di TTD kiri (Menyetujui)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bagian Bawah: Item Barang */}
            <Card className="shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg">Rincian Barang Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 bg-slate-50 border-b flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>Pilih Barang dari Master *</Label>
                            <div className={cn(selectedSupplierId ? "" : "opacity-50 pointer-events-none")}>
                                <Combobox
                                    options={itemOptions}
                                    value={selectedItemId}
                                    onChange={setSelectedItemId}
                                    placeholder="Cari nama barang..."
                                />
                            </div>
                        </div>
                        <Button type="button" onClick={handleAddItem} disabled={!selectedItemId}>
                            <Plus className="w-4 h-4 mr-2" /> Tambah ke PO
                        </Button>
                    </div>

                    {!selectedSupplierId && (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                            <Info className="w-8 h-8 mb-2 opacity-50" />
                            <p>Pilih Toko / Supplier pada form informasi dokumen di atas.</p>
                        </div>
                    )}
                    {selectedSupplierId && poItems.length === 0 && (
                        <div className="p-8 text-center text-slate-500">Belum ada rincian barang. Silakan tambah barang.</div>
                    )}

                    {poItems.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 border-b">
                                    <tr>
                                        <th className="py-2 px-4 text-left font-semibold text-slate-600">Info Barang</th>
                                        <th className="py-2 px-4 text-center font-semibold text-slate-600 w-24">Qty</th>
                                        <th className="py-2 px-4 text-left font-semibold text-slate-600 w-20">Satuan</th>
                                        <th className="py-2 px-4 text-right font-semibold text-slate-600 w-32">Harga Satuan</th>
                                        <th className="py-2 px-4 text-left font-semibold text-slate-600">Keterangan Khusus</th>
                                        <th className="py-2 px-4 text-right font-semibold text-slate-600 w-32">Total Harga</th>
                                        <th className="py-2 px-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poItems.map((item) => (
                                        <tr key={item.cartId} className="border-b">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-900">{item.name}</div>
                                                <div className="text-xs text-slate-500 tracking-tight mt-1">
                                                    Part/Tipe: {item.part_number || "-"} | Merk: {item.merk || "-"}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4">
                                                <Input
                                                    type="number" min="1" value={item.quantity}
                                                    onChange={e => setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, quantity: Number(e.target.value) } : i))}
                                                    className="w-16 text-center h-8 mx-auto"
                                                />
                                            </td>
                                            <td className="py-2 px-4 text-slate-600">{item.satuan}</td>
                                            <td className="py-2 px-4 text-right whitespace-nowrap">Rp {item.harga.toLocaleString('id-ID')}</td>
                                            <td className="py-2 px-4">
                                                <Input
                                                    placeholder="Contoh: Plat DT 8258 RI"
                                                    value={item.keterangan}
                                                    onChange={e => setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, keterangan: e.target.value } : i))}
                                                    className="h-8 text-xs"
                                                />
                                            </td>
                                            <td className="py-2 px-4 text-right font-semibold whitespace-nowrap">
                                                Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-2 px-4">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setPoItems(poItems.filter(i => i.cartId !== item.cartId))}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/80">
                                    <tr>
                                        <td colSpan={5} className="py-4 px-4 text-right font-bold text-slate-700">TOTAL HARGA:</td>
                                        <td className="py-4 px-4 text-right font-bold text-lg text-green-700 whitespace-nowrap">Rp {totalBeforeOngkir.toLocaleString('id-ID')}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 sticky bottom-4">
                <Button type="button" variant="outline" className="bg-white">Batal</Button>
                <Button type="submit" size="lg" disabled={poItems.length === 0} className="shadow-lg">
                    Simpan dan Generate Nomor PO
                </Button>
            </div>
        </form>
    )
}
