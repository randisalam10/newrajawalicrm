import { auth } from "@/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { PusherListener } from "@/components/PusherListener"
import { NotificationBell } from "@/components/NotificationBell"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <SidebarProvider>
            <AppSidebar user={session.user} />
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen overflow-x-hidden">
                {/* Modern Sticky Top Header Bar */}
                <header className="h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="text-slate-600 hover:text-slate-900" />
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
                    {children}
                </main>
            </div>
            <Toaster />
            <SonnerToaster position="top-right" richColors />
            <PusherListener />
        </SidebarProvider>
    )
}
