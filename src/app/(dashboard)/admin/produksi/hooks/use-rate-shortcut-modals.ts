"use client"

import { useState } from "react"
import { upsertMasterIncentive } from "../../master-insentif/actions"
import { IncentiveRateItem, RateFormState } from "../types"

interface UseRateShortcutModalsProps {
    canManageRate: boolean
    activeLocId: string | null
    activeOpRateItem: IncentiveRateItem | undefined
    activeOpRate: number
    activeMixerRateItem: IncentiveRateItem | undefined
    activeMixerRate: number
    setLocalIncentives: React.Dispatch<React.SetStateAction<IncentiveRateItem[]>>
}

export function useRateShortcutModals({
    canManageRate,
    activeLocId,
    activeOpRateItem,
    activeOpRate,
    activeMixerRateItem,
    activeMixerRate,
    setLocalIncentives,
}: UseRateShortcutModalsProps) {
    // --- 1. SHORTCUT KHUSUS OPERATOR BP ---
    const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false)
    const [operatorForm, setOperatorForm] = useState<RateFormState>({
        id: "",
        nama_insentif: "Insentif Operator Batching Plant (Per Kubik)",
        tarif_utama: "1500",
        effective_date: new Date().toISOString().slice(0, 10),
        keterangan: "",
    })
    const [isSavingOperator, setIsSavingOperator] = useState(false)

    const handleOpenOperatorShortcut = () => {
        setOperatorForm({
            id: activeOpRateItem?.id || "",
            nama_insentif: activeOpRateItem?.nama_insentif || "Insentif Operator Batching Plant (Per Kubik)",
            tarif_utama: String(activeOpRate),
            effective_date: new Date().toISOString().slice(0, 10),
            keterangan: activeOpRateItem?.keterangan || "",
        })
        setIsOperatorModalOpen(true)
    }

    const handleSaveOperatorRate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManageRate) return

        setIsSavingOperator(true)
        const res = await upsertMasterIncentive({
            id: operatorForm.id || undefined,
            nama_insentif: operatorForm.nama_insentif,
            kategori_peran: "OPERATOR_BP",
            formula_type: "PER_M3",
            tarif_utama: Number(operatorForm.tarif_utama) || 0,
            tarif_sekunder: 0,
            locationId: activeLocId || null,
            effective_date: operatorForm.effective_date,
            keterangan: operatorForm.keterangan,
            isActive: true,
        })
        setIsSavingOperator(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert(
                "Tarif Operator BP berhasil disimpan dan berlaku mulai " +
                operatorForm.effective_date +
                ". (Tarif sopir mixer tetap aman & tidak berubah)"
            )
            if (res.data) {
                setLocalIncentives(prev => [res.data, ...(prev || []).filter(r => r.id !== res.data.id)])
            }
            setIsOperatorModalOpen(false)
        }
    }

    // --- 2. SHORTCUT KHUSUS SOPIR TRUK MIXER ---
    const [isMixerModalOpen, setIsMixerModalOpen] = useState(false)
    const [mixerForm, setMixerForm] = useState<RateFormState>({
        id: "",
        nama_insentif: "Retase Sopir Truk Mixer (Jarak Tempuh)",
        tarif_utama: "10000",
        effective_date: new Date().toISOString().slice(0, 10),
        keterangan: "",
    })
    const [isSavingMixer, setIsSavingMixer] = useState(false)

    const handleOpenMixerShortcut = () => {
        setMixerForm({
            id: activeMixerRateItem?.id || "",
            nama_insentif: activeMixerRateItem?.nama_insentif || "Retase Sopir Truk Mixer (Jarak Tempuh)",
            tarif_utama: String(activeMixerRate),
            effective_date: new Date().toISOString().slice(0, 10),
            keterangan: activeMixerRateItem?.keterangan || "",
        })
        setIsMixerModalOpen(true)
    }

    const handleSaveMixerRate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManageRate) return

        setIsSavingMixer(true)
        const res = await upsertMasterIncentive({
            id: mixerForm.id || undefined,
            nama_insentif: mixerForm.nama_insentif,
            kategori_peran: "SOPIR_MIXER",
            formula_type: "PER_KM",
            tarif_utama: Number(mixerForm.tarif_utama) || 0,
            tarif_sekunder: 0,
            locationId: activeLocId || null,
            effective_date: mixerForm.effective_date,
            keterangan: mixerForm.keterangan,
            isActive: true,
        })
        setIsSavingMixer(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert(
                "Tarif Retase Sopir Mixer berhasil disimpan dan berlaku mulai " +
                mixerForm.effective_date +
                ". (Tarif operator BP tetap aman & tidak berubah)"
            )
            if (res.data) {
                setLocalIncentives(prev => [res.data, ...(prev || []).filter(r => r.id !== res.data.id)])
            }
            setIsMixerModalOpen(false)
        }
    }

    return {
        isOperatorModalOpen,
        setIsOperatorModalOpen,
        operatorForm,
        setOperatorForm,
        isSavingOperator,
        handleOpenOperatorShortcut,
        handleSaveOperatorRate,
        isMixerModalOpen,
        setIsMixerModalOpen,
        mixerForm,
        setMixerForm,
        isSavingMixer,
        handleOpenMixerShortcut,
        handleSaveMixerRate,
    }
}
