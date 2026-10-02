"use client"

import React from "react"
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
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Plan } from "../types"

interface DeletePlanDialogProps {
    plan: Plan | null
    onClose: () => void
    onConfirmDelete: () => Promise<void>
    isDeleting: boolean
}

export function DeletePlanDialog({
    plan,
    onClose,
    onConfirmDelete,
    isDeleting,
}: DeletePlanDialogProps) {
    return (
        <AlertDialog open={!!plan} onOpenChange={(o) => { if (!o) onClose() }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Planning?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Rencana pengecoran untuk <strong>{plan?.project?.name}</strong> tanggal{" "}
                        <strong>{plan ? format(new Date(plan.date), "dd MMM yyyy", { locale: idLocale }) : ""}</strong> akan dihapus.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirmDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
