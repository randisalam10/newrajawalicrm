import { getMutu } from "./actions"
import { MutuClient } from "./mutu-client"

export default async function MutuPage() {
    const data = await getMutu()

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Mutu Beton</h1>
                <p className="text-slate-500">Kelola spesifikasi campuran komposisi mutu beton.</p>
            </div>

            <MutuClient initialData={data} />
        </div>
    )
}
