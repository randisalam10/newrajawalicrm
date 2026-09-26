import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <Skeleton className="h-[550px] w-full rounded-xl" />
                </div>
                <div className="lg:col-span-4">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
