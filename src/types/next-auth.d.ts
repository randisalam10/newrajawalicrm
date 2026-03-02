import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: "SuperAdminBP" | "AdminBP" | "OperatorBP" | "AdminLogistik"
            employeeId: string
            locationId: string | null
        }
    }

    interface User {
        id: string
        username: string
        role: "SuperAdminBP" | "AdminBP" | "OperatorBP" | "AdminLogistik"
        employeeId: string
        locationId: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: "SuperAdminBP" | "AdminBP" | "OperatorBP" | "AdminLogistik"
        employeeId: string
        locationId: string | null
    }
}
