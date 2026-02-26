import { PrismaClient, VehicleType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding dummy data...')

    // We need to fetch an existing location to tie the data to.
    const location = await prisma.location.findFirst()

    if (!location) {
        console.error('Error: Could not find any Location (Cabang) in the database. Please ensure you have created at least one Master Cabang.')
        return
    }

    const locationId = location.id

    // --- 1. DUMMY CUSTOMERS (10) ---
    console.log('Creating 10 Dummy Customers...')
    const customers = [
        { customer_name: 'PT Pembangunan Perumahan', project_name: 'Stadion Utama Papua', default_distance: 12.5, tax_ppn: 11, address: 'Jl. Pemuda No. 12', locationId },
        { customer_name: 'CV Makmur Jaya', project_name: 'Ruko Abepura Baru', default_distance: 5.2, tax_ppn: 11, address: 'Komp. Ruko Baru', locationId },
        { customer_name: 'PT Waskita Karya', project_name: 'Jembatan Youtefa Flyover', default_distance: 8.7, tax_ppn: 11, address: 'Jl. Jembatan Merah', locationId },
        { customer_name: 'Masyarakat Sipil', project_name: 'Pengecoran Jalan Komplek', default_distance: 3.1, tax_ppn: 0, address: 'Komplek Dosen', locationId },
        { customer_name: 'PT Nindya Karya', project_name: 'Gedung Rektorat Uncen', default_distance: 7.4, tax_ppn: 11, address: 'Kampus Uncen Baru', locationId },
        { customer_name: 'CV Bangun Sentosa', project_name: 'Pondasi Gudang Logistik', default_distance: 15.0, tax_ppn: 11, address: 'Kawasan Industri', locationId },
        { customer_name: 'PT Adhi Karya', project_name: 'Kantor Gubernur', default_distance: 10.2, tax_ppn: 11, address: 'Jl. S.O.A.S.I.U', locationId },
        { customer_name: 'Toko Bangunan Anugrah', project_name: 'Pengecoran Ruko 3 Lantai', default_distance: 4.8, tax_ppn: 0, address: 'Pasar Lama', locationId },
        { customer_name: 'PT Wijaya Karya', project_name: 'Bendungan Koya Timur', default_distance: 22.4, tax_ppn: 11, address: 'Koya Timur Block A', locationId },
        { customer_name: 'Dinas PU Kota', project_name: 'Rehabilitasi Saluran Air', default_distance: 6.5, tax_ppn: 11, address: 'Pusat Kota', locationId },
    ]
    await prisma.customer.createMany({ data: customers, skipDuplicates: true })

    // --- 2. DUMMY KENDARAAN / VEHICLES (10) ---
    console.log('Creating 10 Dummy Kendaraan...')
    const vehicles = [
        { plate_number: 'PA 8001 TM', vehicle_type: VehicleType.Mixer, code: 'TM-01', locationId },
        { plate_number: 'PA 8002 TM', vehicle_type: VehicleType.Mixer, code: 'TM-02', locationId },
        { plate_number: 'PA 8003 TM', vehicle_type: VehicleType.Mixer, code: 'TM-03', locationId },
        { plate_number: 'PA 8004 TM', vehicle_type: VehicleType.Mixer, code: 'TM-04', locationId },
        { plate_number: 'PA 8005 TM', vehicle_type: VehicleType.Mixer, code: 'TM-05', locationId },
        { plate_number: 'PA 8006 TM', vehicle_type: VehicleType.Mixer, code: 'TM-06', locationId },
        { plate_number: 'PA 8007 TM', vehicle_type: VehicleType.Mixer, code: 'TM-07', locationId },
        { plate_number: 'PA 8008 TM', vehicle_type: VehicleType.Mixer, code: 'TM-08', locationId },
        { plate_number: 'PA 9001 WL', vehicle_type: VehicleType.Loader, code: 'WL-01', locationId },
        { plate_number: 'PA 9002 WL', vehicle_type: VehicleType.Loader, code: 'WL-02', locationId },
    ]
    await prisma.vehicle.createMany({ data: vehicles, skipDuplicates: true })

    // --- 3. DUMMY MUTU BETON / CONCRETE QUALITY (3) ---
    console.log('Creating 3 Dummy Mutu Beton...')
    const mutus = [
        { name: 'K-225', composition_sand: 850, composition_stone_05: 450, composition_stone_12: 400, composition_stone_23: 200, composition_cement: 350, locationId },
        { name: 'K-250', composition_sand: 800, composition_stone_05: 480, composition_stone_12: 420, composition_stone_23: 180, composition_cement: 380, locationId },
        { name: 'K-300', composition_sand: 750, composition_stone_05: 500, composition_stone_12: 450, composition_stone_23: 150, composition_cement: 420, locationId },
    ]
    await prisma.concreteQuality.createMany({ data: mutus, skipDuplicates: true })

    // --- 4. DUMMY ITEM PEKERJAAN / WORK ITEMS (3) ---
    console.log('Creating 3 Dummy Item Pekerjaan...')
    const workItems = [
        { name: 'Pengecoran Balok & Kolom', locationId },
        { name: 'Pengecoran Plat Lantai', locationId },
        { name: 'Pengecoran Jalan (Rigid)', locationId },
    ]
    await prisma.workItem.createMany({ data: workItems, skipDuplicates: true })

    console.log('Seeding completed successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
