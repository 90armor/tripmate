#!/usr/bin/env bash
# Kebab-case file-name check (ROADMAP D20). Called by .husky/pre-commit.
#
# Input : NUL-delimited repo-relative paths on stdin
#         (pre-commit feeds `git diff --cached --name-only -z -M --diff-filter=AR`).
# Output: exit 0 when every path is fine, exit 1 and a list of offenders otherwise.
#
# Scope : paths under src/ and e2e/. Every segment (each directory and the file name) is checked.
# Exempt: src/db/migrations/** (Drizzle generates names like 0002_some_name.sql, meta/_journal.json).

kebab='[a-z0-9]+(-[a-z0-9]+)*'
# Dynamic route params become JS identifiers (params.tripId), so camelCase is allowed inside [].
param='[a-z][A-Za-z0-9]*(-[a-z0-9]+)*'

dir_re="^(${kebab}"
dir_re+="|_${kebab}"                                        # _private
dir_re+="|@${kebab}"                                        # @slot
dir_re+="|\\(${kebab}\\)"                                   # (group)
dir_re+="|\\[${param}\\]"                                   # [param]
dir_re+="|\\[\\.\\.\\.${param}\\]"                          # [...param]
dir_re+="|\\[\\[\\.\\.\\.${param}\\]\\]"                    # [[...param]]
dir_re+="|(\\(\\.{1,3}\\))+${kebab}"                        # (.)x (..)x (...)x
dir_re+=")$"

# kebab stem (or _private stem) + optional .test/.int.test/.spec/.config/.d + extension
file_re="^_?${kebab}(\\.(int\\.test|test|spec|config|d))?\\.[a-z0-9]+$"

bad=()
while IFS= read -r -d '' path; do
  case "$path" in
    src/db/migrations/*) continue ;;
    src/* | e2e/*) ;;
    *) continue ;;
  esac

  IFS='/' read -r -a segments <<<"$path"
  last=$((${#segments[@]} - 1))
  for i in "${!segments[@]}"; do
    seg="${segments[$i]}"
    if [ "$i" -eq "$last" ]; then
      [[ "$seg" =~ $file_re ]] || {
        bad+=("$path  (file name '$seg')")
        break
      }
    elif [ "$i" -gt 0 ]; then # segment 0 is always src or e2e (see the case above)
      [[ "$seg" =~ $dir_re ]] || {
        bad+=("$path  (directory '$seg')")
        break
      }
    fi
  done
done

if [ "${#bad[@]}" -gt 0 ]; then
  echo "File-name check failed (kebab-case required under src/ and e2e/, ROADMAP D20):" >&2
  printf '  %s\n' "${bad[@]}" >&2
  echo "Rename the file/directory, or ask the owner if it is a genuine exception." >&2
  exit 1
fi
exit 0
