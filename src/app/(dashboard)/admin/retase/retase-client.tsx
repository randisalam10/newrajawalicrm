"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Printer, Calculator, Settings, Building2 } from "lucide-react"
import { RetaseLaporanClient } from "./retase-laporan-client"
import { useRetaseSettings } from "./hooks/use-retase-settings"
import { useRetaseTransactions } from "./hooks/use-retase-transactions"
import { RetasePendingTab } from "./components/retase-pending-tab"
import { RetaseConfirmedTab } from "./components/retase-confirmed-tab"
import { RetaseSettingsTab } from "./components/retase-settings-tab"
import { RetaseKopTab } from "./components/retase-kop-tab"
import { RetaseDialogs } from "./components/retase-dialogs"
import { RetaseEditModal } from "./components/retase-edit-modal"
import { RetaseClientProps } from "./types"

export function RetaseClient({
    pendingTransactions,
    confirmedTransactions,
    settings,
    masterIncentives = [],
    locations,
    userRole,
    customers,
    productionMasters,
    canConfirm = true,
    canEdit = true,
    canDelete = true,
    canManageSettings = true,
}: RetaseClientProps) {
    const isCorporate = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)

    // Settings Hook
    const st = useRetaseSettings({
        settings,
        masterIncentives,
        locations,
    })

    // Transactions Hook
    const tx = useRetaseTransactions({
        pendingTransactions,
        confirmedTransactions,
    })

    return (
        <div className="space-y-6">
            <Tabs defaultValue="pending">
                <TabsList
                    className={`grid w-full ${canManageSettings ? "grid-cols-5 max-w-4xl" : "grid-cols-3 max-w-2xl"
                        } mb-6`}
                >
                    <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Surat Jalan Masuk ({pendingTransactions.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="confirmed" className="flex items-center gap-1.5 text-xs">
                        <Printer className="w-3.5 h-3.5" />
                        <span>Surat Jalan Terkonfirmasi</span>
                    </TabsTrigger>
                    <TabsTrigger value="laporan" className="flex items-center gap-1.5 text-xs">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Laporan Mixer</span>
                    </TabsTrigger>
                    {canManageSettings && (
                        <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
                            <Settings className="w-3.5 h-3.5" />
                            <span>Pengaturan Tarif</span>
                        </TabsTrigger>
                    )}
                    {canManageSettings && (
                        <TabsTrigger value="kop" className="flex items-center gap-1.5 text-xs">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Kop Surat & Logo</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* ── TAB 1: RETASE MIXER (PENDING) ── */}
                <TabsContent value="pending" className="space-y-4">
                    <RetasePendingTab
                        pendingTransactions={pendingTransactions}
                        isCorporate={isCorporate}
                        canConfirm={canConfirm}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onOpenConfirm={tx.handleOpenConfirm}
                        onOpenEdit={tx.handleOpenEdit}
                        onDeleteRequest={(id) => tx.setDeleteId(id)}
                    />
                </TabsContent>

                {/* ── TAB 2: SURAT JALAN MIXER (CONFIRMED) ── */}
                <TabsContent value="confirmed" className="space-y-4">
                    <RetaseConfirmedTab
                        filteredConfirmed={tx.filteredConfirmed}
                        isCorporate={isCorporate}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        locations={locations}
                        filterCabang={tx.filterCabang}
                        onFilterCabangChange={tx.setFilterCabang}
                        filterCustomer={tx.filterCustomer}
                        onFilterCustomerChange={tx.setFilterCustomer}
                        customerPopoverOpen={tx.customerPopoverOpen}
                        onCustomerPopoverOpenChange={tx.setCustomerPopoverOpen}
                        uniqueCustomers={tx.uniqueCustomers}
                        onResetFilters={() => {
                            tx.setFilterCabang("all")
                            tx.setFilterCustomer("all")
                        }}
                        onOpenEdit={tx.handleOpenEdit}
                        onDeleteRequest={(id) => tx.setDeleteId(id)}
                    />
                </TabsContent>

                {/* ── TAB 3: LAPORAN MIXER ── */}
                <TabsContent value="laporan">
                    <Card>
                        <CardContent className="p-0">
                            <RetaseLaporanClient
                                locations={locations}
                                customers={customers}
                                userRole={userRole}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB 4: PENGATURAN TARIF ── */}
                {canManageSettings && (
                    <TabsContent value="settings" className="space-y-4">
                        <RetaseSettingsTab
                            userRole={userRole}
                            locations={locations}
                            settingLocation={st.settingLocation}
                            onLocationChange={st.onLocationChange}
                            resolveRate={st.resolveRate}
                            mixerPrice={st.mixerPrice}
                            onMixerPriceChange={st.setMixerPrice}
                            mixerCalcMode={st.mixerCalcMode}
                            onMixerCalcModeChange={st.setMixerCalcMode}
                            mixerApplyScope={st.mixerApplyScope}
                            onMixerApplyScopeChange={st.setMixerApplyScope}
                            mixerEffectiveDate={st.mixerEffectiveDate}
                            onMixerEffectiveDateChange={st.setMixerEffectiveDate}
                            isSavingMixer={st.isSavingMixer}
                            onSaveMixer={st.handleSaveMixer}
                            operatorRate={st.operatorRate}
                            onOperatorRateChange={st.setOperatorRate}
                            operatorApplyScope={st.operatorApplyScope}
                            onOperatorApplyScopeChange={st.setOperatorApplyScope}
                            operatorEffectiveDate={st.operatorEffectiveDate}
                            onOperatorEffectiveDateChange={st.setOperatorEffectiveDate}
                            isSavingOperator={st.isSavingOperator}
                            onSaveOperator={st.handleSaveOperator}
                        />
                    </TabsContent>
                )}

                {/* ── TAB 5: PENGATURAN KOP SURAT & LOGO ── */}
                {canManageSettings && (
                    <TabsContent value="kop" className="space-y-4">
                        <RetaseKopTab
                            userRole={userRole}
                            locations={locations}
                        />
                    </TabsContent>
                )}
            </Tabs>

            {/* Modal Dialogs (Confirmation, Deletion, Backdate Alerts) */}
            <RetaseDialogs
                isConfirming={tx.isConfirming}
                onCloseConfirm={() => {
                    tx.setIsConfirming(null)
                    tx.setDistanceInput("")
                }}
                pendingTransactions={pendingTransactions}
                settings={settings}
                distanceInput={tx.distanceInput}
                onDistanceInputChange={tx.setDistanceInput}
                isLoading={tx.isLoading}
                onConfirm={tx.handleConfirm}
                deleteId={tx.deleteId}
                onCloseDelete={() => tx.setDeleteId(null)}
                onDelete={tx.handleDelete}
                showMixerBackdateAlert={st.showMixerBackdateAlert}
                onCloseMixerBackdateAlert={() => st.setShowMixerBackdateAlert(false)}
                mixerPrice={st.mixerPrice}
                mixerCalcMode={st.mixerCalcMode}
                mixerEffectiveDate={st.mixerEffectiveDate}
                isSavingMixer={st.isSavingMixer}
                onExecuteSaveMixer={st.executeSaveMixer}
                showOperatorBackdateAlert={st.showOperatorBackdateAlert}
                onCloseOperatorBackdateAlert={() => st.setShowOperatorBackdateAlert(false)}
                operatorRate={st.operatorRate}
                operatorEffectiveDate={st.operatorEffectiveDate}
                isSavingOperator={st.isSavingOperator}
                onExecuteSaveOperator={st.executeSaveOperator}
            />

            {/* Modal Edit Transaksi Produksi / Tiket Cor */}
            <RetaseEditModal
                isOpen={!!tx.editingTx}
                onClose={tx.handleCloseEdit}
                transaction={tx.editingTx}
                productionMasters={productionMasters}
            />
        </div>
    )
}
