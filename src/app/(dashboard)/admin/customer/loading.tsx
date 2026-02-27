import { TablePageSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-36 bg-slate-100 animate-pulse rounded" />
                    <div className="h-4 w-64 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="h-9 w-36 bg-slate-100 animate-pulse rounded-md" />
            </div>
            <TablePageSkeleton rows={8} cols={5} />
        </div>
    )
}
