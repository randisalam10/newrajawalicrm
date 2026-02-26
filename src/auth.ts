import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "./lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string() })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data
                    const user = await prisma.user.findUnique({
                        where: { username },
                        include: { employee: true }
                    })
                    if (!user) return null

                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            username: user.username,
                            role: user.role,
                            employeeId: user.employeeId,
                            locationId: user.employee?.locationId || null
                        }
                    }
                }
                return null
            }
        })
    ]
})
