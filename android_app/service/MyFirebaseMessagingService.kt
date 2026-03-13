package com.rajawali.app.service

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.rajawali.app.data.model.FcmTokenRequest
import com.rajawali.app.data.remote.RetrofitClient
import com.rajawali.app.utils.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM", "New token received: $token")
        
        // Simpan token baru ke database jika user sudah login
        val sessionManager = SessionManager(applicationContext)
        val authToken = sessionManager.getAuthToken()
        
        if (authToken != null) {
            sendTokenToServer(authToken, token)
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        // Handle notifikasi saat aplikasi foreground
        remoteMessage.notification?.let {
            Log.d("FCM", "Message Notification Body: ${it.body}")
        }
    }

    private fun sendTokenToServer(authToken: String, fcmToken: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                RetrofitClient.instance.updateFcmToken(
                    token = "Bearer $authToken",
                    request = FcmTokenRequest(fcmToken)
                )
            } catch (e: Exception) {
                Log.e("FCM", "Error sending token to server", e)
            }
        }
    }
}
