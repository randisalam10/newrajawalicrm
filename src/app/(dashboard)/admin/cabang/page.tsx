import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getLocations } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CabangClient } from "./cabang-client"
import { MapPin, ShieldAlert } from "lucide-react"

export default async function CabangPage() {
    const session = await auth()

    if (session?.user?.role !== "SuperAdminBP") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-rose-500" />
                <h1 className="text-3xl font-bold tracking-tight">Akses Ditolak</h1>
                <p className="text-muted-foreground max-w-md">
                    Halaman ini khusus untuk Super Admin.
                </p>
            </div>
        )
    }

    const locations = await getLocations()

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Master Cabang</h1>
                    <p className="text-muted-foreground">Kelola data lokasi cabang operasional (misal: Youtefa, Koya, Sorong).</p>
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Lokasi Cabang Aktif
                    </CardTitle>
                    <CardDescription>
                        Cabang yang terdaftar di sistem. ID Cabang ini digunakan untuk isolasi data Master Cabang.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <CabangClient initialData={locations} />
                </CardContent>
            </Card>
        </div>
    )
}
