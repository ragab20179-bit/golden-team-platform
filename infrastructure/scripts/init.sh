#!/bin/bash
# =============================================================================
# Golden Team NEO Platform — One-Command Initialization Script
# Document: GT-INFRA-001 | Version: 1.0 | March 2026
#
# Usage: bash scripts/init.sh
#
# This script:
#   1. Validates prerequisites (Docker, Docker Compose, .env file)
#   2. Generates secure random passwords if not set
#   3. Creates required directories and sets permissions
#   4. Installs SSL certificates via Certbot
#   5. Starts all services in the correct order
#   6. Runs database initialization
#   7. Prints access URLs and credentials summary
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

log()    { echo -e "${GREEN}[NEO INIT]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
header() { echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}\n"; }

header "Golden Team NEO Platform — Initialization"
echo "Starting deployment at $(date)"
echo "Working directory: $ROOT_DIR"

# =============================================================================
# STEP 1: Validate prerequisites
# =============================================================================
header "Step 1: Validating Prerequisites"

command -v docker >/dev/null 2>&1 || error "Docker is not installed. Install from https://docs.docker.com/engine/install/"
command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || error "Docker Compose plugin not found."
log "Docker: $(docker --version)"
log "Docker Compose: $(docker compose version)"

# Check .env file
if [ ! -f "$ROOT_DIR/.env" ]; then
  warn ".env file not found. Copying from .env.example..."
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  warn "IMPORTANT: Edit $ROOT_DIR/.env and fill in all required values before proceeding!"
  warn "At minimum, set your domain names and SMTP credentials."
  echo ""
  read -p "Press ENTER after editing .env to continue, or Ctrl+C to abort: "
fi

source "$ROOT_DIR/.env"

# Validate critical variables
[ -z "${POSTGRES_SUPERUSER_PASSWORD:-}" ] && error "POSTGRES_SUPERUSER_PASSWORD is not set in .env"
[ -z "${DOMAIN_MAIN:-}" ] && error "DOMAIN_MAIN is not set in .env"
log ".env file validated"

# =============================================================================
# STEP 2: Generate secure passwords for any unset values
# =============================================================================
header "Step 2: Generating Secure Credentials"

generate_password() {
  openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

generate_hex() {
  openssl rand -hex 32
}

# Auto-generate any missing passwords
ENV_FILE="$ROOT_DIR/.env"
for var in NEO_DB_PASSWORD ODOO_DB_PASSWORD ORANGEHRM_DB_PASSWORD OPENPROJECT_DB_PASSWORD \
           METABASE_DB_PASSWORD OUTLINE_DB_PASSWORD REDIS_PASSWORD MINIO_ROOT_PASSWORD \
           ODOO_ADMIN_PASSWORD ODOO_MASTER_PASSWORD NEO_JWT_SECRET NEO_SESSION_SECRET; do
  if grep -q "CHANGE_ME\|GENERATE_WITH\|your_" "$ENV_FILE" 2>/dev/null; then
    current_val=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2-)
    if [[ "$current_val" == *"CHANGE_ME"* ]] || [[ "$current_val" == *"GENERATE_WITH"* ]]; then
      if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"JWT"* ]]; then
        new_val=$(generate_hex)
      else
        new_val=$(generate_password)
      fi
      sed -i "s|^${var}=.*|${var}=${new_val}|" "$ENV_FILE"
      log "Generated secure value for $var"
    fi
  fi
done

log "All credentials configured"

# =============================================================================
# STEP 3: Create required directories
# =============================================================================
header "Step 3: Creating Directories"

mkdir -p "$ROOT_DIR"/{nginx/ssl,postgres/archive,odoo/addons,rocketchat}
mkdir -p /var/log/odoo

# MongoDB replica set init script for Rocket.Chat
cat > "$ROOT_DIR/rocketchat/mongo-init.js" << 'EOF'
rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }]
});
EOF

log "Directories created"

# =============================================================================
# STEP 4: Update configuration files with actual values from .env
# =============================================================================
header "Step 4: Applying Configuration"

source "$ROOT_DIR/.env"

# Update Odoo config
sed -i "s|ODOO_DB_PASSWORD_PLACEHOLDER|${ODOO_DB_PASSWORD}|g" "$ROOT_DIR/odoo/config/odoo.conf"
sed -i "s|ODOO_ADMIN_PASSWORD_PLACEHOLDER|${ODOO_ADMIN_PASSWORD}|g" "$ROOT_DIR/odoo/config/odoo.conf"
sed -i "s|SMTP_PASSWORD_PLACEHOLDER|${SMTP_PASSWORD:-changeme}|g" "$ROOT_DIR/odoo/config/odoo.conf"

# Update Redis config
sed -i "s|REDIS_PASSWORD_PLACEHOLDER|${REDIS_PASSWORD}|g" "$ROOT_DIR/redis/redis.conf"

# Update Nginx domain names
for domain_var in DOMAIN_MAIN DOMAIN_ODOO DOMAIN_OPENPROJECT DOMAIN_METABASE \
                  DOMAIN_ROCKETCHAT DOMAIN_OUTLINE DOMAIN_MINIO DOMAIN_ORANGEHRM; do
  domain_val="${!domain_var:-yourdomain.com}"
  sed -i "s|${domain_var,,}.yourdomain.com|${domain_val}|g" "$ROOT_DIR/nginx/conf.d/services.conf" 2>/dev/null || true
done

log "Configuration files updated"

# =============================================================================
# STEP 5: Start infrastructure services first
# =============================================================================
header "Step 5: Starting Infrastructure (PostgreSQL + Redis + MinIO)"

cd "$ROOT_DIR"
docker compose up -d postgres redis minio
log "Waiting for PostgreSQL to be ready..."
sleep 15

# Wait for PostgreSQL health
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_SUPERUSER:-gtadmin}" >/dev/null 2>&1; then
    log "PostgreSQL is ready"
    break
  fi
  echo -n "."
  sleep 2
done

# =============================================================================
# STEP 6: Start application services
# =============================================================================
header "Step 6: Starting Application Services"

docker compose up -d odoo openproject orangehrm metabase rocketchat outline
log "Application services starting (this may take 2-3 minutes for first-time initialization)..."
sleep 30

# =============================================================================
# STEP 7: SSL Certificate Setup (Let's Encrypt)
# =============================================================================
header "Step 7: SSL Certificate Setup"

if command -v certbot >/dev/null 2>&1; then
  log "Certbot found. Requesting SSL certificates..."
  DOMAINS=(
    "${DOMAIN_MAIN:-portal.yourdomain.com}"
    "${DOMAIN_ODOO:-erp.yourdomain.com}"
    "${DOMAIN_OPENPROJECT:-pm.yourdomain.com}"
    "${DOMAIN_METABASE:-bi.yourdomain.com}"
    "${DOMAIN_ROCKETCHAT:-chat.yourdomain.com}"
    "${DOMAIN_OUTLINE:-wiki.yourdomain.com}"
    "${DOMAIN_MINIO:-files.yourdomain.com}"
    "${DOMAIN_ORANGEHRM:-hr.yourdomain.com}"
  )
  for domain in "${DOMAINS[@]}"; do
    if [[ "$domain" != *"yourdomain.com"* ]]; then
      certbot certonly --standalone -d "$domain" --non-interactive --agree-tos \
        --email "${SMTP_USER:-admin@yourdomain.com}" --no-eff-email 2>/dev/null || \
        warn "Could not obtain certificate for $domain (DNS may not be configured yet)"
    fi
  done
  # Copy certs to nginx volume
  cp -r /etc/letsencrypt "$ROOT_DIR/nginx/ssl/" 2>/dev/null || true
else
  warn "Certbot not installed. SSL certificates must be configured manually."
  warn "Install with: sudo apt install certbot"
  warn "For testing, self-signed certificates will be used."
  # Generate self-signed cert for testing
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$ROOT_DIR/nginx/ssl/selfsigned.key" \
    -out "$ROOT_DIR/nginx/ssl/selfsigned.crt" \
    -subj "/C=SA/ST=Riyadh/L=Riyadh/O=Golden Team/CN=${DOMAIN_MAIN:-localhost}" 2>/dev/null || true
fi

# =============================================================================
# STEP 8: Start Nginx
# =============================================================================
header "Step 8: Starting Nginx Reverse Proxy"
docker compose up -d nginx
log "Nginx started"

# =============================================================================
# STEP 9: Health checks
# =============================================================================
header "Step 9: Running Health Checks"

sleep 10
HEALTHY=0
UNHEALTHY=0

check_service() {
  local name=$1
  local url=$2
  if curl -sf "$url" >/dev/null 2>&1; then
    log "✓ $name is healthy"
    ((HEALTHY++)) || true
  else
    warn "✗ $name is not yet responding (may still be starting)"
    ((UNHEALTHY++)) || true
  fi
}

check_service "PostgreSQL" "http://localhost:5432" || true
check_service "Redis" "http://localhost:6379" || true
check_service "Odoo" "http://localhost:8069/web/health"
check_service "OpenProject" "http://localhost:8090/health_checks/default"
check_service "Metabase" "http://localhost:3030/api/health"
check_service "Rocket.Chat" "http://localhost:3100/health"
check_service "Outline" "http://localhost:3200/_health"
check_service "MinIO" "http://localhost:9000/minio/health/live"

# =============================================================================
# STEP 10: Print summary
# =============================================================================
header "Deployment Complete!"

echo -e "${BOLD}Access URLs:${NC}"
echo -e "  NEO Portal:    https://${DOMAIN_MAIN:-portal.yourdomain.com}"
echo -e "  Odoo ERP:      https://${DOMAIN_ODOO:-erp.yourdomain.com}"
echo -e "  ASTRA PM:      https://${DOMAIN_OPENPROJECT:-pm.yourdomain.com}"
echo -e "  BI Dashboard:  https://${DOMAIN_METABASE:-bi.yourdomain.com}"
echo -e "  Chat:          https://${DOMAIN_ROCKETCHAT:-chat.yourdomain.com}"
echo -e "  Wiki:          https://${DOMAIN_OUTLINE:-wiki.yourdomain.com}"
echo -e "  Files:         https://${DOMAIN_MINIO:-files.yourdomain.com}"
echo -e "  HR System:     https://${DOMAIN_ORANGEHRM:-hr.yourdomain.com}"
echo ""
echo -e "${BOLD}Credentials are stored in:${NC} $ROOT_DIR/.env"
echo -e "${BOLD}IMPORTANT:${NC} Back up your .env file securely. It contains all passwords."
echo ""
echo -e "${GREEN}Services healthy: $HEALTHY | Services still starting: $UNHEALTHY${NC}"
echo ""
echo "Deployment completed at $(date)"
