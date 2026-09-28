export const ROLE_CATEGORIES = [
    { value: "OPERATOR_BP", label: "Operator Batching Plant" },
    { value: "OPERATOR_CP", label: "Operator Concrete Pump (CP)" },
    { value: "OPERATOR_ALAT_BERAT", label: "Operator Alat Berat (Excavator / Loader / Crane)" },
    { value: "SOPIR_MIXER", label: "Sopir Truk Mixer" },
    { value: "SOPIR_DT", label: "Sopir Dump Truck (DT Agregat)" },
    { value: "LAINNYA", label: "Peran Lainnya" },
] as const

export const FORMULA_TEMPLATES = [
    { 
        value: "PER_M3", 
        label: "Per Kubikasi (m³)", 
        unit: "Rp / m³",
        formula: "Volume Cor (m³) × Tarif",
        description: "Insentif dihitung dari total volume beton cor (m³)."
    },
    { 
        value: "PER_TRIP", 
        label: "Per 1x Perjalanan (Per Trip / Rit)", 
        unit: "Rp / Trip",
        formula: "Jumlah Trip / Perjalanan × Tarif",
        description: "Insentif flat per satu kali kegiatan penugasan cor / pengiriman."
    },
    { 
        value: "PER_JAM_HM", 
        label: "Per Jam Kerja (Hour Meter / HM)", 
        unit: "Rp / Jam",
        formula: "Total Jam Operasi (HM) × Tarif",
        description: "Insentif dihitung dari selisih meteran jam kerja (HM Akhir - HM Awal)."
    },
    { 
        value: "PER_HARI", 
        label: "Per Hari Penugasan", 
        unit: "Rp / Hari",
        formula: "Durasi Hari Kerja × Tarif",
        description: "Insentif dihitung dari jumlah hari penugasan sewa alat."
    },
    { 
        value: "PER_KM", 
        label: "Per Jarak Tempuh (KM)", 
        unit: "Rp / KM",
        formula: "Jarak Tempuh (KM) × Tarif",
        description: "Insentif dihitung murni dari jarak kilometer tempuh armada."
    },
    { 
        value: "PER_M3_KM", 
        label: "Per Volume & Jarak (m³ · KM)", 
        unit: "Rp / (m³·KM)",
        formula: "Volume (m³) × Jarak (KM) × Tarif",
        description: "Insentif komprehensif mengalikan volume kubikasi dengan jarak tempuh."
    },
    { 
        value: "DT_TIERED", 
        label: "Berdasarkan Tipe Dump Truck (Besar vs Kecil)", 
        unit: "Rp / Rit (Bertingkat)",
        formula: "Tarif Utama (DT Besar) atau Tarif Sekunder (DT Kecil)",
        description: "Insentif bertingkat disesuaikan dengan jenis armada pengangkut agregat."
    },
] as const
