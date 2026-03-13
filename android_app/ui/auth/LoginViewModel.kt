package com.rajawali.app.ui.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rajawali.app.data.repository.AuthRepository
import com.rajawali.app.utils.SessionManager
import kotlinx.coroutines.launch

class LoginViewModel(
    private val repository: AuthRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    var username by mutableStateOf("")
    var password by mutableStateOf("")
    var isLoading by mutableStateOf(false)
    var loginError by mutableStateOf<String?>(null)
    var loginSuccess by mutableStateOf(false)

    fun onLoginClick() {
        if (username.isEmpty() || password.isEmpty()) {
            loginError = "Username and Password cannot be empty"
            return
        }

        isLoading = true
        loginError = null

        viewModelScope.launch {
            try {
                val response = repository.login(username, password)
                if (response.isSuccessful && response.body()?.success == true) {
                    val body = response.body()!!
                    sessionManager.saveAuthToken(body.token ?: "")
                    sessionManager.saveUserRole(body.user?.role ?: "")
                    loginSuccess = true
                } else {
                    loginError = response.body()?.error ?: "Login Failed"
                }
            } catch (e: Exception) {
                loginError = "Connection Error: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }
}
