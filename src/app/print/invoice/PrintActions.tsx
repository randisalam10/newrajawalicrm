"use client"

export function PrintActions() {
    return (
        <div className="no-print" style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
                onClick={() => window.print()}
                style={{ padding: '8px 20px', background: '#1e3a6e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
                🖨️ Cetak
            </button>
            <button
                onClick={() => window.close()}
                style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            >
                Tutup
            </button>
        </div>
    )
}
