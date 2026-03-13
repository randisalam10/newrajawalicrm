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
            <main className="flex-1 w-full bg-slate-50 relative overflow-x-hidden min-h-screen">
                <div className="absolute top-4 left-4 z-50 md:hidden bg-background/50 rounded-md p-1 backdrop-blur-sm">
                    <SidebarTrigger />
                </div>

                {/* Notification Bell Top Header */}
                <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50 flex items-center gap-4 border border-slate-200/60 bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-full shadow-sm">
                    <NotificationBell />
                </div>

                <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-[1400px] mx-auto w-full h-full">
                    {children}
                </div>
            </main>
            <Toaster />
            <SonnerToaster position="top-right" richColors />
            <PusherListener />
        </SidebarProvider>
    )
}
