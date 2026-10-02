"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { DollarSign, Plus } from "lucide-react"
import { fmt } from "../../utils/billing-helpers"
import { PaginationBar } from "../pagination-bar"

interface DepositTabProps {
    deposits: any[]
    depositPage: number
    setDepositPage: (p: number) => void
    canManage?: boolean
    onOpenDepositDialog: (dep: any) => void
    PAGE_SIZE: number
}

export function DepositTab({
    deposits = [],
    depositPage,
    setDepositPage,
    canManage,
    onOpenDepositDialog,
    PAGE_SIZE,
}: DepositTabProps) {
    if (deposits.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Saldo Deposito per Proyek</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-center py-12 text-slate-400">
                        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Belum ada deposito</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const pageDeps = deposits.slice((depositPage - 1) * PAGE_SIZE, depositPage * PAGE_SIZE)

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Saldo Deposito per Proyek</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="text-xs">Customer / Proyek</TableHead>
                            <TableHead className="text-xs text-right">Total Setor</TableHead>
                            <TableHead className="text-xs text-right">Sisa</TableHead>
                            {canManage && <TableHead className="w-24"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageDeps.map((dep: any) => (
                            <TableRow key={dep.projectId} className="text-xs">
                                <TableCell>
                                    <div className="font-medium text-slate-800">{dep.customerName}</div>
                                    <div className="text-slate-400">{dep.projectName}</div>
                                </TableCell>
                                <TableCell className="text-right font-mono">{fmt(dep.totalDeposited)}</TableCell>
                                <TableCell className={`text-right font-bold font-mono ${dep.totalDeposited > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                    {fmt(dep.totalDeposited)}
                                </TableCell>
                                {canManage && (
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs cursor-pointer hover:bg-slate-100"
                                            onClick={() => onOpenDepositDialog(dep)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Setor
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <PaginationBar page={depositPage} total={deposits.length} perPage={PAGE_SIZE} onPageChange={setDepositPage} />
            </CardContent>
        </Card>
    )
}
