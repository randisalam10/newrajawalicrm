import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const { id } = await params
    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const expense = await prisma.rblExpense.findUnique({
            where: { id },
            include: { budget: true }
        })

        if (!expense) {
            return NextResponse.json({ error: 'Pengeluaran tidak ditemukan' }, { status: 404 })
        }

        if (!isSuperAdmin && expense.budget.locationId !== user.locationId) {
            return NextResponse.json({ error: 'Forbidden: Akses ditolak' }, { status: 403 })
        }

        if (expense.budget.status === 'CLOSED') {
            return NextResponse.json({
                error: 'Budget sudah ditutup. Tidak dapat mengubah pengeluaran.'
            }, { status: 400 })
        }

        const body = await req.json()
        const qty = body.quantity !== undefined ? Number(body.quantity) : expense.quantity
        const price = body.unitPrice !== undefined ? Number(body.unitPrice) : expense.unitPrice
        const totalAmount = body.amount !== undefined ? Number(body.amount) : qty * price

        const updated = await prisma.rblExpense.update({
            where: { id },
            data: {
                date: body.date ? new Date(body.date) : expense.date,
                itemDescription: body.itemDescription !== undefined ? body.itemDescription.trim() : expense.itemDescription,
                category: body.category !== undefined ? body.category : expense.category,
                quantity: qty,
                unit: body.unit !== undefined ? body.unit.trim() : expense.unit,
                unitPrice: price,
                amount: totalAmount,
                receiptNo: body.receiptNo !== undefined ? body.receiptNo.trim() : expense.receiptNo,
                notes: body.notes !== undefined ? body.notes.trim() : expense.notes,
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Pengeluaran berhasil diperbarui',
            data: updated
        })

    } catch (error: any) {
        console.error("Mobile Update Expense Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const { id } = await params
    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const expense = await prisma.rblExpense.findUnique({
            where: { id },
            include: { budget: true }
        })

        if (!expense) {
            return NextResponse.json({ error: 'Pengeluaran tidak ditemukan' }, { status: 404 })
        }

        if (!isSuperAdmin && expense.budget.locationId !== user.locationId) {
            return NextResponse.json({ error: 'Forbidden: Akses ditolak' }, { status: 403 })
        }

        if (expense.budget.status === 'CLOSED') {
            return NextResponse.json({
                error: 'Budget sudah ditutup. Tidak dapat menghapus pengeluaran.'
            }, { status: 400 })
        }

        await prisma.rblExpense.delete({ where: { id } })

        return NextResponse.json({
            success: true,
            message: 'Pengeluaran berhasil dihapus'
        })

    } catch (error: any) {
        console.error("Mobile Delete Expense Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
