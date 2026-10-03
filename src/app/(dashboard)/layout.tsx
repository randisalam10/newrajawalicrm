import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { PusherListener } from "@/components/PusherListener"
import { WebPushManager } from "@/components/WebPushManager"
import { NotificationBell } from "@/components/NotificationBell"
import { DashboardNavbarTitle } from "@/components/dashboard-navbar-title"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Fetch fresh user role & permissions from DB so sidebar is 100% real-time dynamic
    let freshPermissions: string[] = session.user.permissions || []
    let userRole = session.user.role

    if (session.user.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                role: true,
                roleRef: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        })

        if (dbUser) {
            userRole = dbUser.role
            if (dbUser.roleRef?.permissions) {
                freshPermissions = dbUser.roleRef.permissions.map(rp => rp.permission.code)
            }
        }
    }

    const userForSidebar = {
        ...session.user,
        role: userRole,
        permissions: freshPermissions
    }

    return (
        <SidebarProvider className="print:block print:min-h-0">
            <div className="print:hidden">
                <AppSidebar user={userForSidebar} />
            </div>
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen overflow-x-hidden print:bg-white print:min-h-0 print:overflow-visible print:block">
                {/* Modern Sticky Top Header Bar */}
                <header className="h-16 border-b border-sidebar-border bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shrink-0 print:hidden">
                    <div className="flex items-center gap-3 min-w-0">
                        <SidebarTrigger className="text-slate-600 hover:text-slate-900 shrink-0" />
                        <DashboardNavbarTitle />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full print:p-0 print:m-0 print:w-full">
                    {children}
                </main>
            </div>
            <div className="print:hidden">
                <Toaster />
                <SonnerToaster position="top-right" richColors />
                <PusherListener />
                <WebPushManager />
            </div>
        </SidebarProvider>
    )
}
