#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="local"
ARTIFACT_DIR=""

usage() {
  cat <<'EOF'
Usage: v2_web_app/tools/build-local.sh [options]

Options:
  --ci
  --artifact-dir <path>
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --ci)
      MODE="ci"
      shift
      ;;
    --artifact-dir)
      ARTIFACT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

cd "$ROOT"
if command -v corepack >/dev/null 2>&1; then
  corepack enable
fi

if [ "$MODE" = "ci" ]; then
  export CI=true
fi

if [ "$MODE" = "ci" ] || [ ! -d node_modules ]; then
  pnpm install --frozen-lockfile
fi

pnpm build

if [ -n "$ARTIFACT_DIR" ]; then
  rm -rf "$ARTIFACT_DIR"
  mkdir -p "$ARTIFACT_DIR"
  rsync -a --delete dist/ "$ARTIFACT_DIR"/
fi
