import React from "react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

export function formatRupiahCompact(amount: number) {
    if (!amount || amount === 0) return "Rp 0"
    if (amount >= 1_000_000_000) {
        return `Rp ${(amount / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`
    }
    if (amount >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`
    }
    return `Rp ${amount.toLocaleString('id-ID')}`
}

export function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    const d = data.map((v) => ({ v }))
    return (
        <div className="w-full h-[30px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#sg-${color.replace('#', '')})`} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
