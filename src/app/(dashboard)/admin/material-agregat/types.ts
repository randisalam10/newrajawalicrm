import { AggregateInRow, AggregateOutRow } from "./columns"

export type MaterialAgregatProps = {
    initialData: any[]
    initialOutData?: any[]
    locations: { id: string; name: string }[]
    vehicles?: any[]
    drivers?: any[]
    retaseSettings?: any[]
    userRole: string
    userLocationId?: string | null
    isCorporate?: boolean
    canManage?: boolean
    isReadOnly?: boolean
}

export type AggregateSummary = {
    byType: Record<string, number>
    totalVol: number
    totalRit: number
    totalRetase: number
    totalMaterialExpense: number
    internalVol: number
    externalVol: number
}

export type AggregateOutSummary = {
    totalVol: number
    totalSales: number
    totalRetase: number
    totalRit: number
    byType: Record<string, number>
}
