export default function Loading() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-80 bg-slate-100 rounded" />
            <div className="grid grid-cols-4 gap-3 mt-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl" />
                ))}
            </div>
            <div className="h-64 bg-slate-100 rounded-xl mt-4" />
        </div>
    )
}
