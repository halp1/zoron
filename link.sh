#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <relative_path_inside_routes>"
  exit 1
fi

REL_PATH="$1"

SRC_MAIN="main/src/routes/$REL_PATH"
SRC_PRO="pro/src/routes/$REL_PATH"
DEST="common/lib/routes/$REL_PATH"

# Ensure destination directory exists
mkdir -p "$(dirname "$DEST")"

# Move from main/src to common/lib
if [[ -f "$SRC_MAIN" ]]; then
  echo "Moving $SRC_MAIN → $DEST"
  mv "$SRC_MAIN" "$DEST"
else
  echo "Error: $SRC_MAIN does not exist."
  exit 1
fi

# Remove pro/src copy if exists
if [[ -e "$SRC_PRO" ]]; then
  echo "Removing $SRC_PRO"
  rm -rf "$SRC_PRO"
fi

# Ensure parent dirs for symlinks exist
mkdir -p "$(dirname "$SRC_MAIN")"
mkdir -p "$(dirname "$SRC_PRO")"

# Compute relative symlink targets
REL_MAIN=$(realpath --relative-to="$(dirname "$SRC_MAIN")" "$DEST")
REL_PRO=$(realpath --relative-to="$(dirname "$SRC_PRO")" "$DEST")

# Create symlinks
ln -s "$REL_MAIN" "$SRC_MAIN"
ln -s "$REL_PRO" "$SRC_PRO"

echo "Done. Symlinks created at:"
echo "  $SRC_MAIN -> $REL_MAIN"
echo "  $SRC_PRO -> $REL_PRO"