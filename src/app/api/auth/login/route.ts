import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { username, password } = body

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
        }

        // Cari user beserta data employee dan location
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                employee: {
                    include: {
                        location: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Cek password
        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Buat JWT payload (mirip dengan isi token NextAuth)
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            employeeId: user.employeeId,
            locationId: user.employee?.locationId || null
        }

        // Generate token (berlaku 30 hari untuk mobile app biar tidak sering login)
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                employeeName: user.employee?.name,
                position: user.employee?.position,
                location: user.employee?.location?.name || 'Pusat'
            }
        })

    } catch (error: any) {
        console.error("Mobile Login Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
