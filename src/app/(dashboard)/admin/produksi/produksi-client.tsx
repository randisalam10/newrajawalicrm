"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

import { ProduksiClientProps } from "./types"
import { useProduksiForm } from "./hooks/use-produksi-form"
import { ProduksiHeader } from "./components/produksi-header"
import { LocationSection } from "./components/sections/location-section"
import { CustomerProjectSection } from "./components/sections/customer-project-section"
import { FleetDriverSection } from "./components/sections/fleet-driver-section"
import { ConcreteSpecSection } from "./components/sections/concrete-spec-section"
import { OperatorRateModal } from "./components/modals/operator-rate-modal"
import { MixerRateModal } from "./components/modals/mixer-rate-modal"

export function ProduksiClient({
    masters,
    userRole,
    locations = [],
    canCreate = true,
}: ProduksiClientProps) {
    const form = useProduksiForm({
        masters,
        userRole,
        canCreate,
    })

    return (
        <Card className="h-full">
            <ProduksiHeader canCreate={canCreate} userRole={userRole} />

            <CardContent>
                <form action={form.handleSubmit} className="space-y-6">
                    {/* Native hidden inputs for standard FormData submission */}
                    <input type="hidden" name="projectId" value={form.selectedProjectId} />
                    <input type="hidden" name="vehicleId" value={form.selectedVehicleId} />
                    <input type="hidden" name="driverId" value={form.selectedDriverId} />
                    <input type="hidden" name="qualityId" value={form.selectedQualityId} />
                    <input type="hidden" name="workItemId" value={form.selectedWorkItemId} />

                    {userRole === "SuperAdminBP" && (
                        <LocationSection
                            locations={locations}
                            openLocation={form.openLocation}
                            setOpenLocation={form.setOpenLocation}
                            selectedLocationId={form.selectedLocationId}
                            setSelectedLocationId={form.setSelectedLocationId}
                            resetDependentSelections={form.resetDependentSelections}
                        />
                    )}

                    <CustomerProjectSection
                        canCreate={canCreate}
                        uniqueCustomers={form.uniqueCustomers}
                        customerProjects={form.customerProjects}
                        selectedProject={form.selectedProject}
                        openCustomer={form.openCustomer}
                        setOpenCustomer={form.setOpenCustomer}
                        selectedCustomerId={form.selectedCustomerId}
                        onSelectCustomer={form.handleSelectCustomer}
                        openProject={form.openProject}
                        setOpenProject={form.setOpenProject}
                        selectedProjectId={form.selectedProjectId}
                        setSelectedProjectId={form.setSelectedProjectId}
                    />

                    <FleetDriverSection
                        canCreate={canCreate}
                        activeVehicles={form.activeVehicles}
                        activeDrivers={form.activeDrivers}
                        activeOperators={form.activeOperators}
                        openVehicle={form.openVehicle}
                        setOpenVehicle={form.setOpenVehicle}
                        selectedVehicleId={form.selectedVehicleId}
                        setSelectedVehicleId={form.setSelectedVehicleId}
                        openDriver={form.openDriver}
                        setOpenDriver={form.setOpenDriver}
                        selectedDriverId={form.selectedDriverId}
                        setSelectedDriverId={form.setSelectedDriverId}
                        openOperator={form.openOperator}
                        setOpenOperator={form.setOpenOperator}
                        selectedOperatorId={form.selectedOperatorId}
                        setSelectedOperatorId={form.setSelectedOperatorId}
                        activeMixerRateItem={form.activeMixerRateItem}
                        activeOpRateItem={form.activeOpRateItem}
                        handleOpenMixerShortcut={form.handleOpenMixerShortcut}
                        handleOpenOperatorShortcut={form.handleOpenOperatorShortcut}
                    />

                    <ConcreteSpecSection
                        canCreate={canCreate}
                        activeQualities={form.activeQualities}
                        activeWorkItems={form.activeWorkItems}
                        openQuality={form.openQuality}
                        setOpenQuality={form.setOpenQuality}
                        selectedQualityId={form.selectedQualityId}
                        setSelectedQualityId={form.setSelectedQualityId}
                        openWorkItem={form.openWorkItem}
                        setOpenWorkItem={form.setOpenWorkItem}
                        selectedWorkItemId={form.selectedWorkItemId}
                        setSelectedWorkItemId={form.setSelectedWorkItemId}
                    />

                    {canCreate ? (
                        <Button type="submit" className="w-full h-12 text-md" disabled={form.loading}>
                            {form.loading ? "Memproses..." : "Simpan & Kirim Notifikasi"}
                        </Button>
                    ) : (
                        <div className="p-3.5 bg-slate-100 rounded-xl text-center text-slate-500 text-sm font-medium border border-dashed border-slate-300 flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span>
                                Tombol Simpan Dinonaktifkan (Role <strong>{userRole}</strong> Tidak Memiliki Izin Input Produksi)
                            </span>
                        </div>
                    )}
                </form>
            </CardContent>

            {/* Shortcut Modal 1: Khusus Pengaturan Tarif Operator BP */}
            <OperatorRateModal
                isOpen={form.isOperatorModalOpen}
                onOpenChange={form.setIsOperatorModalOpen}
                operatorForm={form.operatorForm}
                setOperatorForm={form.setOperatorForm}
                isSavingOperator={form.isSavingOperator}
                canManageRate={form.canManageRate}
                onSave={form.handleSaveOperatorRate}
            />

            {/* Shortcut Modal 2: Khusus Pengaturan Tarif Retase Sopir Mixer */}
            <MixerRateModal
                isOpen={form.isMixerModalOpen}
                onOpenChange={form.setIsMixerModalOpen}
                mixerForm={form.mixerForm}
                setMixerForm={form.setMixerForm}
                isSavingMixer={form.isSavingMixer}
                canManageRate={form.canManageRate}
                onSave={form.handleSaveMixerRate}
            />
        </Card>
    )
}
