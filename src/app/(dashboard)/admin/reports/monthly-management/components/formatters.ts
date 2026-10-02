export const formatRp = (val: number) => {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}
