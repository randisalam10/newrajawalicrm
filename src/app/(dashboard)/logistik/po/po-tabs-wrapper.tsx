"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, BarChart2 } from "lucide-react"

export function POTabsWrapper({
    childrenDaftar,
    childrenLaporan,
}: {
    childrenDaftar: React.ReactNode
    childrenLaporan: React.ReactNode
}) {
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState("daftar")

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="space-y-4">
                <div className="flex gap-2 border-b border-slate-200 pb-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white rounded-md shadow-xs border">
                        <ClipboardList className="w-4 h-4" /> Daftar PO
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600">
                        <BarChart2 className="w-4 h-4" /> Laporan Bulanan
                    </button>
                </div>
                <div>{childrenDaftar}</div>
            </div>
        )
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="mb-2">
                <TabsTrigger value="daftar" className="gap-2">
                    <ClipboardList className="w-4 h-4" /> Daftar PO
                </TabsTrigger>
                <TabsTrigger value="laporan" className="gap-2">
                    <BarChart2 className="w-4 h-4" /> Laporan Bulanan
                </TabsTrigger>
            </TabsList>

            <TabsContent value="daftar">
                {childrenDaftar}
            </TabsContent>

            <TabsContent value="laporan">
                {childrenLaporan}
            </TabsContent>
        </Tabs>
    )
}
