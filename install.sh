#!/usr/bin/env bash
# Install the Editorial Dark skill for OpenCode, Claude Code, and AGENTS.md tools.
#
#   ./install.sh            # project-local (default)
#   ./install.sh --global   # user-wide, all projects
#
# Safe to re-run: it creates symlinks, never overwrites.

set -euo pipefail

SKILL_ID="editorial-dark"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills/${SKILL_ID}"

[[ -f "${SRC}/SKILL.md" ]] || { echo "error: cannot find ${SRC}/SKILL.md" >&2; exit 1; }

SCOPE="project"
[[ "${1:-}" == "--global" ]] && SCOPE="global"

if [[ "$SCOPE" == "global" ]]; then
  ROOT="${HOME}"
else
  ROOT="$(pwd)"
fi

echo "Installing '${SKILL_ID}' (${SCOPE}) from ${SRC}"
echo "  → ${ROOT}"
echo

# Directory form gives supporting files a private base directory, so the
# agent can resolve references/ and assets/ relative to SKILL.md.
install_link() {
  local target_dir="$1" label="$2"
  mkdir -p "${target_dir}"
  local dest="${target_dir}/${SKILL_ID}"

  if [[ -e "$dest" || -L "$dest" ]]; then
    echo "  [skip] ${label} — already exists"
    return
  fi

  ln -s "$SRC" "$dest"
  echo "  [link] ${label}"
}

# OpenCode reads .claude/skills and .agents/skills as compatibility sources, so
# one directory serves both.
#
# For --global, OpenCode's own documented location is
# ${XDG_CONFIG_HOME:-~/.config}/opencode/skills. ~/.opencode/skills also
# resolves at runtime, but it is not what the docs specify, so prefer the
# documented one.
if [[ "$SCOPE" == "global" ]]; then
  OC_GLOBAL="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills"
else
  OC_GLOBAL="${ROOT}/.opencode/skills"
fi

install_link "${OC_GLOBAL}"            "OpenCode"
install_link "${ROOT}/.claude/skills"  "Claude Code"
install_link "${ROOT}/.agents/skills"  "AGENTS.md tools"

# Optional: make the system discover the reference files without loading the
# skill first. Purely additive; skip with EDITORIAL_DARK_NO_AGENTS=1.
if [[ "${EDITORIAL_DARK_NO_AGENTS:-}" != "1" ]]; then
  if [[ -f "${ROOT}/AGENTS.md" ]]; then
    echo "  [note] AGENTS.md already exists — not modified, add the pointer manually if wanted"
  else
    cat > "${ROOT}/AGENTS.md" <<'EOF'
# Agent instructions

For dark, editorial, motion-heavy frontend work, load the `editorial-dark`
skill before writing CSS. It carries design tokens, a motion architecture, and
accessibility patterns that are cheaper to apply than to reinvent.

Never set a hidden start state (`opacity: 0`) without a `<noscript>` reset, and
never ship a full-screen veil without a failure timeout.
EOF
    echo "  [file] AGENTS.md pointer"
  fi
fi

echo
echo "Done. Verify with:"
echo "  opencode   # then ask the agent to list available skills"
echo
echo "To uninstall, remove the symlinks:"
echo "  rm -rf ${ROOT}/.opencode/skills/${SKILL_ID} \\"
echo "         ${ROOT}/.claude/skills/${SKILL_ID} \\"
echo "         ${ROOT}/.agents/skills/${SKILL_ID}"
echo
echo "The symlinks point at this checkout. Move the repo and they break —"
echo "re-run install.sh, or copy the skills/ directory to its final home."
