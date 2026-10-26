#!/bin/bash
# ─── Database Backup Script ────────────────────────────────────────────────────
# Usage:
#   ./scripts/backup-db.sh                    # backup to ./backups/
#   ./scripts/backup-db.sh /custom/path       # backup to custom path
#   BACKUP_RETENTION_DAYS=7 ./scripts/backup-db.sh  # auto-cleanup after 7 days
#
# Requires: pg_dump (from PostgreSQL client tools)
# ───────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────

BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="enterprise_backup_${TIMESTAMP}"

# Database connection (from env or defaults)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-db_devin}"
DB_USER="${DB_USER:-postgres}"

# ─── Functions ───────────────────────────────────────────────────────────────

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

cleanup_old_backups() {
  log "Cleaning up backups older than ${RETENTION_DAYS} days..."
  find "$BACKUP_DIR" -name "enterprise_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
  local count
  count=$(find "$BACKUP_DIR" -name "enterprise_backup_*.sql.gz" | wc -l)
  log "Remaining backups: ${count}"
}

# ─── Main ────────────────────────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"

log "Starting backup: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
log "Output: ${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"

# Create compressed SQL dump
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip > "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"; then

  SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.sql.gz" | cut -f1)
  log "Backup completed: ${SIZE}"
else
  log "ERROR: Backup failed"
  exit 1
fi

# Cleanup old backups
cleanup_old_backups

log "Done"
