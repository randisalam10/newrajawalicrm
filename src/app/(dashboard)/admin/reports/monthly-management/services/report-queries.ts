import { prisma } from "@/lib/prisma"

export interface ReportQueryParams {
    monthStart: Date
    monthEnd: Date
    prevMonthStart: Date
    prevMonthEnd: Date
    selectedLocId: string | null
    targetMonthNum: number
    targetYearNum: number
}

export async function fetchMonthlyReportRawData(params: ReportQueryParams) {
    const {
        monthStart,
        monthEnd,
        prevMonthStart,
        prevMonthEnd,
        selectedLocId,
        targetMonthNum,
        targetYearNum
    } = params

    const locationFilter = selectedLocId ? { locationId: selectedLocId } : {}

    // Batch 1: Core Transactions & Revenues
    const [
        allLocations,
        currentTxns,
        prevTxns,
        currentSewaTxns,
        prevSewaTxns,
        currentAggOutgoing,
        prevAggOutgoing
    ] = await Promise.all([
        prisma.location.findMany({ orderBy: { name: "asc" } }),
        prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                date: { gte: monthStart, lte: monthEnd },
                status: "Confirmed",
            },
            include: {
                project: { include: { customer: true, prices: { include: { concreteQuality: true } } } },
                concreteQuality: true,
                vehicle: true,
                driver: true,
                location: true,
            },
            orderBy: { date: "asc" }
        }),
        prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                date: { gte: prevMonthStart, lte: prevMonthEnd },
                status: "Confirmed",
            },
            include: {
                project: { include: { prices: { include: { concreteQuality: true } } } },
            }
        }),
        prisma.sewaTransaction.findMany({
            where: {
                ...locationFilter,
                status: { not: "Cancelled" },
                OR: [
                    { start_date: { lte: monthEnd }, end_date: { gte: monthStart } },
                    { date: { gte: monthStart, lte: monthEnd } }
                ]
            },
            include: {
                equipment: true,
                vehicle: true,
                customer: true,
                operator: true,
                location: true
            },
            orderBy: { start_date: "desc" }
        }),
        prisma.sewaTransaction.findMany({
            where: {
                ...locationFilter,
                status: { not: "Cancelled" },
                OR: [
                    { start_date: { lte: prevMonthEnd }, end_date: { gte: prevMonthStart } },
                    { date: { gte: prevMonthStart, lte: prevMonthEnd } }
                ]
            },
            select: {
                total_price: true,
                dpp_amount: true,
                ppn_amount: true,
                ppn_mode: true,
                ppn_rate: true,
                start_date: true,
                end_date: true,
                total_days: true,
                rental_dates: true
            }
        }),
        prisma.aggregateOutgoing.findMany({
            where: {
                ...locationFilter,
                date: { gte: monthStart, lte: monthEnd },
                category: "PENJUALAN",
            },
            select: {
                id: true,
                date: true,
                aggregate_type: true,
                volume_cubic: true,
                unit_price: true,
                total_price: true,
                recipient: true,
                driver: true,
                vehicle: true
            },
            orderBy: { date: "desc" }
        }),
        prisma.aggregateOutgoing.findMany({
            where: {
                ...locationFilter,
                date: { gte: prevMonthStart, lte: prevMonthEnd },
                category: "PENJUALAN",
            },
            select: { total_price: true }
        })
    ])

    // Batch 2: Materials, BBM, Retase, and Maintenance
    const [
        activePrices,
        currentBbmExpenses,
        prevBbmExpenses,
        mixerRetaseList,
        dtRetaseIncoming,
        dtRetaseOutgoing,
        maintenancePoItems,
        rblMaintenance,
        cementPoItems
    ] = await Promise.all([
        prisma.materialPriceHistory.findMany({
            where: {
                effective_date: { lte: monthEnd },
                ...(selectedLocId ? { OR: [{ locationId: selectedLocId }, { locationId: null }] } : {})
            },
            include: { material: true },
            orderBy: { effective_date: "desc" }
        }),
        prisma.rblExpense.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                OR: [
                    { category: { contains: "bbm", mode: "insensitive" } },
                    { category: { contains: "solar", mode: "insensitive" } },
                    { categoryId: "cat-bbm-solar" }
                ],
                budget: selectedLocId ? { locationId: selectedLocId } : undefined
            },
            include: {
                vehicle: true,
                categoryRef: true,
                budget: { select: { location: { select: { name: true } } } }
            }
        }),
        // BBM Solar bulan sebelumnya (untuk MoM fuel ratio yang akurat)
        prisma.rblExpense.findMany({
            where: {
                date: { gte: prevMonthStart, lte: prevMonthEnd },
                OR: [
                    { category: { contains: "bbm", mode: "insensitive" } },
                    { category: { contains: "solar", mode: "insensitive" } },
                    { categoryId: "cat-bbm-solar" }
                ],
                budget: selectedLocId ? { locationId: selectedLocId } : undefined
            },
            select: { amount: true }
        }),
        prisma.retase.findMany({
            where: {
                transaction: {
                    date: { gte: monthStart, lte: monthEnd },
                    ...locationFilter
                }
            },
            include: {
                driver: true,
                transaction: { select: { id: true, date: true, volume_cubic: true } }
            }
        }),
        prisma.aggregateIncoming.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                ...locationFilter
            },
            select: { retase_amount: true }
        }),
        prisma.aggregateOutgoing.findMany({
            where: {
                ...locationFilter,
                date: { gte: monthStart, lte: monthEnd },
            },
            select: { retase_amount: true }
        }),
        prisma.poItem.findMany({
            where: {
                purchaseOrder: {
                    tanggal_terbit: { gte: monthStart, lte: monthEnd },
                    status: { not: "CANCELLED" },
                    is_for_bp: true,
                    ...(selectedLocId ? { locationId: selectedLocId } : {}),
                    category: {
                        OR: [
                            { kode_kategori: "SPR" },
                            { name: { contains: "SPR", mode: "insensitive" } },
                            { name: { contains: "Sparepart", mode: "insensitive" } },
                            { name: { contains: "Suku Cadang", mode: "insensitive" } },
                        ],
                        NOT: [
                            { kode_kategori: { in: ["SMN", "MAT", "RAW", "AGG", "BBM"] } },
                            { name: { contains: "semen", mode: "insensitive" } },
                            { name: { contains: "cement", mode: "insensitive" } },
                            { name: { contains: "pasir", mode: "insensitive" } },
                            { name: { contains: "split", mode: "insensitive" } },
                            { name: { contains: "solar", mode: "insensitive" } },
                            { name: { contains: "bbm", mode: "insensitive" } },
                        ]
                    }
                },
                masterItem: {
                    NOT: [
                        { name: { contains: "semen", mode: "insensitive" } },
                        { name: { contains: "cement", mode: "insensitive" } },
                        { name: { contains: "pasir", mode: "insensitive" } },
                        { name: { contains: "split", mode: "insensitive" } },
                        { name: { contains: "solar", mode: "insensitive" } },
                        { name: { contains: "bbm", mode: "insensitive" } }
                    ]
                }
            },
            select: {
                id: true,
                subtotal: true,
                quantity: true,
                harga_satuan: true,
                keterangan: true,
                masterItem: { select: { name: true, satuan: true } },
                purchaseOrder: {
                    select: {
                        id: true,
                        po_number: true,
                        tanggal_terbit: true,
                        status: true,
                        location: { select: { name: true } },
                        vehicle: { select: { plate_number: true, code: true } },
                        km_hm_kendaraan: true,
                    }
                }
            },
            orderBy: { purchaseOrder: { tanggal_terbit: "desc" } }
        }),
        prisma.rblExpense.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                OR: [
                    { category: { contains: "sparepart", mode: "insensitive" } },
                    { category: { contains: "pemeliharaan", mode: "insensitive" } },
                    { category: { contains: "servis", mode: "insensitive" } },
                    { categoryId: "cat-pemeliharaan" }
                ],
                budget: selectedLocId ? { locationId: selectedLocId } : undefined
            },
            select: {
                id: true,
                amount: true,
                itemDescription: true,
                notes: true,
                category: true,
                date: true,
                budget: { select: { location: { select: { name: true } } } }
            },
            orderBy: { date: "desc" }
        }),
        prisma.poItem.findMany({
            where: {
                purchaseOrder: {
                    tanggal_terbit: { gte: monthStart, lte: monthEnd },
                    status: { not: "CANCELLED" },
                    is_for_bp: true, // WAJIB: Khusus PO Batching Plant saja
                    ...(selectedLocId ? { locationId: selectedLocId } : {})
                },
                OR: [
                    { purchaseOrder: { category: { kode_kategori: "SMN" } } },
                    { purchaseOrder: { category: { name: { contains: "semen", mode: "insensitive" } } } },
                    { purchaseOrder: { category: { name: { contains: "cement", mode: "insensitive" } } } },
                    { masterItem: { name: { contains: "semen", mode: "insensitive" } } }
                ]
            },
            select: {
                id: true,
                subtotal: true,
                quantity: true,
                harga_satuan: true,
                keterangan: true,
                masterItem: { select: { name: true, satuan: true } },
                purchaseOrder: {
                    select: {
                        id: true,
                        po_number: true,
                        tanggal_terbit: true,
                        status: true,
                        location: { select: { name: true } },
                        companyGroup: { select: { name: true } },
                    }
                }
            },
            orderBy: { purchaseOrder: { tanggal_terbit: "desc" } }
        })
    ])

    // Batch 3: RBL Opex, Fixed Contracts, Vehicles
    const [rblBudgets, rblExpensesAll] = await Promise.all([
        prisma.rblBudget.findMany({
            where: {
                periodMonth: targetMonthNum,
                periodYear: targetYearNum,
                ...(selectedLocId ? { locationId: selectedLocId } : {})
            }
        }),
        prisma.rblExpense.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                budget: selectedLocId ? { locationId: selectedLocId } : undefined
            },
            include: { categoryRef: true, budget: { include: { location: true } } }
        })
    ])

    // Fixed Contracts query
    let activeFixedContracts: any[] = []
    try {
        if ((prisma as any).fixedCostContract?.findMany) {
            activeFixedContracts = await (prisma as any).fixedCostContract.findMany({
                where: {
                    isActive: true,
                    start_date: { lte: monthEnd },
                    end_date: { gte: monthStart },
                    ...(selectedLocId ? {
                        OR: [{ locationId: selectedLocId }, { locationId: null }]
                    } : {})
                },
                include: { location: true },
                orderBy: { monthly_amount: "desc" }
            })
        } else {
            let rows: any[] = []
            if (selectedLocId) {
                rows = await prisma.$queryRawUnsafe(`
                    SELECT f.*, l.name as "location_name"
                    FROM "FixedCostContract" f
                    LEFT JOIN "Location" l ON f."locationId" = l.id
                    WHERE f."isActive" = true
                      AND f."start_date" <= $1
                      AND f."end_date" >= $2
                      AND (f."locationId" = $3 OR f."locationId" IS NULL)
                    ORDER BY f."monthly_amount" DESC
                `, monthEnd, monthStart, selectedLocId)
            } else {
                rows = await prisma.$queryRawUnsafe(`
                    SELECT f.*, l.name as "location_name"
                    FROM "FixedCostContract" f
                    LEFT JOIN "Location" l ON f."locationId" = l.id
                    WHERE f."isActive" = true
                      AND f."start_date" <= $1
                      AND f."end_date" >= $2
                    ORDER BY f."monthly_amount" DESC
                `, monthEnd, monthStart)
            }
            activeFixedContracts = rows.map((r: any) => ({
                ...r,
                location: r.location_name ? { id: r.locationId, name: r.location_name } : null
            }))
        }
    } catch (err) {
        console.warn("Could not query fixedCostContract:", err)
    }

    // Active Vehicles & Compliance Records
    let activeVehicles: any[] = []
    try {
        activeVehicles = await (prisma.vehicle as any).findMany({
            where: locationFilter,
            include: {
                location: true,
                category: true,
                complianceRecords: {
                    where: {
                        valid_from: { lte: monthEnd },
                        valid_until: { gte: monthStart }
                    },
                    orderBy: { valid_until: "desc" }
                }
            }
        })
    } catch {
        const vehicles = await (prisma.vehicle as any).findMany({
            where: locationFilter,
            include: {
                location: true,
                category: true
            }
        })
        try {
            const allRecords: any[] = await prisma.$queryRawUnsafe(`
                SELECT * FROM "VehicleComplianceRecord"
                WHERE "valid_from" <= $1 AND "valid_until" >= $2
                ORDER BY "valid_until" DESC
            `, monthEnd, monthStart)
            activeVehicles = vehicles.map((v: any) => ({
                ...v,
                complianceRecords: allRecords.filter((r: any) => r.vehicleId === v.id)
            }))
        } catch {
            activeVehicles = vehicles.map((v: any) => ({ ...v, complianceRecords: [] }))
        }
    }

    // Batch 4: Macro overview, Invoicing, Billing, and Incomings
    const [
        allMonthTxnsKonsolidasi,
        invoicesIssuedInMonth,
        unbilledTxns,
        activeDeposits,
        paymentsInMonth,
        allUnpaidInvoices,
        cementIncomings,
        aggIncomings,
        poList,
        allSuppliers
    ] = await Promise.all([
        prisma.productionTransaction.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                status: "Confirmed"
            },
            include: {
                project: { include: { prices: { include: { concreteQuality: true } } } },
                location: true
            }
        }),
        prisma.invoice.findMany({
            where: {
                issue_date: { gte: monthStart, lte: monthEnd },
                status: { not: "CANCELLED" },
                ...locationFilter
            },
            include: { customer: true, payments: true }
        }),
        prisma.productionTransaction.findMany({
            where: {
                invoiceItem: null,
                status: "Confirmed",
                ...locationFilter
            },
            include: { 
                project: { include: { prices: { include: { concreteQuality: true } } } },
                concreteQuality: true
            }
        }),
        prisma.deposit.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                ...(selectedLocId ? {
                    project: { customer: { locationId: selectedLocId } }
                } : {})
            },
            include: { project: { include: { customer: true } } }
        }),
        prisma.payment.findMany({
            where: {
                is_cancelled: false,
                payment_date: { gte: monthStart, lte: monthEnd },
                ...(selectedLocId ? {
                    invoice: { locationId: selectedLocId }
                } : {})
            },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoice_number: true,
                        invoice_type: true,
                        total_amount: true,
                        locationId: true,
                        customer: { select: { id: true, customer_name: true } }
                    }
                }
            },
            orderBy: { payment_date: "desc" }
        }),
        prisma.invoice.findMany({
            where: {
                status: { in: ["ISSUED", "PARTIAL"] },
                ...locationFilter
            }
        }),
        prisma.materialIncoming.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                ...locationFilter
            },
            include: { location: true },
            orderBy: { date: "desc" }
        }),
        prisma.aggregateIncoming.findMany({
            where: {
                date: { gte: monthStart, lte: monthEnd },
                ...locationFilter
            },
            select: {
                id: true,
                date: true,
                no_bon: true,
                driver_name: true,
                plate_number: true,
                volume_cubic: true,
                aggregate_type: true,
                source_type: true,
                supplier: true,
                notes: true,
                location: true,
                driver: true,
                vehicle: true,
                unit_price: true,
                total_price: true
            },
            orderBy: { date: "desc" }
        }),
        prisma.purchaseOrder.findMany({
            where: {
                tanggal_terbit: { gte: monthStart, lte: monthEnd },
                status: { not: "CANCELLED" },
                is_for_bp: true,
                ...locationFilter
            },
            include: {
                category: true,
                items: true,
            },
            orderBy: { tanggal_terbit: "desc" }
        }),
        prisma.supplier.findMany({ select: { id: true, name: true } })
    ])

    return {
        allLocations,
        currentTxns,
        prevTxns,
        currentSewaTxns,
        prevSewaTxns,
        currentAggOutgoing,
        prevAggOutgoing,
        activePrices,
        currentBbmExpenses,
        prevBbmExpenses,
        mixerRetaseList,
        dtRetaseIncoming,
        dtRetaseOutgoing,
        maintenancePoItems,
        rblMaintenance,
        cementPoItems,
        rblBudgets,
        rblExpensesAll,
        activeFixedContracts,
        activeVehicles,
        allMonthTxnsKonsolidasi,
        invoicesIssuedInMonth,
        unbilledTxns,
        activeDeposits,
        paymentsInMonth,
        allUnpaidInvoices,
        cementIncomings,
        aggIncomings,
        poList,
        allSuppliers
    }
}
