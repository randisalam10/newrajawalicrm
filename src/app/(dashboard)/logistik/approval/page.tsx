import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getApproverQueue, getApproverHistory, getUserSignature } from "../po/actions"
import { ApprovalClient } from "./approval-client"

export const metadata = {
    title: "Persetujuan Purchase Order | Rajawali Mix",
    description: "Portal Persetujuan Purchase Order untuk Approver, FVP, dan Pimpinan",
}

export default async function ApprovalPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const userRole = session.user.role as string
    const userPerms = (session.user as any)?.permissions || []
    const allowedRoles = ['SuperAdminBP', 'AdminBP', 'AdminLogistik', 'CEO', 'FVP', 'Approver']
    if (!allowedRoles.includes(userRole) && !userPerms.includes('LOGISTIK_APPROVE')) {
        redirect("/logistik/po")
    }

    const [queueRes, historyRes, sigRes] = await Promise.all([
        getApproverQueue(),
        getApproverHistory(),
        getUserSignature(),
    ])

    const queue = queueRes.success ? queueRes.data : []
    const history = historyRes.success ? historyRes.data : []
    const userSignature = sigRes.success ? sigRes.signatureUrl : null

    return (
        <div className="space-y-4">
            <ApprovalClient 
                initialQueue={queue}
                initialHistory={history}
                currentUser={{
                    id: session.user.id,
                    role: userRole,
                    signatureUrl: userSignature || null
                }}
            />
        </div>
    )
}
