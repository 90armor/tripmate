#!/usr/bin/env bash
# PreToolUse hook (matcher: Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob)
# Blocks file tools from touching real .env files. `.env.example` stays allowed.
# Input: hook event JSON on stdin. Exit 2 = block. Exit 0 = allow.

if ! command -v jq >/dev/null 2>&1; then
  echo "guard-env: jq is not installed, so file access cannot be checked. Ask the owner to install jq." >&2
  exit 2
fi

input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')

# Collect every path-like field the file tools use.
paths=$(echo "$input" | jq -r '
  .tool_input | [ .file_path?, .notebook_path?, .path?, .pattern?, .glob? ]
  | map(select(type == "string")) | .[]')

is_secret_env() {
  local name
  name=$(basename -- "$1")
  case "$name" in
    .env.example|.env.*.example) return 1 ;;
    .env|.env.*|.env\*|.env\?*) return 0 ;;
  esac
  return 1
}

while IFS= read -r p; do
  [ -z "$p" ] && continue
  if is_secret_env "$p"; then
    echo "Blocked by TripMate policy: '$p' is a real .env file and may contain secrets." >&2
    echo "Use .env.example for variable names. Ask the owner if a real value is needed." >&2
    exit 2
  fi
done <<< "$paths"

# Grep/Glob patterns that explicitly target .env files (e.g. glob ".env*").
glob=$(echo "$input" | jq -r '.tool_input.glob // empty')
if [ "$tool" = "Grep" ] && [[ "$glob" == .env* || "$glob" == */.env* ]] && [[ "$glob" != *example* ]]; then
  echo "Blocked by TripMate policy: searching inside .env files is not allowed." >&2
  exit 2
fi

exit 0
