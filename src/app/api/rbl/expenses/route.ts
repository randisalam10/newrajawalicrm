import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export async function POST(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const body = await req.json()
        const { budgetId, items } = body

        if (!budgetId) {
            return NextResponse.json({ error: 'budgetId wajib diisi' }, { status: 400 })
        }

        const budget = await prisma.rblBudget.findUnique({
            where: { id: budgetId },
            include: { location: true }
        })

        if (!budget) {
            return NextResponse.json({ error: 'Budget RBL tidak ditemukan' }, { status: 404 })
        }

        // Branch isolation check
        if (!isSuperAdmin && budget.locationId !== user.locationId) {
            return NextResponse.json({ error: 'Forbidden: Akses ditolak untuk cabang ini' }, { status: 403 })
        }

        if (budget.status === 'CLOSED') {
            return NextResponse.json({
                error: 'Budget sudah DITUTUP (CLOSED). Tidak dapat menambahkan pengeluaran baru.'
            }, { status: 400 })
        }

        // Handle single item or batch
        let rawItems: any[] = []
        if (Array.isArray(items) && items.length > 0) {
            rawItems = items
        } else if (body.itemDescription) {
            rawItems = [body]
        } else {
            return NextResponse.json({ error: 'Data pengeluaran tidak boleh kosong' }, { status: 400 })
        }

        const validItems = rawItems.filter(it => it.itemDescription && it.itemDescription.trim().length > 0)
        if (validItems.length === 0) {
            return NextResponse.json({ error: 'Nama item / deskripsi pengeluaran wajib diisi' }, { status: 400 })
        }

        const createdExpenses = await prisma.$transaction(
            validItems.map(it => {
                const qty = Number(it.quantity) || 1
                const price = Number(it.unitPrice) || 0
                const totalAmount = it.amount !== undefined && it.amount !== null ? Number(it.amount) : qty * price

                return prisma.rblExpense.create({
                    data: {
                        budgetId,
                        date: it.date ? new Date(it.date) : new Date(),
                        itemDescription: it.itemDescription.trim(),
                        category: it.category || 'Operasional',
                        quantity: qty,
                        unit: it.unit?.trim() || 'Pcs',
                        unitPrice: price,
                        amount: totalAmount,
                        receiptNo: it.receiptNo?.trim() || null,
                        notes: it.notes?.trim() || null,
                        createdById: user.id
                    }
                })
            })
        )

        return NextResponse.json({
            success: true,
            message: `Berhasil mencatat ${createdExpenses.length} pengeluaran`,
            data: createdExpenses
        })

    } catch (error: any) {
        console.error("Mobile Create RBL Expense Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
