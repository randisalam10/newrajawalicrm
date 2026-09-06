"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserForm } from "./user-form"
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { UserRow } from "./columns"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteUser } from "./actions"
import { useToast } from "@/hooks/use-toast"

export const getRoleBadge = (role: string) => {
    switch (role) {
        case "SuperAdminBP":
            return (
                <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-none text-[11px] font-medium tracking-wide">
                    Super Admin
                </Badge>
            )
        case "AdminBP":
            return (
                <Badge variant="default" className="text-[11px] font-medium tracking-wide">
                    Admin Cabang
                </Badge>
            )
        case "OperatorBP":
            return (
                <Badge variant="secondary" className="text-[11px] font-medium tracking-wide">
                    Operator / Kasir
                </Badge>
            )
        case "AdminLogistik":
            return (
                <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-none text-[11px] font-medium tracking-wide">
                    Admin Logistik
                </Badge>
            )
        case "CEO":
            return (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-[11px] font-medium tracking-wide">
                    CEO
                </Badge>
            )
        case "FVP":
            return (
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none text-[11px] font-medium tracking-wide">
                    FVP
                </Badge>
            )
        case "Approver":
            return (
                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-none text-[11px] font-medium tracking-wide">
                    Approver
                </Badge>
            )
        default:
            return (
                <Badge variant="outline" className="text-[11px] font-medium tracking-wide">
                    {role}
                </Badge>
            )
    }
}

interface DataTableProps {
    data: UserRow[]
    eligibleEmployees?: any[]
    roles?: any[]
}

export function DataTable({
    data,
    eligibleEmployees = [],
    roles = [],
}: DataTableProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserRow | null>(null)
    const [deleteUserObj, setDeleteUserObj] = useState<UserRow | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    const handleDelete = async () => {
        if (!deleteUserObj) return
        setIsDeleting(true)
        const result = await deleteUser(deleteUserObj.id)
        if (result.success) {
            toast({ title: "Terhapus", description: "User berhasil dihapus dari sistem." })
            window.location.reload()
        } else {
            toast({ title: "Gagal", description: result.error || "Gagal menghapus user.", variant: "destructive" })
        }
        setIsDeleting(false)
        setDeleteUserObj(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah User
                </Button>
            </div>
            <SimpleDataTable<UserRow>
                data={data}
                searchKeys={["username", "name", "locationName"]}
                searchPlaceholder="Cari username, nama, atau cabang..."
            >
                {(items, sortConfig, toggleSort) => (
                    <div className="rounded-md border border-slate-200">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-[180px]">
                                        <SortableHeader<UserRow> label="Username" sortKey="username" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Pegawai Terkait" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Role" sortKey="role" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Cabang / Lokasi" sortKey="locationName" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="w-[80px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Tidak ada user yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-semibold text-slate-900">
                                                {row.username}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-800">{row.name}</span>
                                                    <span className="text-xs text-muted-foreground">{row.position}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getRoleBadge(row.role)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium text-slate-600">
                                                    {row.locationName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setEditingUser(row)}
                                                            className="cursor-pointer gap-2"
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteUserObj(row)}
                                                            className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Hapus User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </SimpleDataTable>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Tambah Data User</DialogTitle>
                    </DialogHeader>
                    <UserForm
                        eligibleEmployees={eligibleEmployees}
                        roles={roles}
                        onSuccess={() => setIsCreateOpen(false)}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Data User: {editingUser?.username}</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <UserForm
                            eligibleEmployees={eligibleEmployees}
                            roles={roles}
                            initialData={{
                                id: editingUser.id,
                                username: editingUser.username,
                                role: editingUser.role as any,
                                name: editingUser.name,
                                position: editingUser.position as any,
                                locationId: editingUser.locationId,
                                join_date: editingUser.join_date,
                                employeeId: editingUser.employeeId,
                            }}
                            onSuccess={() => setEditingUser(null)}
                            onCancel={() => setEditingUser(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteUserObj} onOpenChange={(open) => !open && setDeleteUserObj(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus User Permanen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan menghapus user <strong>{deleteUserObj?.username}</strong>. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

