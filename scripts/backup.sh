#!/bin/bash
# ==============================================================================
# backup.sh — Script Backup Database & Uploads Rajawali BP ERP
# Jalankan di server: bash scripts/backup.sh [opsi]
#
# Penggunaan:
#   bash scripts/backup.sh            -> Backup database PostgreSQL (.sql.gz)
#   bash scripts/backup.sh --all      -> Backup database + folder berkas uploads
#   bash scripts/backup.sh --uploads  -> Backup folder berkas uploads saja
# ==============================================================================

set -e

# Warna Terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
KEEP_DAYS=30

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   💾 Rajawali BP ERP — Backup & Dump Data Production ${NC}"
echo -e "${BLUE}======================================================${NC}"

# ── 1. Deteksi file environment (.env.production / .env) ──────────────
ENV_FILE=""
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f "../.env.production" ]; then
    ENV_FILE="../.env.production"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
elif [ -f "../.env" ]; then
    ENV_FILE="../.env"
fi

if [ -z "$ENV_FILE" ]; then
    echo -e "${RED}❌ ERROR: File .env.production atau .env tidak ditemukan!${NC}"
    echo "   Pastikan script dijalankan di direktori proyek aplikasi."
    exit 1
fi

echo -e "${CYAN}[1/4] Menggunakan konfigurasi dari: ${GREEN}$ENV_FILE${NC}"

# Ekstrak DATABASE_URL (menghapus carriage return \r dari Windows jika ada)
DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '\r' | tr -d '"' | tr -d "'")

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ ERROR: Variabel DATABASE_URL tidak ditemukan di $ENV_FILE!${NC}"
    exit 1
fi

# Buat direktori backups jika belum ada
mkdir -p "$BACKUP_DIR"

# Mode flags
DO_DB=true
DO_UPLOADS=false

for arg in "$@"; do
    case $arg in
        --all|-a)
            DO_DB=true
            DO_UPLOADS=true
            ;;
        --uploads|-u|--uploads-only)
            DO_DB=false
            DO_UPLOADS=true
            ;;
        --help|-h)
            echo "Penggunaan: bash scripts/backup.sh [OPSI]"
            echo "  (tanpa opsi)  : Backup database saja (.sql.gz)"
            echo "  --all, -a     : Backup database DAN berkas uploads"
            echo "  --uploads, -u : Backup berkas uploads saja (.tar.gz)"
            exit 0
            ;;
    esac
done

# ── 2. Backup Database PostgreSQL ─────────────────────────────────────
if [ "$DO_DB" = true ]; then
    echo ""
    echo -e "${CYAN}[2/4] Melakukan dump database PostgreSQL...${NC}"
    
    DB_DUMP_FILE="$BACKUP_DIR/db_dump_${TIMESTAMP}.sql.gz"
    echo -e "   Target file: ${YELLOW}$DB_DUMP_FILE${NC}"

    DUMP_SUCCESS=false

    # Metode 1: Menggunakan pg_dump lokal host (jika terinstall)
    if command -v pg_dump &> /dev/null; then
        echo -e "   Metode: Menggunakan pg_dump native host..."
        # Strip parameter Prisma seperti ?schema=public agar psql/pg_dump kompatibel
        CLEAN_URL=$(echo "$DB_URL" | sed 's/?.*//')
        if pg_dump "$CLEAN_URL" 2>/dev/null | gzip -9 > "$DB_DUMP_FILE"; then
            DUMP_SUCCESS=true
        fi
    fi

    # Metode 2: Menggunakan Docker Container PostgreSQL (Zero dependency host)
    if [ "$DUMP_SUCCESS" = false ] && command -v docker &> /dev/null; then
        echo -e "   Metode: Menggunakan container docker postgres:16-alpine (network host)..."
        if docker run --rm --network host postgres:16-alpine pg_dump "$DB_URL" 2>/dev/null | gzip -9 > "$DB_DUMP_FILE"; then
            DUMP_SUCCESS=true
        fi
    fi

    # Metode 3: Jika database jalan di container "rajawali-postgres" (docker-compose)
    if [ "$DUMP_SUCCESS" = false ] && command -v docker &> /dev/null; then
        if docker ps --format '{{.Names}}' | grep -q "^rajawali-postgres$"; then
            echo -e "   Metode: Menggunakan container internal 'rajawali-postgres'..."
            if docker exec -t rajawali-postgres pg_dump -U admin rajawali_db 2>/dev/null | gzip -9 > "$DB_DUMP_FILE"; then
                DUMP_SUCCESS=true
            fi
        fi
    fi

    # Validasi hasil dump
    if [ "$DUMP_SUCCESS" = true ] && [ -s "$DB_DUMP_FILE" ]; then
        DUMP_SIZE=$(du -h "$DB_DUMP_FILE" | cut -f1)
        echo -e "${GREEN}   ✓ Database berhasil di-dump & dikompresi: $DB_DUMP_FILE ($DUMP_SIZE)${NC}"
    else
        echo -e "${RED}❌ Gagal melakukan dump database! Periksa koneksi DATABASE_URL.${NC}"
        rm -f "$DB_DUMP_FILE"
        exit 1
    fi
else
    echo -e "${YELLOW}[2/4] Melewati backup database (--uploads-only).${NC}"
fi

# ── 3. Backup Folder Berkas / Uploads ──────────────────────────────────
if [ "$DO_UPLOADS" = true ]; then
    echo ""
    echo -e "${CYAN}[3/4] Melakukan backup berkas lampiran & foto (Uploads)...${NC}"
    
    UPLOADS_SRC=""
    if [ -d "/var/data/rajawali/uploads" ]; then
        UPLOADS_SRC="/var/data/rajawali/uploads"
    elif [ -d "./uploads" ]; then
        UPLOADS_SRC="./uploads"
    elif [ -d "../uploads" ]; then
        UPLOADS_SRC="../uploads"
    fi

    if [ -n "$UPLOADS_SRC" ] && [ -d "$UPLOADS_SRC" ]; then
        UPLOADS_TAR_FILE="$BACKUP_DIR/uploads_backup_${TIMESTAMP}.tar.gz"
        echo -e "   Sumber direktori : ${YELLOW}$UPLOADS_SRC${NC}"
        echo -e "   Target arsip     : ${YELLOW}$UPLOADS_TAR_FILE${NC}"
        
        tar -czf "$UPLOADS_TAR_FILE" -C "$(dirname "$UPLOADS_SRC")" "$(basename "$UPLOADS_SRC")"
        UPLOADS_SIZE=$(du -h "$UPLOADS_TAR_FILE" | cut -f1)
        echo -e "${GREEN}   ✓ Berkas uploads berhasil diarsipkan: $UPLOADS_TAR_FILE ($UPLOADS_SIZE)${NC}"
    else
        echo -e "${YELLOW}   ⚠ Direktori uploads tidak ditemukan. Melewati backup berkas.${NC}"
    fi
else
    echo ""
    echo -e "${CYAN}[3/4] Info: Folder uploads dilewati. (Gunakan flag --all jika ingin backup uploads)${NC}"
fi

# ── 4. Rotasi & Pembersihan Backup Lama ────────────────────────────────
echo ""
echo -e "${CYAN}[4/4] Rotasi otomatis (membersihkan file backup > $KEEP_DAYS hari)...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -type f -name "*_backup_*.gz" -o -name "db_dump_*.gz" -mtime +$KEEP_DAYS 2>/dev/null | wc -l || echo 0)
find "$BACKUP_DIR" -type f \( -name "*_backup_*.gz" -o -name "db_dump_*.gz" \) -mtime +$KEEP_DAYS -delete 2>/dev/null || true
echo -e "   ✓ Pembersihan selesai ($DELETED_COUNT file usang dihapus)."

# ── Ringkasan Akhir ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN} ✅ PROSES BACKUP SELESAI DENGAN SUKSES!               ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Daftar file di ${YELLOW}$BACKUP_DIR${NC}:"
ls -lh "$BACKUP_DIR" | grep -E "\.gz$" | tail -n 5
echo ""
echo -e "💡 ${CYAN}Perintah untuk restore database jika diperlukan:${NC}"
echo -e "   gunzip -c $BACKUP_DIR/db_dump_${TIMESTAMP}.sql.gz | psql \"\$DATABASE_URL\""
echo -e "   (Atau via docker):"
echo -e "   gunzip -c $BACKUP_DIR/db_dump_${TIMESTAMP}.sql.gz | docker run -i --rm --network host postgres:16-alpine psql \"\$DATABASE_URL\""
echo -e "${GREEN}======================================================${NC}"
