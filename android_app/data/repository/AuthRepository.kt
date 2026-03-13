package com.rajawali.app.data.repository

import com.rajawali.app.data.model.LoginRequest
import com.rajawali.app.data.model.LoginResponse
import com.rajawali.app.data.remote.RetrofitClient
import retrofit2.Response

class AuthRepository {
    private val apiService = RetrofitClient.instance

    suspend fun login(username: String, password: String): Response<LoginResponse> {
        val request = LoginRequest(username, password)
        return apiService.login(request)
    }
}
