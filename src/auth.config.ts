import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    providers: [], // Added in auth.ts to avoid node module edge restrictions
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAuthRoute = nextUrl.pathname.startsWith('/login')
            const isAdminRoute = nextUrl.pathname.startsWith('/admin')
            const isOperatorRoute = nextUrl.pathname.startsWith('/operator')

            if (isAuthRoute) {
                if (isLoggedIn) {
                    // Redirect based on role
                    const userRole = auth.user.role as string
                    const target = ['AdminBP', 'SuperAdminBP'].includes(userRole) ? '/admin' : '/operator'
                    return Response.redirect(new URL(target, nextUrl))
                }
                return true
            }

            if (!isLoggedIn) {
                // Exclude root path from redirecting loop if needed, but here we protect it
                if (nextUrl.pathname === '/') {
                    return Response.redirect(new URL('/login', nextUrl))
                }
                return false // Redirects to login page
            }

            if (isLoggedIn) {
                const userRole = auth.user.role

                // Root path redirects to appropriate dashboard
                if (nextUrl.pathname === '/') {
                    const target = ['AdminBP', 'SuperAdminBP'].includes(userRole) ? '/admin' : '/operator'
                    return Response.redirect(new URL(target, nextUrl))
                }

                if (isAdminRoute && !['AdminBP', 'SuperAdminBP'].includes(userRole as string)) {
                    return Response.redirect(new URL('/operator', nextUrl))
                }
                if (isOperatorRoute && userRole !== 'OperatorBP') {
                    return Response.redirect(new URL('/admin', nextUrl))
                }
            }

            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.role = user.role as "AdminBP" | "OperatorBP" | "SuperAdminBP"
                token.employeeId = user.employeeId
                token.locationId = user.locationId
            }
            return token
        },
        session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id
                session.user.username = token.username as string
                session.user.role = token.role as "AdminBP" | "OperatorBP" | "SuperAdminBP"
                session.user.employeeId = token.employeeId as string
                session.user.locationId = token.locationId as string | null
            }
            return session
        },
    },
} satisfies NextAuthConfig
