"use client"
// Shared PDF components & style tokens for @react-pdf/renderer
// Used by all document templates

import { StyleSheet, Font } from "@react-pdf/renderer"

// ─── Colour palette ───────────────────────────────────────────────────────────
export const COLORS = {
    primary: "#1e3a6e",       // dark navy
    primaryLight: "#eef2ff",  // very light navy tint
    accent: "#2563eb",        // blue
    black: "#111111",
    dark: "#1a1a1a",
    mid: "#444444",
    muted: "#777777",
    border: "#e2e8f0",
    bg: "#f8fafc",
    white: "#ffffff",
    success: "#065f46",
    successBg: "#d1fae5",
    warning: "#92400e",
    warningBg: "#fef3c7",
    danger: "#7f1d1d",
    dangerBg: "#fee2e2",
}

// ─── Common stylesheet ────────────────────────────────────────────────────────
export const shared = StyleSheet.create({
    page: {
        paddingTop: 36,
        paddingBottom: 48,
        paddingHorizontal: 40,
        fontSize: 9,
        fontFamily: "Helvetica",
        color: COLORS.dark,
        backgroundColor: COLORS.white,
    },
    // ── Header strip ──
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 2.5,
        borderBottomColor: COLORS.primary,
        paddingBottom: 10,
        marginBottom: 14,
    },
    companyName: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
    },
    companySub: {
        fontSize: 8,
        color: COLORS.muted,
        marginTop: 2,
    },
    // ── Doc title box ──
    docTitleBox: {
        alignItems: "flex-end",
    },
    docTitle: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        textTransform: "uppercase",
    },
    docNumber: {
        fontSize: 10,
        fontFamily: "Helvetica",
        color: COLORS.mid,
        marginTop: 3,
    },
    docMeta: {
        fontSize: 8,
        color: COLORS.muted,
        marginTop: 2,
    },
    // ── Info box grid ──
    infoGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 14,
    },
    infoBox: {
        flex: 1,
        backgroundColor: COLORS.bg,
        borderRadius: 4,
        padding: 10,
    },
    infoLabel: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: COLORS.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 5,
    },
    infoValue: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: COLORS.black,
    },
    infoSub: {
        fontSize: 8,
        color: COLORS.mid,
        marginTop: 2,
    },
    // ── Section title ──
    sectionTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: COLORS.mid,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 3,
        marginBottom: 6,
        marginTop: 10,
    },
    // ── Table ──
    table: {
        width: "100%",
        marginBottom: 10,
    },
    tableHead: {
        flexDirection: "row",
        backgroundColor: COLORS.primary,
    },
    tableHeadCell: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: COLORS.white,
        padding: "5 6",
        flex: 1,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
    },
    tableRowAlt: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.bg,
    },
    tableCell: {
        fontSize: 8,
        color: COLORS.dark,
        padding: "4 6",
        flex: 1,
    },
    tableCellBold: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
        padding: "4 6",
        flex: 1,
    },
    tableTotalRow: {
        flexDirection: "row",
        backgroundColor: COLORS.primaryLight,
        borderTopWidth: 1.5,
        borderTopColor: COLORS.primary,
    },
    tableTotalCell: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: COLORS.primary,
        padding: "5 6",
        flex: 1,
    },
    // ── Signature ──
    signRow: {
        flexDirection: "row",
        marginTop: 28,
        gap: 20,
    },
    signBox: {
        flex: 1,
        alignItems: "center",
    },
    signLabel: {
        fontSize: 8,
        color: COLORS.mid,
        marginBottom: 40,
    },
    signLine: {
        width: "80%",
        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.primary,
    },
    signName: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: COLORS.dark,
        marginTop: 4,
        textAlign: "center",
    },
    // ── Footer page number ──
    pageNumber: {
        position: "absolute",
        bottom: 24,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 8,
        color: COLORS.muted,
    },
})
