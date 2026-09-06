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
    const allowedRoles = ['SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP', 'Approver']
    if (!allowedRoles.includes(userRole)) {
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
        <div className="container mx-auto py-6 space-y-6 max-w-7xl">
            <ApprovalClient 
                initialQueue={queue}
                initialHistory={history}
                currentUser={{
                    id: session.user.id,
                    name: (session.user as any).name || session.user.username || "Approver",
                    role: userRole,
                    signatureUrl: userSignature || null
                }}
            />
        </div>
    )
}
