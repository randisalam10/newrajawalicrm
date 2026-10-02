"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    CalendarClock,
    Plus,
    LayoutList,
    LayoutGrid,
} from "lucide-react"

// Types & Helpers
import { PlanningClientProps } from "./types"
import { formatDateLabel } from "./constants"

// Hooks
import { usePlanning } from "./hooks/use-planning"

// Subcomponents
import { PlanStats } from "./components/plan-stats"
import { PlanCard } from "./components/plan-card"
import { CalendarView } from "./components/calendar-view"
import { PlanningFilterBar } from "./components/planning-filter-bar"
import { PlanFormDialog } from "./components/plan-form-dialog"
import { DeletePlanDialog } from "./components/delete-plan-dialog"

export function PlanningClient({
    plans: initialPlans,
    masters,
    canManage = true,
}: PlanningClientProps) {
    const {
        plans,
        viewMode,
        setViewMode,
        showForm,
        setShowForm,
        editTarget,
        deleteTarget,
        setDeleteTarget,
        isDeleting,
        defaultFormDate,
        filterStatus,
        setFilterStatus,
        filterDateFrom,
        setFilterDateFrom,
        filterDateTo,
        setFilterDateTo,
        searchText,
        setSearchText,
        filtered,
        grouped,
        openEdit,
        closeForm,
        handleAddForDay,
        handleOpenCreateNew,
        handleStatusChange,
        handleDelete,
        handleResetFilters,
    } = usePlanning({ initialPlans })

    return (
        <div className="space-y-5">
            {/* Stats */}
            <PlanStats plans={plans} />

            {/* Main card */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3 px-5 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-sm font-semibold">
                                {viewMode === "calendar" ? "Kalender Planning" : "Daftar Planning"}
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                                {viewMode === "calendar"
                                    ? "Klik tanggal untuk melihat atau menambah planning"
                                    : `${filtered.length} rencana ditemukan`}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View toggle */}
                            <div className="flex items-center border rounded-lg p-0.5 bg-slate-50 gap-0.5">
                                <Button
                                    variant={viewMode === "calendar" ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 px-2.5 gap-1.5 text-xs"
                                    onClick={() => setViewMode("calendar")}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" /> Kalender
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 px-2.5 gap-1.5 text-xs"
                                    onClick={() => setViewMode("list")}
                                >
                                    <LayoutList className="w-3.5 h-3.5" /> List
                                </Button>
                            </div>
                            {canManage && (
                                <Button
                                    onClick={handleOpenCreateNew}
                                    className="gap-1.5 h-9 text-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {/* List-mode filters */}
                {viewMode === "list" && (
                    <PlanningFilterBar
                        searchText={searchText}
                        setSearchText={setSearchText}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterDateFrom={filterDateFrom}
                        setFilterDateFrom={setFilterDateFrom}
                        filterDateTo={filterDateTo}
                        setFilterDateTo={setFilterDateTo}
                        onReset={handleResetFilters}
                    />
                )}

                <CardContent className={`px-5 pb-5 ${viewMode === "list" ? "pt-0" : "pt-2"}`}>
                    {/* ── CALENDAR VIEW ── */}
                    {viewMode === "calendar" && (
                        <CalendarView
                            plans={plans}
                            onDayClick={handleAddForDay}
                            onEditPlan={openEdit}
                            onDeletePlan={setDeleteTarget}
                            onStatusChange={handleStatusChange}
                            canManage={canManage}
                        />
                    )}

                    {/* ── LIST VIEW ── */}
                    {viewMode === "list" && (
                        grouped.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                                <CalendarClock className="w-10 h-10 opacity-30" />
                                <p className="text-sm">Belum ada planning ditemukan</p>
                                {canManage && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowForm(true)}
                                        className="mt-1 gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Tambah Planning Pertama
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {grouped.map(([dateKey, dayPlans]) => (
                                    <div key={dateKey}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-bold text-slate-700 capitalize">
                                                {formatDateLabel(dateKey)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                                                {dayPlans.length} plan · {dayPlans.reduce((s, p) => s + p.volume_plan, 0).toFixed(1)} m³
                                            </span>
                                            <div className="flex-1 h-px bg-slate-100" />
                                        </div>
                                        <div className="grid gap-2">
                                            {dayPlans.map((plan) => (
                                                <PlanCard
                                                    key={plan.id}
                                                    plan={plan}
                                                    onEdit={openEdit}
                                                    onDelete={setDeleteTarget}
                                                    onStatusChange={handleStatusChange}
                                                    canManage={canManage}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
            {showForm && (
                <PlanFormDialog
                    open={showForm}
                    onClose={closeForm}
                    masters={masters}
                    editData={editTarget}
                    defaultDate={defaultFormDate}
                />
            )}

            {/* Delete Confirm */}
            <DeletePlanDialog
                plan={deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirmDelete={handleDelete}
                isDeleting={isDeleting}
            />
        </div>
    )
}
