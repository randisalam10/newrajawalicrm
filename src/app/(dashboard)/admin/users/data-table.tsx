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

interface DataTableProps {
    data: UserRow[]
    eligibleEmployees?: any[]
}

export function DataTable({
    data,
    eligibleEmployees = [],
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
            setDeleteUserObj(null)
        } else {
            toast({ variant: "destructive", title: "Gagal Hapus", description: result.error as string })
        }
        setIsDeleting(false)
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">User List</h2>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} size="sm" className="h-9">
                    <Plus className="mr-2 h-4 w-4" /> Tambah User
                </Button>
            </div>

            <SimpleDataTable<UserRow>
                data={data}
                searchKeys={["username", "name", "locationName"]}
                searchPlaceholder="Cari username, nama, atau cabang..."
            >
                {(items, sortConfig, toggleSort) => (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Username" sortKey="username" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Nama Pegawai" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Sistem Role" sortKey="role" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Cabang" sortKey="locationName" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<UserRow> label="Jabatan" sortKey="position" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length ? (
                                    items.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="py-2.5 font-medium">{user.username}</TableCell>
                                            <TableCell className="py-2.5">{user.name}</TableCell>
                                            <TableCell className="py-2.5">
                                                <Badge variant={user.role === "AdminBP" ? "default" : "secondary"} className="text-[11px] font-medium tracking-wide">
                                                    {user.role === "AdminBP" ? "Admin Cabang" : "Operator / Kasir"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {user.locationName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2.5">{user.position}</TableCell>
                                            <TableCell className="py-2.5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => setEditingUser(user)} className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2" /> Edit User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setDeleteUserObj(user)} className="cursor-pointer text-destructive focus:text-destructive">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Hapus User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
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

