import { TablePageSkeleton } from "@/components/ui/page-skeleton"

export default function BillingLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <div className="h-8 w-52 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
            </div>
            <TablePageSkeleton />
        </div>
    )
}
