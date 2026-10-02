export interface OperationalTargetSettingData {
    id?: string
    name: string
    target_monthly_volume: number
    target_branch_volume: number
    target_asp: number
    target_semen_cost: number
    target_pasir_cost: number
    target_split_cost: number
    target_solar_cost: number
    target_retase_cost: number
    target_maintenance_cost: number
    target_other_cogs: number
    target_cogs: number
    target_gross_profit: number
    label_asp?: string | null
    label_semen?: string | null
    label_pasir?: string | null
    label_split?: string | null
    label_solar?: string | null
    label_retase?: string | null
    label_maintenance?: string | null
    label_other?: string | null
    label_cogs?: string | null
    label_gross_profit?: string | null
    locationId?: string | null
    updatedAt?: Date | string
}

export const DEFAULT_OPERATIONAL_TARGETS: OperationalTargetSettingData = {
    name: "Standar Target Operasional",
    target_monthly_volume: 5000,
    target_branch_volume: 2000,
    target_asp: 835000,
    target_semen_cost: 300000,
    target_pasir_cost: 95000,
    target_split_cost: 75000,
    target_solar_cost: 60000,
    target_retase_cost: 70000,
    target_maintenance_cost: 30000,
    target_other_cogs: 0,
    target_cogs: 640000,
    target_gross_profit: 195000,
    label_asp: "Harga Jual Pasar",
    label_semen: "Standar SNI",
    label_pasir: "On Target",
    label_split: "Efisiensi Crushing Quarry",
    label_solar: "Tergantung radius jobsite",
    label_retase: "On Target Sesuai KM",
    label_maintenance: "Maintenance Rutin",
    label_other: "Input Manual COGS",
    label_cogs: "Biaya Standar Operasional",
    label_gross_profit: "Margin Bersih Sehat",
    locationId: null,
}
