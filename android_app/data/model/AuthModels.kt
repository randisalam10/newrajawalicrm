package com.rajawali.app.data.model

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val error: String?,
    val user: UserData?
)

data class UserData(
    val id: String,
    val username: String,
    val role: String,
    val employeeName: String
)

data class FcmTokenRequest(
    val fcmToken: String
)
