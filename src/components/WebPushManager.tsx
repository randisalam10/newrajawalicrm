"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { BellRing, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function WebPushManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>("default")
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [showBanner, setShowBanner] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)

    // Dapatkan VAPID Key dari env atau fallback API
    const getVapidKey = async (): Promise<string | null> => {
        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        }
        try {
            const res = await fetch("/api/web-push/vapid-key")
            const data = await res.json()
            return data.publicKey || null
        } catch (e) {
            console.error("[WebPush] Gagal mengambil VAPID key:", e)
            return null
        }
    }

    // Sync subscription ke backend
    const syncSubscriptionToBackend = useCallback(async (subscription: PushSubscription) => {
        try {
            const res = await fetch("/api/web-push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscription,
                    userAgent: navigator.userAgent
                })
            })
            if (res.ok) {
                setIsSubscribed(true)
                console.log("[WebPush] Perangkat berhasil terdaftar di server database.")
            }
        } catch (e) {
            console.error("[WebPush] Gagal sinkronisasi subscription:", e)
        }
    }, [])

    const subscribeToPush = useCallback(async (silent = false) => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

        if (!silent) setIsLoading(true)
        try {
            const vapidKey = await getVapidKey()
            if (!vapidKey) {
                if (!silent) toast.error("Kunci VAPID tidak ditemukan.")
                return
            }

            const requestedPermission = await Notification.requestPermission()
            setPermission(requestedPermission)

            if (requestedPermission !== "granted") {
                if (!silent) toast.warning("Izin notifikasi ditolak. Anda dapat mengaktifkannya via pengaturan browser.")
                setShowBanner(false)
                return
            }

            const registration = await navigator.serviceWorker.ready
            let subscription = await registration.pushManager.getSubscription()

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                })
            }

            await syncSubscriptionToBackend(subscription)
            setIsSubscribed(true)
            setShowBanner(false)
            if (!silent) {
                toast.success("Notifikasi browser berhasil diaktifkan! Browser Anda siap menerima notifikasi approval.")
            }
        } catch (error: any) {
            console.error("[WebPush] Subscribe error:", error)
            if (!silent) toast.error(error.message || "Gagal mengaktifkan notifikasi browser.")
        } finally {
            if (!silent) setIsLoading(false)
        }
    }, [syncSubscriptionToBackend])

    useEffect(() => {
        if (typeof window === "undefined") return

        const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
        setIsSupported(supported)

        if (!supported) return

        const currentPerm = Notification.permission
        setPermission(currentPerm)

        // Daftarkan Service Worker
        navigator.serviceWorker
            .register("/sw.js")
            .then(async (registration) => {
                const existingSub = await registration.pushManager.getSubscription()
                if (existingSub) {
                    setIsSubscribed(true)
                    // Pastikan subscription tetap sinkron di database
                    syncSubscriptionToBackend(existingSub)
                } else if (currentPerm === "granted") {
                    // Jika permission browser sudah 'granted' tapi belum ada push subscription, langsung buat otomatis!
                    console.log("[WebPush] Izin notifikasi sudah granted, mendaftarkan push subscription otomatis...")
                    subscribeToPush(true)
                } else if (currentPerm === "default") {
                    const dismissed = sessionStorage.getItem("webpush_banner_dismissed")
                    if (!dismissed) {
                        setShowBanner(true)
                    }
                }
            })
            .catch((err) => {
                console.error("[WebPush] Service Worker registration failed:", err)
            })
    }, [subscribeToPush, syncSubscriptionToBackend])

    const testNotification = async () => {
        setIsTesting(true)
        try {
            const res = await fetch("/api/web-push/test", { method: "POST" })
            const data = await res.json()
            if (data.success && data.sent > 0) {
                toast.success("Notifikasi uji coba terkirim! Periksa pojok kanan bawah desktop Anda.")
            } else {
                toast.error(data.message || "Gagal mengirim notifikasi uji coba.")
            }
        } catch (e: any) {
            toast.error(e.message || "Error saat mengirim notifikasi uji coba.")
        } finally {
            setIsTesting(false)
        }
    }

    const dismissBanner = () => {
        setShowBanner(false)
        sessionStorage.setItem("webpush_banner_dismissed", "true")
    }

    if (!isSupported || !showBanner || isSubscribed) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg shrink-0 mt-0.5">
                    <BellRing className="h-5 w-5 animate-bounce" />
                </div>
                <div className="flex-1 text-xs">
                    <p className="font-semibold text-sm text-slate-100 mb-1">
                        Aktifkan Notifikasi Approval
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                        Dapatkan pemberitahuan langsung di komputer / HP Anda saat ada pengajuan PO baru, bahkan saat web sedang ditutup.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => subscribeToPush(false)}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs font-semibold px-3"
                        >
                            {isLoading ? "Mengaktifkan..." : "Aktifkan Sekarang"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={dismissBanner}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 text-xs"
                        >
                            Nanti Saja
                        </Button>
                    </div>
                </div>
                <button
                    onClick={dismissBanner}
                    className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
