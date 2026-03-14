#!/bin/bash
# =============================================================================
# Golden Team NEO Platform — Automated Backup Script
# Document: GT-INFRA-001 | Version: 1.0 | March 2026
#
# Schedule with cron: 0 2 * * * /path/to/gt-neo-deploy/scripts/backup.sh
# This creates daily backups at 2:00 AM and uploads to S3/MinIO
# =============================================================================

set -euo pipefail

source "$(dirname "$0")/../.env"

BACKUP_DIR="/var/backups/gt-neo"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] $1"; }

log "Starting backup: $DATE"

# PostgreSQL — dump all databases
log "Backing up PostgreSQL..."
docker exec gt-postgres pg_dumpall -U "${POSTGRES_SUPERUSER:-gtadmin}" | \
  gzip > "$BACKUP_DIR/postgres_full_${DATE}.sql.gz"
log "PostgreSQL backup: $(du -sh "$BACKUP_DIR/postgres_full_${DATE}.sql.gz" | cut -f1)"

# Individual database dumps for faster restore
for db in neo_platform odoo_production orangehrm openproject metabase outline; do
  docker exec gt-postgres pg_dump -U "${POSTGRES_SUPERUSER:-gtadmin}" "$db" | \
    gzip > "$BACKUP_DIR/db_${db}_${DATE}.sql.gz" 2>/dev/null || true
done
log "Individual database backups complete"

# Redis — AOF is continuous, but also dump RDB snapshot
log "Backing up Redis..."
docker exec gt-redis redis-cli -a "${REDIS_PASSWORD}" BGSAVE >/dev/null 2>&1 || true
sleep 5
docker cp gt-redis:/data/dump.rdb "$BACKUP_DIR/redis_${DATE}.rdb" 2>/dev/null || true
log "Redis backup complete"

# Odoo filestore
log "Backing up Odoo filestore..."
docker run --rm \
  --volumes-from gt-odoo \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/odoo_filestore_${DATE}.tar.gz" /var/lib/odoo 2>/dev/null || true
log "Odoo filestore backup complete"

# Upload to S3 (if configured)
if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${BACKUP_AWS_ACCESS_KEY:-}" ]; then
  log "Uploading to S3 bucket: $BACKUP_S3_BUCKET"
  export AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY"
  export AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_KEY"
  for f in "$BACKUP_DIR"/*_${DATE}*; do
    aws s3 cp "$f" "s3://${BACKUP_S3_BUCKET}/$(date +%Y/%m/%d)/$(basename "$f")" \
      --region "${BACKUP_S3_REGION:-me-south-1}" 2>/dev/null || \
      log "WARNING: Failed to upload $(basename "$f") to S3"
  done
  log "S3 upload complete"
fi

# Clean up old local backups
log "Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +$RETENTION_DAYS -delete

log "Backup completed successfully: $DATE"
