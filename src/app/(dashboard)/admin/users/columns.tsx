"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserForm } from "./user-form"
import { deleteUser } from "./actions"
import { useToast } from "@/hooks/use-toast"

export type UserRow = {
    id: string
    username: string
    role: string
    name: string
    position: string
    locationName: string
    locationId: string
    join_date: string
}

export const getColumns = (eligibleEmployees: any[]): ColumnDef<UserRow>[] => [
    {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => <div className="font-medium">{row.original.username}</div>,
    },
    {
        accessorKey: "name",
        header: "Nama Pegawai",
    },
    {
        accessorKey: "role",
        header: "Sistem Role",
        cell: ({ row }) => {
            const role = row.getValue("role") as string
            return (
                <Badge variant={role === "AdminBP" ? "default" : "secondary"} className="text-[11px] font-medium tracking-wide">
                    {role === "AdminBP" ? "Admin Cabang" : "Operator / Kasir"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "locationName",
        header: "Cabang",
        cell: ({ row }) => {
            return (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {row.original.locationName}
                </span>
            )
        },
    },
    {
        accessorKey: "position",
        header: "Jabatan",
    },
    {
        id: "actions",
        header: "Aksi",
        cell: function ActionCell({ row }) {
            const user = row.original
            const [isEditOpen, setIsEditOpen] = useState(false)
            const [isDeleteOpen, setIsDeleteOpen] = useState(false)
            const [isDeleting, setIsDeleting] = useState(false)
            const { toast } = useToast()

            const handleDelete = async () => {
                setIsDeleting(true)
                const result = await deleteUser(user.id)
                if (result.success) {
                    toast({ title: "Terhapus", description: "User berhasil dihapus dari sistem." })
                    setIsDeleteOpen(false)
                } else {
                    toast({ variant: "destructive", title: "Gagal Hapus", description: result.error as string })
                }
                setIsDeleting(false)
            }

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="cursor-pointer text-destructive focus:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Hapus User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Edit Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Edit Data User: {user.username}</DialogTitle>
                            </DialogHeader>
                            <UserForm
                                eligibleEmployees={eligibleEmployees}
                                initialData={{
                                    id: user.id,
                                    username: user.username,
                                    role: user.role as any,
                                    name: user.name,
                                    position: user.position as any,
                                    locationId: user.locationId,
                                    join_date: user.join_date,
                                }}
                                onSuccess={() => setIsEditOpen(false)}
                                onCancel={() => setIsEditOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Delete Alert */}
                    <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus User Permanen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Anda akan menghapus user <strong>{user.username}</strong>. Tindakan ini tidak dapat dibatalkan.
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
                </>
            )
        },
    },
]
