import { Skeleton } from "@/components/ui/skeleton"

export default function FixedCostsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-72" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-9 w-40" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-8 w-36" />
                        <Skeleton className="h-3 w-44" />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
}
