import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getEligibleEmployees, getUsers } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, ShieldAlert } from "lucide-react"
import { DataTable } from "./data-table"
import Link from "next/link"

export default async function UsersPage() {
    const session = await auth()

    if (session?.user?.role !== "SuperAdminBP") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-rose-500" />
                <h1 className="text-3xl font-bold tracking-tight">Akses Ditolak</h1>
                <p className="text-muted-foreground max-w-md">
                    Halaman ini khusus untuk Super Admin. Silakan kembali ke Dashboard utama.
                </p>
                <Button asChild>
                    <Link href="/admin">Kembali ke Dashboard</Link>
                </Button>
            </div>
        )
    }

    const [users, eligibleEmployees] = await Promise.all([
        getUsers(),
        getEligibleEmployees()
    ])

    // Map relations for the datatable
    const formattedUsers = users.map((user: any) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.employee.name,
        position: user.employee.position,
        locationId: user.employee.locationId || "N/A",
        locationName: (user.employee as any).location?.name || "N/A",
        join_date: user.employee.join_date.toISOString().split('T')[0],
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
                    <p className="text-muted-foreground">Kelola akun Admin Cabang dan Operator sistem.</p>
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Daftar User Sistem
                    </CardTitle>
                    <CardDescription>
                        Total {formattedUsers.length} user terdaftar (tidak termasuk SuperAdmin).
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable data={formattedUsers} eligibleEmployees={eligibleEmployees} />
                </CardContent>
            </Card>
        </div>
    )
}
