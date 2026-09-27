#!/bin/bash
# Wrapper to run scripts/backup.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/scripts/backup.sh" "$@"
