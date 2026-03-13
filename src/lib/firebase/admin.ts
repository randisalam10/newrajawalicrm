import * as admin from 'firebase-admin';

import path from 'path';

// Periksa apakah firebase sudah diinisialisasi untuk mencegah error re-initialization di Next.js
if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.FIREBASE_KEY_PATH;

        if (serviceAccountPath) {
            // Gunakan path absolut dengan process.cwd() agar aman dijalankan dari root Next.js
            const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(absolutePath)
            });
            console.log('Firebase Admin initialized successfully using path:', absolutePath);
        } else {
            console.warn('FIREBASE_KEY_PATH not provided. Push notifications will be disabled.');
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const firebaseAdmin = admin;

/**
 * Utilitas untuk mengirim notifikasi push
 */
export async function sendPushNotification(tokens: string[], title: string, body: string, data: any = {}, sound: string = "notification_sound") {
    if (!admin.apps.length || tokens.length === 0) {
        console.log('Push notification skipped: No active Firebase app or no tokens.');
        return;
    }

    try {
        const message = {
            notification: { title, body },
            data: {
                ...data,
                click_action: "FLUTTER_NOTIFICATION_CLICK", // For deep linking support if needed
            },
            android: {
                notification: {
                    sound: sound,
                    channelId: "rajawali_approval_v3" // v3: forces sound refresh on reinstall
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: `${sound}.mp3`,
                    }
                }
            },
            tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message as any);
        console.log(`Successfully sent ${response.successCount} messages`);
        if (response.failureCount > 0) {
            console.log(`Failed to send ${response.failureCount} messages. Errors:`, 
                response.responses.filter(r => !r.success).map(r => r.error)
            );
        }
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}
