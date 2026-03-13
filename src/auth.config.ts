import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    trustHost: true,
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
                    let target = '/operator'
                    if (['AdminBP', 'SuperAdminBP', 'CEO', 'FVP'].includes(userRole)) target = '/admin'
                    else if (userRole === 'AdminLogistik') target = '/logistik'
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

                const isLogistikRoute = nextUrl.pathname.startsWith('/logistik')

                // Root path redirects to appropriate dashboard
                if (nextUrl.pathname === '/') {
                    let target = '/operator'
                    if (['AdminBP', 'SuperAdminBP', 'CEO', 'FVP'].includes(userRole as string)) target = '/admin'
                    else if (userRole === 'AdminLogistik') target = '/logistik'
                    return Response.redirect(new URL(target, nextUrl))
                }

                if (isAdminRoute && !['AdminBP', 'SuperAdminBP', 'CEO', 'FVP'].includes(userRole as string)) {
                    const target = userRole === 'AdminLogistik' ? '/logistik' : '/operator'
                    return Response.redirect(new URL(target, nextUrl))
                }
                if (isOperatorRoute && !['OperatorBP', 'SuperAdminBP', 'AdminBP', 'CEO', 'FVP'].includes(userRole as string)) {
                    const target = userRole === 'AdminLogistik' ? '/logistik' : '/admin'
                    return Response.redirect(new URL(target, nextUrl))
                }
                if (isLogistikRoute && !['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(userRole as string)) {
                    const target = userRole === 'OperatorBP' ? '/operator' : '/admin'
                    return Response.redirect(new URL(target, nextUrl))
                }
            }

            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.role = user.role as "AdminBP" | "OperatorBP" | "SuperAdminBP" | "AdminLogistik" | "CEO" | "FVP"
                token.employeeId = user.employeeId
                token.locationId = user.locationId
            }
            return token
        },
        session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id
                session.user.username = token.username as string
                session.user.role = token.role as "AdminBP" | "OperatorBP" | "SuperAdminBP" | "AdminLogistik" | "CEO" | "FVP"
                session.user.employeeId = token.employeeId as string
                session.user.locationId = token.locationId as string | null
            }
            return session
        },
    },
} satisfies NextAuthConfig
