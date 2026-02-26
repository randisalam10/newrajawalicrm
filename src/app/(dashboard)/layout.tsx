import { auth } from "@/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { redirect } from "next/navigation"

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
                <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-[1400px] mx-auto w-full h-full">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
