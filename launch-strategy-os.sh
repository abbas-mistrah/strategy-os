#!/usr/bin/env bash
# STRATEGY OS — lanceur macOS / Linux (équivalent de launch-strategy-os.ps1).
# Démarre le serveur local en arrière-plan s'il ne tourne pas déjà,
# attend /api/health puis ouvre l'application dans le navigateur.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4310}"
HEALTH_URL="http://${HOST}:${PORT}/api/health"
APP_URL="http://${HOST}:${PORT}/#command"
LOG_FILE="${PROJECT_ROOT}/data/server.log"

is_running() {
  curl -fsS --max-time 1 "$HEALTH_URL" >/dev/null 2>&1
}

if ! command -v node >/dev/null 2>&1; then
  echo "STRATEGY OS : Node.js est introuvable. Installez Node.js 22.5 ou supérieur." >&2
  exit 1
fi

NODE_VERSION="$(node -p 'process.versions.node')"
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=5)?0:1)'; then
  echo "STRATEGY OS : Node.js ${NODE_VERSION} détecté, la version 22.5 ou supérieure est requise (node:sqlite)." >&2
  exit 1
fi

if ! is_running; then
  mkdir -p "${PROJECT_ROOT}/data"
  (cd "$PROJECT_ROOT" && HOST="$HOST" PORT="$PORT" nohup node server.js >>"$LOG_FILE" 2>&1 &)
  for _ in $(seq 1 24); do
    sleep 0.25
    if is_running; then break; fi
  done
fi

if ! is_running; then
  echo "STRATEGY OS n'a pas pu démarrer. Consultez ${LOG_FILE}." >&2
  exit 1
fi

echo "STRATEGY OS est prêt : ${APP_URL}"
if [[ "${STRATEGY_OS_NO_BROWSER:-0}" == "1" ]]; then
  exit 0
fi
case "$(uname -s)" in
  Darwin) open "$APP_URL" ;;
  Linux) command -v xdg-open >/dev/null 2>&1 && xdg-open "$APP_URL" >/dev/null 2>&1 || true ;;
esac
