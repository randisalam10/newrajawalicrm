"use client"

import { useEffect } from "react"
import { pusherClient, getChannelName } from "@/lib/pusher"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

function playNotificationSound() {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContext) return
        const ctx = new AudioContext()
        const now = ctx.currentTime

        // Tone 1 (Chime low)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = "sine"
        osc1.frequency.setValueAtTime(587.33, now) // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5
        gain1.gain.setValueAtTime(0.2, now)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.35)

        // Tone 2 (Chime high sparkle)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = "sine"
        osc2.frequency.setValueAtTime(880, now + 0.12)
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3) // D6
        gain2.gain.setValueAtTime(0.25, now + 0.12)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.12)
        osc2.stop(now + 0.6)
    } catch (e) {
        // Autoplay policy or unsupported audio context
    }
}

export function PusherListener() {
    const router = useRouter()

    useEffect(() => {
        if (!pusherClient) return

        // Subscribe to logistik-channel
        const channelName = getChannelName('logistik-channel')
        console.log(`Pusher: Subscribing to ${channelName}...`)
        const channel = pusherClient.subscribe(channelName)

        channel.bind('pusher:subscription_succeeded', () => {
            console.log('Pusher: Successfully subscribed to logistik-channel')
        })

        // Listen for po-updated events
        channel.bind('po-updated', (data: { message: string }) => {
            console.log('Pusher: Received po-updated event:', data)
            playNotificationSound()
            toast.info("Update Purchase Order", {
                description: data.message,
                duration: 6000,
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
