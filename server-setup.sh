#!/bin/bash
# ============================================================
# server-setup.sh — Setup VPS Ubuntu 20.04 LTS
# Jalankan sekali sebagai root: sudo bash server-setup.sh
# ============================================================

set -e

echo "================================================"
echo " 🖥️  Rajawali BP ERP — Server Setup (Ubuntu 20.04)"
echo "================================================"

# ── Variables — Edit sesuai kebutuhan ──
DB_NAME="rajawali_prod"
DB_USER="rajawali_user"
DB_PASS="RajawaliBP@2025!"   # ← GANTI dengan password kuat
APP_DIR="/opt/rajawali"
GIT_REPO="https://github.com/NAMA_USER/NAMA_REPO.git"  # ← GANTI

echo ""
echo "[1/8] Update system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y curl wget git unzip ufw software-properties-common

# ─────────────────────────────────────────────
# [2] Install Docker Engine
# ─────────────────────────────────────────────
echo ""
echo "[2/8] Installing Docker Engine..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    systemctl enable docker
    systemctl start docker
    echo "   ✓ Docker $(docker --version | cut -d' ' -f3) installed"
else
    echo "   ✓ Docker already installed"
fi

# ─────────────────────────────────────────────
# [3] Install PostgreSQL 15
# ─────────────────────────────────────────────
echo ""
echo "[3/8] Installing PostgreSQL 15..."
if ! command -v psql &> /dev/null; then
    # Add official PostgreSQL apt repo
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
    echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt focal-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list
    apt-get update -y
    apt-get install -y postgresql-15 postgresql-client-15
    systemctl enable postgresql
    systemctl start postgresql
    echo "   ✓ PostgreSQL 15 installed"
else
    echo "   ✓ PostgreSQL already installed"
fi

# Create database & user
echo ""
echo "   Creating database '$DB_NAME' and user '$DB_USER'..."
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';
    END IF;
END \$\$;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
echo "   ✓ Database ready"

# Allow Docker containers to connect ke PostgreSQL host
# Edit pg_hba.conf to allow connection dari 172.17.0.0/16 (Docker bridge network)
PG_HBA="/etc/postgresql/15/main/pg_hba.conf"
if ! grep -q "172.17.0.0/16" "$PG_HBA"; then
    echo "host    $DB_NAME    $DB_USER    172.17.0.0/16    md5" >> "$PG_HBA"
    echo "   ✓ pg_hba.conf updated for Docker network"
fi

# Allow listen on all interfaces (untuk Docker host networking)
PG_CONF="/etc/postgresql/15/main/postgresql.conf"
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
systemctl restart postgresql
echo "   ✓ PostgreSQL configured to accept Docker connections"

# ─────────────────────────────────────────────
# [4] Install Nginx
# ─────────────────────────────────────────────
echo ""
echo "[4/8] Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "   ✓ Nginx installed"
else
    echo "   ✓ Nginx already installed"
fi

# ─────────────────────────────────────────────
# [5] Install Certbot (Let's Encrypt SSL)
# ─────────────────────────────────────────────
echo ""
echo "[5/8] Installing Certbot..."
snap install --classic certbot 2>/dev/null || apt-get install -y certbot python3-certbot-nginx
ln -sf /snap/bin/certbot /usr/bin/certbot 2>/dev/null || true
echo "   ✓ Certbot ready"

# ─────────────────────────────────────────────
# [6] Setup Firewall (UFW)
# ─────────────────────────────────────────────
echo ""
echo "[6/8] Configuring firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh          # Port 22
ufw allow 80/tcp       # HTTP (Nginx)
ufw allow 443/tcp      # HTTPS (Nginx)
# JANGAN buka port 3000 ke publik (hanya Nginx yang akses)
# JANGAN buka port 5432 ke publik (hanya local/Docker)
ufw --force enable
echo "   ✓ Firewall configured (SSH, 80, 443 only)"

# ─────────────────────────────────────────────
# [7] Clone repo & setup app directory
# ─────────────────────────────────────────────
echo ""
echo "[7/8] Setting up application directory..."
mkdir -p $APP_DIR
if [ -d "$APP_DIR/.git" ]; then
    echo "   Repo already cloned, pulling latest..."
    cd $APP_DIR && git pull origin main
else
    echo "   Cloning repository..."
    git clone $GIT_REPO $APP_DIR
fi
echo "   ✓ App directory: $APP_DIR"

# ─────────────────────────────────────────────
# [8] Setup Nginx virtual host
# ─────────────────────────────────────────────
echo ""
echo "[8/8] Setting up Nginx config..."
cp $APP_DIR/nginx/portal.rajawalimix.conf /etc/nginx/sites-available/portal.rajawalimix.conf
ln -sf /etc/nginx/sites-available/portal.rajawalimix.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "   ✓ Nginx config installed"

# ─────────────────────────────────────────────
# DONE — Next steps
# ─────────────────────────────────────────────
DOCKER_BRIDGE_IP=$(docker network inspect bridge --format='{{range .IPAM.Config}}{{.Gateway}}{{end}}' 2>/dev/null || echo "172.17.0.1")

echo ""
echo "================================================"
echo " ✅ Server setup selesai!"
echo "================================================"
echo ""
echo "📋 Langkah selanjutnya:"
echo ""
echo "1. Copy .env.production ke server:"
echo "   scp .env.production user@SERVER_IP:$APP_DIR/"
echo ""
echo "   Isi DATABASE_URL-nya:"
echo "   DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@$DOCKER_BRIDGE_IP:5432/$DB_NAME?schema=public\""
echo ""
echo "   ⚠️  Gunakan IP bridge Docker ($DOCKER_BRIDGE_IP) bukan localhost"
echo "      supaya container bisa akses PostgreSQL di host."
echo ""
echo "2. Jalankan deploy pertama kali:"
echo "   cd $APP_DIR && bash deploy.sh"
echo ""
echo "3. Setup SSL (setelah DNS domain sudah pointing ke server ini):"
echo "   certbot --nginx -d portal.rajawalimix.com"
echo ""
