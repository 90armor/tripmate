#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write|MultiEdit) — formats and lints the file Claude just edited.
# Input: hook event JSON on stdin.
# Exit 0 = nothing to report. Exit 2 = problem in the edited file (stderr is shown to Claude).
#
# Unlike the PreToolUse guards, this hook FAILS OPEN: if jq or the project binaries are missing it
# warns on stderr and exits 0, so a broken toolchain never blocks every edit. Only real problems in
# the edited file (Prettier parse error, ESLint errors/warnings) exit 2.
# Typecheck and tests are deliberately not run here (too slow per edit); see pre-push and CI.

warn() { echo "format-lint: $1 — skipped." >&2; }

if ! command -v jq >/dev/null 2>&1; then
  warn "jq is not installed"
  exit 0
fi

file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

project="${CLAUDE_PROJECT_DIR:-$PWD}"
project=$(realpath "$project" 2>/dev/null) || exit 0
real=$(realpath "$file" 2>/dev/null) || exit 0 # also covers a file that no longer exists

# Only files inside the project.
case "$real" in
  "$project"/*) ;;
  *) exit 0 ;;
esac

# Never touch real .env files (defence in depth next to guard-env.sh).
case "$(basename -- "$real")" in
  .env | .env.* ) exit 0 ;;
esac

case "$real" in
  *.ts | *.tsx | *.mjs | *.js) lint=1 ;;
  *.json | *.css) lint=0 ;;
  *) exit 0 ;;
esac

prettier="$project/node_modules/.bin/prettier"
eslint="$project/node_modules/.bin/eslint"
if [ ! -x "$prettier" ] || [ ! -x "$eslint" ]; then
  warn "prettier/eslint not found in node_modules (run pnpm install)"
  exit 0
fi

cd "$project" || exit 0

# 1) Format. A parse error means the edit left invalid syntax, so tell Claude.
if ! out=$("$prettier" --write --ignore-unknown "$real" 2>&1); then
  echo "Prettier could not format $file (syntax error?):" >&2
  echo "$out" >&2
  exit 2
fi

# 2) Lint. Same policy as `pnpm lint`: errors and warnings both fail.
if [ "$lint" -eq 1 ]; then
  out=$("$eslint" --no-warn-ignored --max-warnings=0 "$real" 2>&1)
  status=$?
  case "$status" in
    0) ;;
    1)
      echo "ESLint found problems in $file (fix them before continuing):" >&2
      echo "$out" >&2
      exit 2
      ;;
    *)
      warn "ESLint failed to run (exit $status): $out"
      exit 0
      ;;
  esac
fi

exit 0
