import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: string
            roleId?: string | null
            roleLabel?: string
            roleScope?: "ALL_BRANCHES" | "OWN_BRANCH"
            permissions?: string[]
            employeeId: string
            locationId: string | null
        }
    }

    interface User {
        id: string
        username: string
        role: string
        roleId?: string | null
        roleLabel?: string
        roleScope?: "ALL_BRANCHES" | "OWN_BRANCH"
        permissions?: string[]
        employeeId: string
        locationId: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: string
        roleId?: string | null
        roleLabel?: string
        roleScope?: "ALL_BRANCHES" | "OWN_BRANCH"
        permissions?: string[]
        employeeId: string
        locationId: string | null
    }
}
