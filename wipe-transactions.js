const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('===================================================================')
    console.log(' ⚠️  WARNING: MENGHAPUS SEMUA DATA TRANSAKSI (SANITY WIPE)')
    console.log('===================================================================')
    console.log('Data master (User, Employee, Customer, Vehicle, dll) akan DIPERTAHANKAN.')
    console.log('Data transaksi (Surat Jalan, Tagihan, Pembayaran, dll) akan DIHAPUS.')
    console.log('')

    // Beri waktu 5 detik untuk cancel
    console.log('Menghapus data dalam 5 detik... (Tekan Ctrl+C untuk membatalkan)')
    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('\nMemulai penghapusan data...')

    try {
        // Gunakan transaction untuk memastikan atomik
        await prisma.$transaction(async (tx) => {
            // 1. Hapus Audit & Log history
            console.log('- Menghapus BillingLog...')
            await tx.billingLog.deleteMany()

            console.log('- Menghapus AuditLog...')
            await tx.auditLog.deleteMany()

            // 2. Hapus sistem Tagihan (Invoice, Payment, dll)
            console.log('- Menghapus Payment (Pembayaran)...')
            await tx.payment.deleteMany()

            console.log('- Menghapus InvoiceItem (Detail Tagihan)...')
            await tx.invoiceItem.deleteMany()

            console.log('- Menghapus Invoice (Tagihan Utama)...')
            await tx.invoice.deleteMany()

            console.log('- Menghapus Deposit (Titipan Dana)...')
            await tx.deposit.deleteMany()

            // 3. Hapus Transaksi Operasional Utama & Turunannya
            console.log('- Menghapus Retase (Gaji Supir)...')
            await tx.retase.deleteMany()

            console.log('- Menghapus ProductionTransaction (Surat Jalan / Produksi)...')
            await tx.productionTransaction.deleteMany()

            console.log('- Menghapus MaterialIncoming (Semen/Pasir Masuk)...')
            await tx.materialIncoming.deleteMany()
        })

        console.log('\n✅ BERHASIL! Semua data transaksi telah dihapus.')
        console.log('Sekarang database dalam keadaan bersih (hanya berisi data Master & User).')
    } catch (error) {
        console.error('\n❌ GAGAL menghapus data:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
