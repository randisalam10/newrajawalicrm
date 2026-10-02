"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from "@/lib/rate-limiter"

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    const rawUsername = formData.get("username")
    const rawPassword = formData.get("password")

    if (!rawUsername || !rawPassword) {
        return "Username dan password wajib diisi."
    }

    const username = String(rawUsername).trim().toLowerCase()
    const password = String(rawPassword)

    // Length sanity checks to prevent DoS payloads
    if (username.length > 100 || password.length > 256) {
        return "Input tidak valid."
    }

    const clientIp = await getClientIp()
    const ipKey = `login:ip:${clientIp}`
    const userKey = `login:user:${username}`

    // Check rate limit for IP and for user
    const ipLimit = checkRateLimit(ipKey)
    if (!ipLimit.allowed) {
        const minutes = Math.ceil(ipLimit.retryAfterSeconds / 60)
        return `Terlalu banyak percobaan dari perangkat Anda. Silakan coba lagi dalam ${minutes} menit.`
    }

    const userLimit = checkRateLimit(userKey)
    if (!userLimit.allowed) {
        const minutes = Math.ceil(userLimit.retryAfterSeconds / 60)
        return `Akun ini terkunci sementara karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${minutes} menit.`
    }

    try {
        await signIn("credentials", {
            username,
            password,
            redirect: false,
        })

        // Reset rate limit on success
        resetRateLimit(ipKey)
        resetRateLimit(userKey)

        return "success"
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin": {
                    const failIp = recordFailedAttempt(ipKey)
                    const failUser = recordFailedAttempt(userKey)

                    if (failIp.isLocked || failUser.isLocked) {
                        return "Terlalu banyak percobaan gagal. Akses dibatasi selama 15 menit demi keamanan sistem."
                    }

                    const remaining = Math.min(failIp.remainingAttempts, failUser.remainingAttempts)
                    return `Username atau password salah. (Sisa percobaan: ${remaining})`
                }
                default:
                    return "Terjadi kendala pada sistem autentikasi."
            }
        }
        throw error
    }
}

