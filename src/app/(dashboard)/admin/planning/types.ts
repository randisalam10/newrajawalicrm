export type PlanStatus = 'Planned' | 'OnGoing' | 'Done' | 'Cancelled'

export type Plan = {
    id: string
    date: Date | string
    projectId: string
    qualityId: string
    workItemId: string
    volume_plan: number
    notes: string | null
    status: PlanStatus
    locationId: string
    project: {
        name: string
        customer: { customer_name: string }
    }
    concreteQuality: { id: string; name: string }
    workItem: { id: string; name: string }
    location: { id: string; name: string }
}

export type Masters = {
    projects: Array<{ id: string; name: string; customer: { customer_name: string } }>
    qualities: Array<{ id: string; name: string }>
    workItems: Array<{ id: string; name: string }>
} | null

export type ViewMode = 'calendar' | 'list'

export interface PlanningClientProps {
    plans: Plan[]
    masters: Masters
    canManage?: boolean
}
