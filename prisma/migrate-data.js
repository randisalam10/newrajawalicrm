const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function main() {
    console.log('Starting data migration to new schema...')

    try {
        // 1. Ambil data customer lama (yang masih ada project_name dkk)
        const customers = await prisma.customer.findMany({
            include: { transactions: true }
        })

        console.log(`Found ${customers.length} customers to migrate.`)

        let projectsCreated = 0
        let txUpdated = 0

        for (const customer of customers) {
            // Karena sebelumnya 1 customer = 1 project, kita jadikan ini project pertama mereka
            // Kita juga tidak ingin membuat duplikat project jika script ini dijalankan ulang

            const existingProject = await prisma.project.findFirst({
                where: {
                    customerId: customer.id,
                    name: customer.project_name || 'Proyek Default'
                }
            })

            let projectId = existingProject?.id

            if (!existingProject) {
                const newProject = await prisma.project.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: customer.project_name || 'Proyek Default',
                        address: customer.address || '-',
                        default_distance: customer.default_distance || 0,
                        tax_ppn: customer.tax_ppn || 0,
                        customerId: customer.id
                    }
                })
                projectId = newProject.id
                projectsCreated++
                console.log(`Created project '${newProject.name}' for customer '${customer.customer_name}'`)
            }

            // 2. Tautkan semua transaksi lama ke project baru ini
            if (customer.transactions && customer.transactions.length > 0) {
                const updateResult = await prisma.productionTransaction.updateMany({
                    where: { customerId: customer.id, projectId: null },
                    data: { projectId: projectId }
                })
                txUpdated += updateResult.count
                if (updateResult.count > 0) {
                    console.log(`Linked ${updateResult.count} transactions to project ${projectId}`)
                }
            }
        }

        console.log('--- Migration Summary ---')
        console.log(`Projects Created: ${projectsCreated}`)
        console.log(`Transactions Linked: ${txUpdated}`)
        console.log('Migration completed successfully.')

    } catch (error) {
        console.error('Error migrating data:', error);
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
