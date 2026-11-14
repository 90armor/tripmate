#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash|Edit|Write|MultiEdit|NotebookEdit) — keeps `main` agent-proof.
# Input: hook event JSON on stdin. Exit 2 = block (stderr is shown to Claude). Exit 0 = allow.
# (Exit 1 does NOT block.) Policy: CLAUDE.md > Git workflow, ROADMAP D21.
#
# WHAT IT BLOCKS
#   On main/master : Edit/Write/MultiEdit/NotebookEdit of files inside this repo, and Bash
#                    `git` commit, merge, rebase, push, cherry-pick, revert, am, reset (every form),
#                    update-ref, `branch -f`, and `pull` without --ff-only.
#                    Allowed: pull --ff-only, status, log, diff, show, fetch, switch, branch (list).
#   On any branch  : pushing to main/master (origin main, HEAD:main, +main, --delete origin main),
#                    `git branch -f main`, `git update-ref refs/heads/main`, `gh pr merge`, and
#                    `gh api` calls to pulls/<n>/merge (or the GraphQL mergePullRequest mutations).
#   Files outside the repo (plan file, memory, scratchpad) stay writable so plan mode works on main.
#
# WHAT IT DELIBERATELY DOES NOT COVER — this is a guardrail, not full protection:
#   - File changes made through Bash on main (sed -i, tee, `>` redirects, cp, mv, python, ...).
#     Only the Edit/Write/MultiEdit/NotebookEdit tools are checked.
#   - Obfuscated or indirect commands: `bash -c "..."`, eval, $(...), aliases, wrapper scripts,
#     xargs. It only inspects the literal command text.
#   - Other clones or `git worktree` checkouts. The branch is read from the tool call's `cwd`
#     only; `cd elsewhere && git ...` and `git -C elsewhere ...` are not followed.
#   - Other ways to move local main: `git checkout -B main`, `git switch -C main`, `git branch -m`,
#     `git fetch origin x:main`, `git stash`, `git tag`.
#   - A bare `git push` on a feature branch whose upstream is main (push.default / tracking).
#   - Merging through other routes: curl/API with a token, the GitHub web UI, `gh` aliases.
#   - A detached HEAD is not treated as main.
#   - `git commit --no-verify`, HUSKY=0 and core.hooksPath are guard-bash.sh's job.
#   Real protection of `main` is GitHub branch protection (owner sets it).
#
# Text-matching limits: a compound `git switch -c x && git commit` started from main is blocked
# (switch first, commit in a separate call); an unquoted mention such as `echo git commit` on main
# is a safe-direction false positive.

if ! command -v jq >/dev/null 2>&1; then
  echo "block-main: jq is not installed, so tool calls cannot be checked. Ask the owner to install jq." >&2
  exit 2
fi

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")
cmd=$(jq -r '.tool_input.command // empty' <<<"$input")
file=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")
cwd=$(jq -r '.cwd // empty' <<<"$input")
[ -z "$cwd" ] && cwd="${CLAUDE_PROJECT_DIR:-$PWD}"

# Empty when detached or when cwd is not a git repo: treated as "not main".
branch=$(git -C "$cwd" branch --show-current 2>/dev/null)
on_main=0
case "$branch" in main | master) on_main=1 ;; esac

block() {
  echo "Blocked by TripMate policy: $1" >&2
  echo "main is protected: agents never change it directly; it moves only via a PR the owner merges." >&2
  echo "Switch to the branch named in the 'Branch:' line of CURRENT_TASK.md (git switch main && git pull --ff-only, then git switch -c <branch>). See CLAUDE.md > Git workflow." >&2
  exit 2
}

# parse_cmd <git|gh> <segment>: finds the tool word (basename match, so `FOO=1 git ...`, `/usr/bin/git`
# and `command git` work), skips its global options, and sets CMD_SUB (subcommand) and CMD_ARGS.
# Quoted mentions such as `echo "git commit"` do not match because the quote stays on the word.
parse_cmd() {
  local tool="$1" seg="$2" i n
  local -a w
  CMD_SUB=""
  CMD_ARGS=()
  read -r -a w <<<"$seg"
  n=${#w[@]}
  for ((i = 0; i < n; i++)); do
    [ "${w[i]##*/}" = "$tool" ] && break
  done
  [ "$i" -ge "$n" ] && return 1
  for ((i++; i < n; )); do
    case "$tool:${w[i]}" in
      git:-C | git:-c | git:--git-dir | git:--work-tree | git:--namespace | git:--exec-path | \
        git:--super-prefix | git:--config-env | gh:-R | gh:--repo)
        i=$((i + 2))
        ;;
      *:-*) i=$((i + 1)) ;;
      *)
        CMD_SUB="${w[i]}"
        CMD_ARGS=("${w[@]:i+1}")
        return 0
        ;;
    esac
  done
  return 1
}

# first_nonopt <args...>: sets FIRST to the first non-option word (skipping -R/--repo values).
first_nonopt() {
  FIRST=""
  while [ $# -gt 0 ]; do
    case "$1" in
      -R | --repo) shift 2 2>/dev/null || shift ;;
      -*) shift ;;
      *)
        FIRST="$1"
        return 0
        ;;
    esac
  done
  return 1
}

main_ref_re='^\+?(refs/heads/)?(main|master)$'
main_dst_re=':(refs/heads/)?(main|master)$'
merge_endpoint_re='pulls/[^/[:space:]]+/merge([^[:alnum:]_-]|$)'

case "$tool" in
  Edit | Write | MultiEdit | NotebookEdit)
    [ "$on_main" -eq 1 ] && [ -n "$file" ] || exit 0
    top=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null) || exit 0
    top=$(realpath "$top" 2>/dev/null) || exit 0

    # Resolve the target even when it does not exist yet: realpath the nearest existing ancestor.
    p="$file"
    case "$p" in /*) ;; *) p="$cwd/$p" ;; esac
    rest=""
    while [ ! -e "$p" ] && [ "$p" != "/" ] && [ "$p" != "." ]; do
      rest="/$(basename -- "$p")$rest"
      p=$(dirname -- "$p")
    done
    real=$(realpath "$p" 2>/dev/null) || exit 0
    real="$real$rest"

    case "$real" in
      "$top" | "$top"/*) block "$tool on a file inside the repo ($file) while on '$branch'." ;;
    esac
    exit 0
    ;;

  Bash)
    [ -z "$cmd" ] && exit 0
    saw_gh_api=0

    # One segment per command (split on newline, ; & | && ||).
    while IFS= read -r seg; do
      if parse_cmd git "$seg"; then
        sub="$CMD_SUB"
        args=("${CMD_ARGS[@]}")

        if [ "$on_main" -eq 1 ]; then
          case "$sub" in
            commit | merge | rebase | push | cherry-pick | revert | am | reset | update-ref)
              block "git $sub while on '$branch'."
              ;;
            branch)
              for a in "${args[@]}"; do
                if [[ "$a" == --force ]] || [[ "$a" =~ ^-[a-zA-Z]*f[a-zA-Z]*$ ]]; then
                  block "git branch -f while on '$branch'."
                fi
              done
              ;;
            pull)
              ff=0
              for a in "${args[@]}"; do [ "$a" = "--ff-only" ] && ff=1; done
              [ "$ff" -eq 1 ] || block "git pull without --ff-only while on '$branch' (use git pull --ff-only)."
              ;;
          esac
        fi

        # Any branch: no push to, and no ref surgery on, main/master.
        case "$sub" in
          push)
            for tok in "${args[@]}"; do
              tok="${tok//\"/}"
              tok="${tok//\'/}"
              case "$tok" in -*) continue ;; esac
              if [[ "$tok" =~ $main_ref_re ]] || [[ "$tok" =~ $main_dst_re ]]; then
                block "pushing to main/master ('$tok') is not allowed; push your feature branch and open a PR."
              fi
            done
            ;;
          branch | update-ref)
            force=0
            [ "$sub" = update-ref ] && force=1
            for a in "${args[@]}"; do
              if [[ "$a" == --force ]] || [[ "$a" =~ ^-[a-zA-Z]*f[a-zA-Z]*$ ]]; then force=1; fi
            done
            if [ "$force" -eq 1 ]; then
              for tok in "${args[@]}"; do
                tok="${tok//\"/}"
                tok="${tok//\'/}"
                if [[ "$tok" =~ $main_ref_re ]]; then
                  block "git $sub on main/master ('$tok') is not allowed."
                fi
              done
            fi
            ;;
        esac
      fi

      # Any branch: the agent never merges PRs.
      if parse_cmd gh "$seg"; then
        case "$CMD_SUB" in
          pr)
            first_nonopt "${CMD_ARGS[@]}"
            [ "$FIRST" = merge ] && block "gh pr merge is not allowed; the owner merges PRs."
            ;;
          api)
            saw_gh_api=1
            for a in "${CMD_ARGS[@]}"; do
              [[ "$a" =~ $merge_endpoint_re ]] && block "gh api call to a pulls/<n>/merge endpoint is not allowed; the owner merges PRs."
            done
            ;;
        esac
      fi
    done < <(printf '%s\n' "$cmd" | sed -E 's/(&&|\|\||;|\||&)/\n/g')

    # GraphQL merge mutations can sit on a different line than `gh api graphql`.
    if [ "$saw_gh_api" -eq 1 ] && printf '%s\n' "$cmd" | grep -Eq 'mergePullRequest|enablePullRequestAutoMerge'; then
      block "gh api GraphQL merge mutation is not allowed; the owner merges PRs."
    fi
    exit 0
    ;;
esac

exit 0
