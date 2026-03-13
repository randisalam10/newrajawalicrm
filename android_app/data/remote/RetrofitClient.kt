package com.rajawali.app.data.remote

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    // GANTI dengan URL Server Anda (Gunakan 10.0.2.2 jika menggunakan Emulator Android)
    private const val BASE_URL = "http://10.0.2.2:3000/" 

    val instance: ApiService by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        retrofit.create(ApiService::class.java)
    }
}
