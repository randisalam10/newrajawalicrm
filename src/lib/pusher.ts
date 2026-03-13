import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusherServer = (process.env.PUSHER_APP_ID && process.env.NEXT_PUBLIC_PUSHER_APP_KEY && process.env.PUSHER_APP_SECRET)
    ? new PusherServer({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
        secret: process.env.PUSHER_APP_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
        useTLS: true,
    })
    : null

if (!pusherServer) {
    console.warn('Pusher Server not initialized. Check PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_APP_KEY, and PUSHER_APP_SECRET.');
} else {
    console.log('Pusher Server initialized successfully.');
}

export const pusherClient = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    })
    : null

if (!pusherClient) {
    console.warn('Pusher Client not initialized. Check NEXT_PUBLIC_PUSHER_APP_KEY.');
}
