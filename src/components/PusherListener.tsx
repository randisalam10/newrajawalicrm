"use client"

import { useEffect } from "react"
import { pusherClient } from "@/lib/pusher"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function PusherListener() {
    const router = useRouter()

    useEffect(() => {
        if (!pusherClient) return

        // Subscribe to logistik-channel
        console.log('Pusher: Subscribing to logistik-channel...')
        const channel = pusherClient.subscribe('logistik-channel')

        channel.bind('pusher:subscription_succeeded', () => {
            console.log('Pusher: Successfully subscribed to logistik-channel')
        })

        // Listen for po-updated events
        channel.bind('po-updated', (data: { message: string }) => {
            console.log('Pusher: Received po-updated event:', data)
            toast.info("Update Purchase Order", {
                description: data.message,
                duration: 5000,
            })
            // Refresh to get newest status
            router.refresh()
        })

        return () => {
            channel.unbind_all()
            channel.unsubscribe()
        }
    }, [router])

    return null
}
