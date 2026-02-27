"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn("credentials", {
            username: formData.get("username") as string,
            password: formData.get("password") as string,
            redirect: false,
        })
        return "success"
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials."
                default:
                    return "Something went wrong."
            }
        }
        throw error
    }
}
