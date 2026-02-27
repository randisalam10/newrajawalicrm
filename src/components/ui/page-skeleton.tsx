import { Skeleton } from "@/components/ui/skeleton"

/** Generic header skeleton: title + description */
export function PageHeaderSkeleton() {
    return (
        <div className="space-y-2 mb-6">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-4 w-72 rounded" />
        </div>
    )
}

/** Full-page table loading skeleton */
export function TablePageSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-4">
            <PageHeaderSkeleton />
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-9 w-64 rounded-md" />
                <Skeleton className="h-9 w-32 rounded-md" />
            </div>
            {/* Table */}
            <div className="rounded-md border bg-white overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-4 px-4 py-3 bg-slate-50/80 border-b">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1 rounded" />
                    ))}
                </div>
                {/* Data rows */}
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className={`flex items-center gap-4 px-4 py-3.5 border-b last:border-0 ${r % 2 === 1 ? "bg-slate-50/30" : "bg-white"}`}>
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton key={c} className={`h-4 rounded ${c === 0 ? "w-8" : "flex-1"}`} />
                        ))}
                    </div>
                ))}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </div>
        </div>
    )
}

/** Dashboard-specific skeleton */
export function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-36 rounded" />
                    <Skeleton className="h-4 w-64 rounded" />
                </div>
                <Skeleton className="h-7 w-40 rounded-lg" />
            </div>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl p-4 bg-slate-100 space-y-3 h-[110px]">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-3 w-20 rounded" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded" />
                        <Skeleton className="h-3 w-32 rounded" />
                    </div>
                ))}
            </div>
            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 border rounded-xl bg-white p-4 space-y-3">
                    <Skeleton className="h-5 w-48 rounded" />
                    <Skeleton className="h-[200px] w-full rounded" />
                </div>
                <div className="space-y-4">
                    <div className="border rounded-xl bg-white p-4 space-y-3">
                        <Skeleton className="h-5 w-32 rounded" />
                        <div className="flex gap-3">
                            <Skeleton className="w-[90px] h-[90px] rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3 w-full rounded" />)}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                    </div>
                </div>
            </div>
            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 border rounded-xl bg-white p-4 space-y-2">
                    <Skeleton className="h-5 w-32 rounded" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-1">
                            <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-3 w-full rounded" />
                                <Skeleton className="h-2 w-3/4 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-3 border rounded-xl bg-white p-4 space-y-2">
                    <Skeleton className="h-5 w-40 rounded" />
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                            <Skeleton className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-3 w-2/3 rounded" />
                                <Skeleton className="h-2 w-full rounded" />
                            </div>
                            <Skeleton className="h-6 w-10 rounded flex-shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/** Form-heavy page skeleton (produksi input, etc) */
export function FormPageSkeleton() {
    return (
        <div className="space-y-4">
            <PageHeaderSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Card */}
                <div className="lg:col-span-2 border rounded-xl bg-white p-6 space-y-4">
                    <Skeleton className="h-5 w-40 rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <Skeleton className="h-3.5 w-24 rounded" />
                                <Skeleton className="h-9 w-full rounded-md" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-10 w-full rounded-md mt-2" />
                </div>
                {/* Side panel */}
                <div className="border rounded-xl bg-white p-6 space-y-3">
                    <Skeleton className="h-5 w-32 rounded" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="border-b last:border-0 pb-3 last:pb-0 space-y-1">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-28 rounded" />
                                <Skeleton className="h-4 w-16 rounded" />
                            </div>
                            <Skeleton className="h-3 w-40 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/** Tabs-based page skeleton (retase, etc) */
export function TabsPageSkeleton({ tabs = 3 }: { tabs?: number }) {
    return (
        <div className="space-y-4">
            <PageHeaderSkeleton />
            {/* Tab triggers */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                {[...Array(tabs)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-36 rounded-md" />
                ))}
            </div>
            {/* Table area */}
            <TablePageSkeleton rows={7} cols={6} />
        </div>
    )
}

/** Reports page skeleton with filters + charts */
export function ReportPageSkeleton() {
    return (
        <div className="space-y-4">
            <PageHeaderSkeleton />
            {/* Filters bar */}
            <div className="border rounded-xl bg-white p-4 flex flex-wrap gap-3">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-36 rounded-md" />
                ))}
                <Skeleton className="h-9 w-24 rounded-md ml-auto" />
            </div>
            {/* Chart */}
            <div className="border rounded-xl bg-white p-6 space-y-3">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-[220px] w-full rounded" />
            </div>
            {/* Cards */}
            <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-xl bg-white p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-40 rounded" />
                            <Skeleton className="h-4 w-24 rounded" />
                        </div>
                        <TablePageSkeleton rows={4} cols={5} />
                    </div>
                ))}
            </div>
        </div>
    )
}
