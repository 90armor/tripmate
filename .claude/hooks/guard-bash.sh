#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash) — blocks destructive or secret-leaking shell commands.
# Input: hook event JSON on stdin. Exit 2 = block (stderr is shown to Claude). Exit 0 = allow.

if ! command -v jq >/dev/null 2>&1; then
  echo "guard-bash: jq is not installed, so commands cannot be checked. Ask the owner to install jq." >&2
  exit 2
fi

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

block() {
  echo "Blocked by TripMate policy: $1" >&2
  echo "Command: $cmd" >&2
  echo "If this is genuinely needed, explain why and ask the owner to run it manually." >&2
  exit 2
}

# --- Privilege escalation --------------------------------------------------
echo "$cmd" | grep -Eq '(^|[;&|[:space:]])sudo[[:space:]]' && block "sudo is not allowed."

# --- Git history / working tree destruction --------------------------------
echo "$cmd" | grep -Eq 'git[[:space:]]+push[^;&|]*([[:space:]]-f([[:space:]]|$)|--force)' \
  && block "force push is not allowed."
echo "$cmd" | grep -Eq 'git[[:space:]]+reset[^;&|]*--hard' && block "git reset --hard discards work."
echo "$cmd" | grep -Eq 'git[[:space:]]+clean[^;&|]*-[a-zA-Z]*f' && block "git clean -f deletes untracked files."
echo "$cmd" | grep -Eq 'git[[:space:]]+(checkout|restore)[[:space:]]+(--[[:space:]]+)?\.([[:space:]]|$)' \
  && block "discarding all working-tree changes is not allowed."
echo "$cmd" | grep -Eq 'git[[:space:]]+branch[^;&|]*[[:space:]]-D' && block "force-deleting branches is not allowed."

# --- Database --------------------------------------------------------------
echo "$cmd" | grep -Eq 'drizzle-kit[[:space:]]+(push|drop)' \
  && block "schema changes must go through generated, committed migrations (no drizzle-kit push/drop)."
echo "$cmd" | grep -Eiq 'drop[[:space:]]+(database|schema|table)' && block "DROP DATABASE/SCHEMA/TABLE."
echo "$cmd" | grep -Eiq 'truncate[[:space:]]+(table[[:space:]]+)?[a-z_"]' && block "TRUNCATE."
echo "$cmd" | grep -Eq '(^|[;&|[:space:]])dropdb[[:space:]]' && block "dropdb."

# --- Docker volumes (local database data) ----------------------------------
echo "$cmd" | grep -Eq 'docker[[:space:]]+(volume[[:space:]]+(rm|prune)|system[[:space:]]+prune)' \
  && block "removing Docker volumes deletes local database data."
echo "$cmd" | grep -Eq 'docker([[:space:]]+|-)compose[^;&|]*down[^;&|]*(-v([[:space:]]|$)|--volumes)' \
  && block "docker compose down -v deletes local database data."

# --- rm -r / rm -rf outside build and cache folders ------------------------
# Split on ; && || | and inspect each rm segment.
safe_target='^(\./)?(node_modules|\.next|dist|build|out|coverage|test-results|playwright-report|blob-report|\.turbo|\.cache|tsconfig\.tsbuildinfo)/?$'
while IFS= read -r seg; do
  seg="${seg#"${seg%%[![:space:]]*}"}"
  case "$seg" in
    rm\ *|*/rm\ *) ;;
    *) continue ;;
  esac
  recursive=0
  targets=()
  # shellcheck disable=SC2086
  set -f; for word in $seg; do
    case "$word" in
      rm|*/rm) ;;
      --recursive) recursive=1 ;;
      --*) ;;
      -*) [[ "$word" == *[rR]* ]] && recursive=1 ;;
      *) targets+=("$word") ;;
    esac
  done; set +f
  [ "$recursive" -eq 0 ] && continue
  [ "${#targets[@]}" -eq 0 ] && continue
  for t in "${targets[@]}"; do
    t="${t%\"}"; t="${t#\"}"; t="${t%\'}"; t="${t#\'}"
    if ! [[ "$t" =~ $safe_target ]]; then
      block "recursive rm is only allowed on build/cache folders (node_modules, .next, dist, coverage, test-results, playwright-report, ...). Target: '$t'"
    fi
  done
done < <(echo "$cmd" | sed -E 's/(\&\&|\|\||;|\|)/\n/g')

# Read-only git path queries are allowed only when the whole command is a single line
# made of plain path characters (no $, backticks, parentheses, quotes, or chaining).
if [[ "$cmd" != *$'\n'* ]] && [[ "$cmd" =~ ^[[:space:]]*git[[:space:]]+(check-ignore|ls-files)([[:space:]]+[A-Za-z0-9._/@:=+-]+)*[[:space:]]*$ ]]; then
  exit 0
fi
# --- Real .env files (secrets) ---------------------------------------------
# Allowed: anything mentioning only .env.example, and the setup copy `cp .env.example .env[.local]`.
if echo "$cmd" | grep -Eq '^[[:space:]]*cp([[:space:]]+-n)?[[:space:]]+\.env\.example[[:space:]]+\.env(\.local)?[[:space:]]*$'; then
  exit 0
fi
stripped=$(echo "$cmd" | sed -E 's/\.env\.example//g')
if echo "$stripped" | grep -Eq '(^|[[:space:]/"'"'"'=<>(])\.env(\.[A-Za-z0-9_-]+)?([[:space:]"'"'"';|&>)]|$)'; then
  block "real .env files may contain secrets. Use .env.example, or ask the owner."
fi
echo "$cmd" | grep -Eq '(^|[;&|[:space:]])(printenv|env)([[:space:]]*($|[;&|]))' \
  && block "dumping the environment can leak secrets."

exit 0
