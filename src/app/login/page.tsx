"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { authenticate } from "./actions"
import { Factory, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (errorMessage === "success") {
            router.push("/")
            router.refresh()
        }
    }, [errorMessage, router])

    const showError = errorMessage && errorMessage !== "success"

    return (
        <div className="flex h-screen w-screen overflow-hidden">

            {/* ── LEFT PANEL: Branding ── */}
            <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 overflow-hidden">

                {/* Background decorative circles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -right-32 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" />
                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}
                    />
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Factory className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="text-white font-bold text-lg leading-none">Rajawali BP</div>
                            <div className="text-blue-300 text-xs font-medium mt-0.5">Batching Plant System</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-blue-200 text-xs font-medium">Sistem Operasional Aktif</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white leading-snug">
                            Beton Terbaik<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                                di Papua
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                            Kualitas dan konsistensi produksi beton siap pakai yang dapat diandalkan untuk setiap kebutuhan konstruksi Anda.
                        </p>
                    </div>

                    {/* Company info */}
                    <div className="pt-4 border-t border-white/10 space-y-1">
                        <div className="text-slate-400 text-xs">Dikelola oleh</div>
                        <div className="text-white font-semibold text-base">PT. Rajawali Mix</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-slate-600 text-xs">
                    © 2025 Rajawali Batching Plant · All rights reserved
                </div>
            </div>

            {/* ── RIGHT PANEL: Login Form ── */}
            <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">

                {/* Mobile logo */}
                <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                        <Factory className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-slate-900">Rajawali BP</div>
                        <div className="text-slate-500 text-xs">Batching Plant System</div>
                    </div>
                </div>

                <div className="w-full max-w-sm">
                    {/* Heading */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Selamat Datang</h2>
                        <p className="text-slate-500 text-sm mt-1.5">Masuk ke sistem manajemen produksi</p>
                    </div>

                    {/* Error banner */}
                    {showError && (
                        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-red-700">Login Gagal</p>
                                <p className="text-xs text-red-500 mt-0.5">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form action={formAction} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="text-sm font-medium text-slate-700">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Masukkan username..."
                                    required
                                    autoComplete="username"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400
                                        focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400
                                        focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-6 mt-2 rounded-xl font-semibold text-sm text-white
                                bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                                shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
                                transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
                        >
                            {isPending ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Memverifikasi...
                                </>
                            ) : (
                                <>
                                    Masuk ke Sistem
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer note */}
                    <p className="text-center text-xs text-slate-400 mt-8">
                        Hubungi administrator jika mengalami masalah akses
                    </p>
                </div>
            </div>
        </div>
    )
}
