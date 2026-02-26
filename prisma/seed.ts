import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const adminPassword = await bcrypt.hash("admin", 10)
    const operatorPassword = await bcrypt.hash("operator", 10)

    // Clean db
    await prisma.user.deleteMany()
    await prisma.employee.deleteMany()

    // Create Admin Employee
    const adminEmp = await prisma.employee.create({
        data: {
            name: "Super Admin",
            position: "Admin",
            join_date: new Date(),
            status: "Active"
        }
    })

    // Create AdminBP User
    await prisma.user.create({
        data: {
            username: "admin",
            password: adminPassword,
            role: "AdminBP",
            employeeId: adminEmp.id
        }
    })

    // Create Operator Employee
    const operatorEmp = await prisma.employee.create({
        data: {
            name: "Plant Operator",
            position: "Operator",
            join_date: new Date(),
            status: "Active"
        }
    })

    // Create OperatorBP User
    await prisma.user.create({
        data: {
            username: "operator",
            password: operatorPassword,
            role: "OperatorBP",
            employeeId: operatorEmp.id
        }
    })

    console.log("Seed data successfully injected!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
