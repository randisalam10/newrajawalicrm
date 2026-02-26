import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat } from "lucide-react"

export default function OperatorDashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Operator Dashboard</h1>
                <p className="text-slate-500">Welcome to the Operator Production panel.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Draft Produksi</CardTitle>
                        <HardHat className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Menunggu konfirmasi admin</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
