#!/usr/bin/env bash
#
# install.sh — set Forge up on Kali (or any Debian-based Linux).
#
# Read this before running it. It is short on purpose, and every step is one you
# could type yourself:
#   1. check node, npm and python3 exist
#   2. npm install          (downloads dependencies, including Electron ~180MB)
#   3. npm run build        (compiles the React UI into dist/)
#   4. install a launcher   (a .desktop file, so Forge appears in your menu)
#
# It installs nothing system-wide and touches nothing outside this folder and
# ~/.local/share/applications.

set -euo pipefail                     # the safety line from the bash lesson

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$APPS_DIR/forge.desktop"

say()  { printf '\033[36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[!]\033[0m %s\n' "$*"; }
die()  { printf '\033[31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

# --- 1. prerequisites -------------------------------------------------------

say "Checking prerequisites"

if ! command -v node >/dev/null 2>&1; then
  die "node is not installed. On Kali:  sudo apt update && sudo apt install -y nodejs npm"
fi
if ! command -v npm >/dev/null 2>&1; then
  die "npm is not installed. On Kali:  sudo apt install -y npm"
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 18 )); then
  die "Node $NODE_MAJOR is too old — Forge needs 18 or newer. Try nvm, or apt install nodejs from a newer source."
fi
say "node $(node -v), npm $(npm -v)"

if command -v python3 >/dev/null 2>&1; then
  say "python3 $(python3 -V 2>&1 | cut -d' ' -f2)"
else
  warn "python3 not found — the Python track will not run until you install it (sudo apt install -y python3)"
fi

# --- 2. dependencies --------------------------------------------------------

say "Installing dependencies (this downloads Electron, ~180MB, once)"
cd "$HERE"
npm install

# --- 3. build the UI --------------------------------------------------------

say "Building the interface"
npm run build

# --- 4. desktop launcher ----------------------------------------------------

say "Installing the menu entry"
mkdir -p "$APPS_DIR"

# Exec uses an absolute path because .desktop files are launched with an
# unpredictable working directory — the same absolute-vs-relative lesson as
# always, in a place that surprises people.
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Forge
GenericName=Learn Kali, Python, JavaScript and React
Comment=Interactive lessons that run and check your code
Exec=$HERE/forge
Icon=$HERE/assets/icon.png
Terminal=false
Categories=Development;Education;
Keywords=python;javascript;node;react;kali;linux;learning;
EOF

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
fi

chmod +x "$HERE/forge"

echo
say "Done."
echo
echo "  Launch it from your application menu, or run:  $HERE/forge"
echo "  Verify the curriculum any time with:           npm test"
echo
echo "  Your sandbox lab lives at ~/.forge/workspace and progress at ~/.forge/progress.json."
