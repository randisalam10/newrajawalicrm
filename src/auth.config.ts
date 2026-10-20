import type { NextAuthConfig } from "next-auth"

export function resolveUserDashboard(userRole?: string | null, permissions: string[] = []): string {
    const role = (userRole || '').trim()
    const roleLower = role.toLowerCase()
    const hasCrusherPerm = permissions.some(p => p.startsWith('CRUSHER_'))
    const hasLogistikPerm = permissions.some(p => p.startsWith('LOGISTIK_'))
    const isCrusherRole =
        roleLower === 'operatorcrusher' ||
        roleLower === 'admincrusher' ||
        roleLower.includes('crusher') ||
        roleLower.startsWith('sc')

    if (['adminbp', 'superadminbp', 'ceo', 'fvp'].includes(roleLower)) {
        return '/admin'
    }
    if (roleLower === 'operatorbp') {
        return '/operator'
    }
    if (isCrusherRole || hasCrusherPerm) {
        // If user only has logistik permission without crusher permission, route to /logistik
        if (hasLogistikPerm && !hasCrusherPerm) {
            return '/logistik'
        }
        return '/crusher'
    }
    if (roleLower === 'adminlogistik' || hasLogistikPerm) {
        return '/logistik'
    }
    const hasAdminPerm = permissions.some(p =>
        p.startsWith('MUTU_') ||
        p.startsWith('ITEM_PEKERJAAN_') ||
        p.startsWith('INSENTIF_') ||
        p.startsWith('MASTER_DATA_') ||
        p.startsWith('VEHICLE_') ||
        p.startsWith('KARYAWAN_') ||
        p.startsWith('MATERIAL_') ||
        p.startsWith('RBL_') ||
        p.startsWith('SEWA_') ||
        p.startsWith('REPORTS_') ||
        p.startsWith('PRODUKSI_') ||
        p.startsWith('BILLING_') ||
        p.startsWith('PLANNING_') ||
        p.startsWith('CUSTOMER_') ||
        p.startsWith('DASHBOARD_') ||
        p.startsWith('FINANCE_')
    )
    if (hasAdminPerm) {
        return '/admin'
    }
    if (permissions.includes('PRODUKSI_CREATE')) {
        return '/operator'
    }
    return '/admin'
}

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
            const isLogistikRoute = nextUrl.pathname.startsWith('/logistik')
            const isCrusherRoute = nextUrl.pathname.startsWith('/crusher')

            if (isAuthRoute) {
                if (isLoggedIn) {
                    const userRole = (auth.user.role as string) || ''
                    const permissions = ((auth.user as any)?.permissions as string[]) || []
                    const target = resolveUserDashboard(userRole, permissions)
                    return Response.redirect(new URL(target, nextUrl))
                }
                return true
            }

            if (!isLoggedIn) {
                if (nextUrl.pathname === '/') {
                    return Response.redirect(new URL('/login', nextUrl))
                }
                return false // Redirects to login page
            }

            if (isLoggedIn) {
                const userRole = (auth.user.role as string) || ''
                const permissions = ((auth.user as any)?.permissions as string[]) || []
                const roleLower = userRole.toLowerCase()
                const isCrusherRole =
                    roleLower === 'operatorcrusher' ||
                    roleLower === 'admincrusher' ||
                    roleLower.includes('crusher') ||
                    roleLower.startsWith('sc')

                // Root path redirects to appropriate dashboard
                if (nextUrl.pathname === '/') {
                    const target = resolveUserDashboard(userRole, permissions)
                    return Response.redirect(new URL(target, nextUrl))
                }

                if (isAdminRoute && !['AdminBP', 'SuperAdminBP', 'CEO', 'FVP'].includes(userRole)) {
                    // AdminLogistik, Crusher, or any role with relevant admin/logistik permissions can access admin subroutes
                    const hasAdminAccess =
                        userRole === 'AdminLogistik' ||
                        isCrusherRole ||
                        permissions.some(p =>
                            p.startsWith('LOGISTIK_') ||
                            p.startsWith('MUTU_') ||
                            p.startsWith('ITEM_PEKERJAAN_') ||
                            p.startsWith('INSENTIF_') ||
                            p.startsWith('MASTER_DATA_') ||
                            p.startsWith('VEHICLE_') ||
                            p.startsWith('KARYAWAN_') ||
                            p.startsWith('MATERIAL_') ||
                            p.startsWith('RBL_') ||
                            p.startsWith('SEWA_') ||
                            p.startsWith('REPORTS_') ||
                            p.startsWith('PRODUKSI_') ||
                            p.startsWith('BILLING_') ||
                            p.startsWith('PLANNING_') ||
                            p.startsWith('CUSTOMER_') ||
                            p.startsWith('FINANCE_') ||
                            p.startsWith('CRUSHER_')
                        )

                    if (hasAdminAccess) {
                        // If accessing root /admin overview without DASHBOARD_VIEW permission, redirect appropriately
                        if (nextUrl.pathname === '/admin' && !permissions.includes('DASHBOARD_VIEW')) {
                            const target = resolveUserDashboard(userRole, permissions)
                            if (target !== '/admin') {
                                return Response.redirect(new URL(target, nextUrl))
                            }
                        }
                        return true
                    }

                    const target = resolveUserDashboard(userRole, permissions)
                    return Response.redirect(new URL(target === '/admin' ? '/logistik' : target, nextUrl))
                }

                if (isOperatorRoute) {
                    const isAllowed =
                        ['OperatorBP', 'SuperAdminBP', 'AdminBP', 'CEO', 'FVP'].includes(userRole) ||
                        permissions.includes('PRODUKSI_CREATE') ||
                        permissions.includes('PRODUKSI_VIEW')

                    if (!isAllowed) {
                        const target = resolveUserDashboard(userRole, permissions)
                        return Response.redirect(new URL(target === '/operator' ? '/admin' : target, nextUrl))
                    }
                }

                if (isLogistikRoute) {
                    const allowedRoles = ['SuperAdminBP', 'AdminLogistik', 'AdminBP', 'AdminCrusher', 'OperatorCrusher', 'CEO', 'FVP', 'Approver']
                    const hasAccess =
                        allowedRoles.includes(userRole) ||
                        isCrusherRole ||
                        permissions.includes('LOGISTIK_VIEW') ||
                        permissions.includes('LOGISTIK_CREATE') ||
                        permissions.includes('LOGISTIK_APPROVE') ||
                        permissions.some(p => p.startsWith('CRUSHER_'))

                    if (!hasAccess) {
                        const target = resolveUserDashboard(userRole, permissions)
                        return Response.redirect(new URL(target === '/logistik' ? '/admin' : target, nextUrl))
                    }
                }

                if (isCrusherRoute) {
                    const allowedCrusherRoles = ['SuperAdminBP', 'AdminBP', 'AdminCrusher', 'OperatorCrusher', 'CEO', 'FVP']
                    const hasAccess =
                        allowedCrusherRoles.includes(userRole) ||
                        isCrusherRole ||
                        permissions.some(p => p.startsWith('CRUSHER_'))

                    if (!hasAccess) {
                        const target = resolveUserDashboard(userRole, permissions)
                        return Response.redirect(new URL(target === '/crusher' ? '/admin' : target, nextUrl))
                    }
                }
            }

            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.role = user.role
                token.roleId = user.roleId
                token.roleLabel = user.roleLabel
                token.roleScope = user.roleScope
                token.permissions = user.permissions || []
                token.employeeId = user.employeeId
                token.locationId = user.locationId
            }
            return token
        },
        session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id
                session.user.username = token.username as string
                session.user.role = token.role as string
                session.user.roleId = (token.roleId as string) || null
                session.user.roleLabel = token.roleLabel as string
                session.user.roleScope = (token.roleScope as "ALL_BRANCHES" | "OWN_BRANCH") || "OWN_BRANCH"
                session.user.permissions = (token.permissions as string[]) || []
                session.user.employeeId = token.employeeId as string
                session.user.locationId = token.locationId as string | null
            }
            return session
        },
    },
} satisfies NextAuthConfig
