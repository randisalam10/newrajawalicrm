"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CrusherDailyReportData, CrusherMaterialSourceItem, VehicleOption, EmployeeOption } from "../../types"
import { FEED_LABEL, useMaterialIn, type FeedType } from "../material-in/use-material-in"
import { MaterialInForm } from "../material-in/material-in-form"
import { MaterialInList } from "../material-in/material-in-list"
import { QuickAddDriverDialog, QuickAddVehicleDialog } from "../material-in/quick-add-dialogs"

type Props = {
    report: CrusherDailyReportData | null
    selectedDate?: string
    locationId?: string
    sources: CrusherMaterialSourceItem[]
    vehicles: VehicleOption[]
    employees?: EmployeeOption[]
    canViewWages?: boolean
    onRefresh: () => void
}

const FEED_TYPES: FeedType[] = ["QUARRY_RAW", "COLD_BIN"]

export function TabMaterialIn({
    report,
    selectedDate,
    locationId,
    sources,
    vehicles,
    employees = [],
    canViewWages = false,
    onRefresh,
}: Props) {
    const ctl = useMaterialIn({ report, sources, vehicles, employees, selectedDate, locationId, onRefresh })
    const [vehicleOpen, setVehicleOpen] = useState(false)
    const [driverDialog, setDriverDialog] = useState<{ open: boolean; name: string }>({ open: false, name: "" })

    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
            <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">D & E. Material Masuk</h2>
                <span className="text-xs text-slate-500">
                    Total <b className="text-emerald-700 text-sm">{ctl.totals.QUARRY_RAW + ctl.totals.COLD_BIN} Ret</b>
                </span>
            </header>

            <div className="p-3 sm:p-4 space-y-3">
                {/* Pilihan kategori D / E */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {FEED_TYPES.map((type) => {
                        const active = ctl.feedType === type
                        return (
                            <button
                                key={type}
                                id={`mi-tab-${type.toLowerCase()}`}
                                type="button"
                                onClick={() => ctl.setFeedType(type)}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors",
                                    active ? "bg-white dark:bg-slate-900 text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900",
                                )}
                            >
                                <span className="leading-tight text-center">{FEED_LABEL[type].code}. {FEED_LABEL[type].title}</span>
                                <span className={cn(
                                    "shrink-0 px-1.5 rounded-full text-[10px] font-bold",
                                    active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600",
                                )}>
                                    {ctl.totals[type]}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <MaterialInForm
                    ctl={ctl}
                    sources={sources}
                    canViewWages={canViewWages}
                    onAddTruck={() => setVehicleOpen(true)}
                    onAddDriver={(name) => setDriverDialog({ open: true, name })}
                />

                <MaterialInList ctl={ctl} canViewWages={canViewWages} />
            </div>

            <QuickAddDriverDialog
                open={driverDialog.open}
                initialName={driverDialog.name}
                locationId={report?.locationId}
                onOpenChange={(open) => setDriverDialog((d) => ({ ...d, open }))}
                onCreated={(name) => { ctl.setDriverName(name); onRefresh() }}
            />
            <QuickAddVehicleDialog
                open={vehicleOpen}
                locationId={report?.locationId}
                onOpenChange={setVehicleOpen}
                onCreated={(plate) => { ctl.setPlateNumber(plate); onRefresh() }}
            />
        </section>
    )
}
