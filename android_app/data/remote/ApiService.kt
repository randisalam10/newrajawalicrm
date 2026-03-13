package com.rajawali.app.data.remote

import com.rajawali.app.data.model.FcmTokenRequest
import com.rajawali.app.data.model.LoginRequest
import com.rajawali.app.data.model.LoginResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @PATCH("api/auth/fcm-token")
    suspend fun updateFcmToken(
        @Header("Authorization") token: String,
        @Body request: FcmTokenRequest
    ): Response<Unit>
}
