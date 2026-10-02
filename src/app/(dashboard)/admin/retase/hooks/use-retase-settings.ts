"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { saveMixerRetaseSetting, saveOperatorBPRateSetting } from "../actions"
import { MasterIncentiveItem, RetaseLocation, RetaseSettingItem } from "../types"

interface UseRetaseSettingsProps {
    settings: RetaseSettingItem[]
    masterIncentives: MasterIncentiveItem[]
    locations: RetaseLocation[]
}

export function useRetaseSettings({
    settings,
    masterIncentives = [],
    locations,
}: UseRetaseSettingsProps) {
    const { toast } = useToast()

    // Helper untuk mencari tarif peran tertentu berdasarkan cabang atau fallback global
    const resolveRate = (locId: string, role: string, fallback: number) => {
        const branchRate = (masterIncentives || []).find(
            (r: any) => r.kategori_peran === role && r.locationId === locId && r.isActive
        )
        if (branchRate && Number(branchRate.tarif_utama) > 0) return Number(branchRate.tarif_utama)
        const globalRate = (masterIncentives || []).find(
            (r: any) => r.kategori_peran === role && !r.locationId && r.isActive
        )
        if (globalRate && Number(globalRate.tarif_utama) > 0) return Number(globalRate.tarif_utama)
        return fallback
    }

    // Setting State Mixer & Operator BP
    const initialLoc = locations[0]?.id || ""
    const initialSetting = settings.find((s: any) => s.locationId === initialLoc)
    const [settingLocation, setSettingLocation] = useState(initialLoc)

    const initialMixerPrice =
        initialSetting?.price_per_cubic_km != null && Number(initialSetting.price_per_cubic_km) > 0
            ? String(initialSetting.price_per_cubic_km)
            : String(resolveRate(initialLoc, "SOPIR_MIXER", 0))

    const initialOpRate =
        initialSetting?.operator_rate_per_cubic != null && Number(initialSetting.operator_rate_per_cubic) > 0
            ? String(initialSetting.operator_rate_per_cubic)
            : String(resolveRate(initialLoc, "OPERATOR_BP", 0))

    // 1. Mixer Retase State
    const [mixerPrice, setMixerPrice] = useState(initialMixerPrice)
    const [mixerCalcMode, setMixerCalcMode] = useState<"DISTANCE_ONLY" | "DISTANCE_AND_VOLUME">(
        initialSetting?.calculation_mode || "DISTANCE_ONLY"
    )
    const [mixerApplyScope, setMixerApplyScope] = useState<"FUTURE" | "BACKDATE">("FUTURE")
    const [mixerEffectiveDate, setMixerEffectiveDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
    const [isSavingMixer, setIsSavingMixer] = useState(false)
    const [showMixerBackdateAlert, setShowMixerBackdateAlert] = useState(false)

    // 2. Operator BP State
    const [operatorRate, setOperatorRate] = useState(initialOpRate)
    const [operatorApplyScope, setOperatorApplyScope] = useState<"FUTURE" | "BACKDATE">("FUTURE")
    const [operatorEffectiveDate, setOperatorEffectiveDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
    const [isSavingOperator, setIsSavingOperator] = useState(false)
    const [showOperatorBackdateAlert, setShowOperatorBackdateAlert] = useState(false)

    // Prefill setting form when location changes if setting exists, with fallback to Master Data
    const onLocationChange = (val: string) => {
        setSettingLocation(val)
        const existing = settings.find((s: any) => s.locationId === val)
        const mixerRate = resolveRate(val, "SOPIR_MIXER", 0)
        const opRate = resolveRate(val, "OPERATOR_BP", 0)

        if (existing && Number(existing.price_per_cubic_km) > 0) {
            setMixerPrice(String(existing.price_per_cubic_km))
            setMixerCalcMode(existing.calculation_mode || "DISTANCE_ONLY")
        } else {
            setMixerPrice(String(mixerRate))
            setMixerCalcMode("DISTANCE_ONLY")
        }

        if (existing && Number(existing.operator_rate_per_cubic) > 0) {
            setOperatorRate(String(existing.operator_rate_per_cubic))
        } else {
            setOperatorRate(String(opRate))
        }
    }

    // --- MIXER HANDLERS ---
    const executeSaveMixer = async () => {
        setIsSavingMixer(true)
        const formData = new FormData()
        formData.append("locationId", settingLocation)
        formData.append("price_per_cubic_km", mixerPrice)
        formData.append("calculation_mode", mixerCalcMode)
        formData.append("apply_mode", mixerApplyScope)
        if (mixerApplyScope === "BACKDATE") {
            formData.append("effective_date", mixerEffectiveDate)
        }

        const res = await saveMixerRetaseSetting(formData)
        setIsSavingMixer(false)
        setShowMixerBackdateAlert(false)

        if (res.error) {
            toast({ title: "Gagal Menyimpan Tarif Mixer", description: res.error, variant: "destructive" })
        } else {
            toast({
                title: "Tarif Sopir Mixer Tersimpan",
                description: res.message || "Harga & Rumus Retase Sopir Mixer berhasil diperbarui.",
            })
        }
    }

    const handleSaveMixer = (e: React.FormEvent) => {
        e.preventDefault()
        if (!mixerPrice || Number(mixerPrice) < 0) {
            return toast({
                title: "Harga tidak valid",
                description: "Masukkan nilai harga dasar yang valid",
                variant: "destructive",
            })
        }

        if (mixerApplyScope === "BACKDATE") {
            if (!mixerEffectiveDate) {
                return toast({
                    title: "Tanggal Wajib Diisi",
                    description: "Pilih tanggal mulai berlaku mundur untuk Sopir Mixer",
                    variant: "destructive",
                })
            }
            setShowMixerBackdateAlert(true)
        } else {
            executeSaveMixer()
        }
    }

    // --- OPERATOR BP HANDLERS ---
    const executeSaveOperator = async () => {
        setIsSavingOperator(true)
        const formData = new FormData()
        formData.append("locationId", settingLocation)
        formData.append("operator_rate_per_cubic", operatorRate || "0")
        formData.append("apply_mode", operatorApplyScope)
        if (operatorApplyScope === "BACKDATE") {
            formData.append("effective_date", operatorEffectiveDate)
        }

        const res = await saveOperatorBPRateSetting(formData)
        setIsSavingOperator(false)
        setShowOperatorBackdateAlert(false)

        if (res.error) {
            toast({ title: "Gagal Menyimpan Insentif Operator", description: res.error, variant: "destructive" })
        } else {
            toast({
                title: "Insentif Operator BP Tersimpan",
                description: res.message || "Tarif insentif Operator BP berhasil diperbarui.",
            })
        }
    }

    const handleSaveOperator = (e: React.FormEvent) => {
        e.preventDefault()
        if (!operatorRate || Number(operatorRate) < 0) {
            return toast({
                title: "Tarif tidak valid",
                description: "Masukkan nilai tarif operator BP yang valid",
                variant: "destructive",
            })
        }

        if (operatorApplyScope === "BACKDATE") {
            if (!operatorEffectiveDate) {
                return toast({
                    title: "Tanggal Wajib Diisi",
                    description: "Pilih tanggal mulai berlaku mundur untuk Operator BP",
                    variant: "destructive",
                })
            }
            setShowOperatorBackdateAlert(true)
        } else {
            executeSaveOperator()
        }
    }

    return {
        resolveRate,
        settingLocation,
        setSettingLocation,
        onLocationChange,
        mixerPrice,
        setMixerPrice,
        mixerCalcMode,
        setMixerCalcMode,
        mixerApplyScope,
        setMixerApplyScope,
        mixerEffectiveDate,
        setMixerEffectiveDate,
        isSavingMixer,
        showMixerBackdateAlert,
        setShowMixerBackdateAlert,
        executeSaveMixer,
        handleSaveMixer,
        operatorRate,
        setOperatorRate,
        operatorApplyScope,
        setOperatorApplyScope,
        operatorEffectiveDate,
        setOperatorEffectiveDate,
        isSavingOperator,
        showOperatorBackdateAlert,
        setShowOperatorBackdateAlert,
        executeSaveOperator,
        handleSaveOperator,
    }
}
