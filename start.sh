#!/usr/bin/env bash
# =============================================================================
# NanshanNav — Development Server Startup Script
#
# Start both frontend (Vite) and backend (Hono) with configurable ports.
#
# Usage:
#   ./start.sh                                    # use defaults
#   ./start.sh --frontend-port 8080               # custom frontend port
#   ./start.sh --backend-port 4000                # custom backend port
#   ./start.sh -f 8080 -b 4000                    # short flags
#
#   # Or set env vars before running (works outside the script too):
#   FRONTEND_PORT=8080 BACKEND_PORT=4000 ./start.sh
#
# Defaults:
#   Frontend: 5173   (env: FRONTEND_PORT)
#   Backend:  3001   (env: BACKEND_PORT)
# =============================================================================

set -euo pipefail

# ---- Defaults (from env or built-in) ----
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-3001}"

# ---- Parse CLI args (override env vars) ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--frontend-port)
      FRONTEND_PORT="$2"
      shift 2
      ;;
    -b|--backend-port)
      BACKEND_PORT="$2"
      shift 2
      ;;
    -h|--help)
      echo "NanshanNav — Development Server"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -f, --frontend-port PORT   Frontend dev server port (default: 5173, env: FRONTEND_PORT)"
      echo "  -b, --backend-port PORT    Backend API server port  (default: 3001, env: BACKEND_PORT)"
      echo "  -h, --help                 Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0"
      echo "  $0 --frontend-port 8080 --backend-port 4000"
      echo "  FRONTEND_PORT=8080 BACKEND_PORT=4000 $0"
      exit 0
      ;;
    *)
      echo "Error: Unknown option '$1'"
      echo "Usage: $0 [--frontend-port PORT] [--backend-port PORT] [--help]"
      exit 1
      ;;
  esac
done

# ---- Export for vite.config.ts to pick up ----
export BACKEND_PORT
export FRONTEND_PORT

# ---- Validate ports ----
for var_name in "FRONTEND_PORT" "BACKEND_PORT"; do
  val="${!var_name}"
  if ! [[ "$val" =~ ^[0-9]+$ ]] || [ "$val" -lt 1024 ] || [ "$val" -gt 65535 ]; then
    echo "Error: $var_name=$val is not a valid port (1024-65535)"
    exit 1
  fi
done

# ---- Print startup info ----
echo "=========================================="
echo "  NanshanNav Development Server"
echo "=========================================="
echo "  Frontend:  http://localhost:${FRONTEND_PORT}"
echo "  Backend:   http://localhost:${BACKEND_PORT}"
echo "  Proxy:     /api/* → backend:${BACKEND_PORT}"
echo "=========================================="
echo ""

# ---- Cleanup handler ----
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo "Done."
}
trap cleanup SIGINT SIGTERM

# ---- Start backend (Hono) ----
NODE_TLS_REJECT_UNAUTHORIZED=0 tsx watch server/index.ts &
BACKEND_PID=$!

# ---- Start frontend (Vite) ----
NODE_OPTIONS='--no-deprecation' vite --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

# ---- Wait for either process to exit ----
wait
