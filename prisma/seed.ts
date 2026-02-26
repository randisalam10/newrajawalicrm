import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

/**
 * Seed produksi: hanya membuat akun SuperAdmin jika belum ada.
 * Tidak menghapus data yang sudah ada (aman untuk re-run).
 *
 * Password bisa di-override via env var SEED_ADMIN_PASSWORD
 */
async function main() {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@Rajawali2025!"
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Cek apakah superadmin sudah ada
    const existing = await prisma.user.findFirst({
        where: { role: "SuperAdminBP" }
    })

    if (existing) {
        console.log("✓ SuperAdmin sudah ada, skip seed.")
        return
    }

    console.log("Creating SuperAdmin account...")

    // Buat lokasi utama jika belum ada
    const mainLocation = await prisma.location.upsert({
        where: { name: "Pusat (HQ)" },
        update: {},
        create: { name: "Pusat (HQ)" }
    })

    // Buat employee superadmin
    const adminEmp = await prisma.employee.create({
        data: {
            name: "Super Admin",
            position: "Admin",
            join_date: new Date(),
            status: "Active",
            locationId: mainLocation.id
        }
    })

    // Buat user SuperAdminBP
    await prisma.user.create({
        data: {
            username: "admin",
            password: hashedPassword,
            role: "SuperAdminBP",
            employeeId: adminEmp.id
        }
    })

    console.log("✅ SuperAdmin created!")
    console.log("   Username : admin")
    console.log(`   Password : ${adminPassword}`)
    console.log("   ⚠️  Segera ganti password setelah login pertama!")
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
