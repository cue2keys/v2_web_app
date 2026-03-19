#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mode="staged"

usage() {
  cat <<'EOF'
Usage: ./tools/format.sh [--check|--all]
EOF
}

die() {
  printf '[format.sh] error: %s\n' "$*" >&2
  exit 1
}

find_node_binary() {
  local candidate=""
  local first=""

  while IFS= read -r candidate; do
    [ -n "$first" ] || first="$candidate"
    case "$candidate" in
      */shims/node)
        continue
        ;;
      *)
        printf '%s\n' "$candidate"
        return 0
        ;;
    esac
  done < <(which -a node 2>/dev/null)

  [ -n "$first" ] || die "node not found"
  printf '%s\n' "$first"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check)
      mode="check"
      shift
      ;;
    --all)
      mode="all"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

cd "$ROOT"

declare -a prettier_files=()

collect_paths() {
  if [ "$mode" = "check" ] || [ "$mode" = "all" ]; then
    git ls-files
    return 0
  fi

  git diff --cached --name-only --diff-filter=ACMR
}

while IFS= read -r path; do
  case "$path" in
    dist/*|.out/*|node_modules/*|src/generated/*)
      continue
      ;;
    *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.html|*.md|*.yml|*.yaml)
      prettier_files+=("$path")
      ;;
  esac
done < <(collect_paths)

[ "${#prettier_files[@]}" -gt 0 ] || exit 0

prettier_entry="$(find "$ROOT/node_modules/.pnpm" -path '*/prettier/bin/prettier.cjs' -print -quit 2>/dev/null || true)"
[ -n "$prettier_entry" ] || die "prettier not found in $ROOT; run pnpm install first"
node_bin="$(find_node_binary)"

if [ "$mode" = "check" ]; then
  "$node_bin" "$prettier_entry" --check "${prettier_files[@]}"
  exit 0
fi

"$node_bin" "$prettier_entry" --write "${prettier_files[@]}"
if [ "$mode" = "staged" ]; then
  git add -- "${prettier_files[@]}"
fi
