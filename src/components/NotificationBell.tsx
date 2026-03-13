"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Trash2, CheckCircle2 } from "lucide-react"
import { pusherClient } from "@/lib/pusher"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"

type NotificationItem = {
    id: string
    title: string
    message: string
    createdAt: number
    isRead: boolean
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [open, setOpen] = useState(false)

    // Load from local storage initially
    useEffect(() => {
        const stored = localStorage.getItem("rajawali_notifications")
        if (stored) {
            try {
                setNotifications(JSON.parse(stored))
            } catch (e) {
                // ignore
            }
        }
    }, [])

    // Sync to local storage on change
    useEffect(() => {
        localStorage.setItem("rajawali_notifications", JSON.stringify(notifications))
    }, [notifications])

    // Listen to pusher
    useEffect(() => {
        if (!pusherClient) return

        const channel = pusherClient.subscribe('logistik-channel')

        channel.bind('po-updated', (data: { message: string }) => {
            const isApprove = data.message.includes("setujui")
            const newNotif: NotificationItem = {
                id: Math.random().toString(36).substr(2, 9),
                title: isApprove ? "PO Disetujui" : "Update PO",
                message: data.message,
                createdAt: Date.now(),
                isRead: false
            }
            setNotifications(prev => [newNotif, ...prev].slice(0, 50)) // keep max 50
        })

        return () => {
            channel.unbind('po-updated')
            channel.unsubscribe()
        }
    }, [])

    const unreadCount = notifications.filter(n => !n.isRead).length

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }

    const clearAll = () => {
        setNotifications([])
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-slate-100 transition-colors">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full ring-2 ring-white"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0 shadow-xl rounded-xl border-slate-200">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Notifikasi</span>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">{unreadCount} Baru</Badge>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markAllRead} title="Tandai semua dibaca">
                                <Check className="h-4 w-4 text-slate-500" />
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-600" onClick={clearAll} title="Hapus semua">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                <Bell className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm">Belum ada notifikasi baru.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`px-4 py-3 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => {
                                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
                                    }}
                                >
                                    <div className="mt-0.5">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${notif.title === "PO Disetujui" ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm tracking-tight leading-snug ${!notif.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: localeId })}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="flex-shrink-0 mt-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
