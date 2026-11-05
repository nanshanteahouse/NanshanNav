#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/../.."
for candidate in deploy/nginx/nginx.conf deploy/nginx/conf.d/nav.conf deploy/authelia/config/configuration.yml deploy/authelia/config/users.yml deploy/scripts/render-auth-config.mjs deploy/docker/docker-compose.authelia.yml deploy/docker/authelia.env.example public/theme.js; do
    test -f "$candidate" || { echo "Missing deployment file: $candidate" >&2; exit 1; }
done
if rg -n 'NODE_TLS_REJECT_UNAUTHORIZED[:=] ?["\x27]?0' deploy/docker deploy/systemd deploy/scripts/start.sh; then
    echo 'Unsafe global TLS setting in deployment' >&2
    exit 1
fi
if rg -n -g '!check-deploy.sh' 'NAV_ADMIN_TOKEN|NAV_GATEWAY_SECRET|X-Nav-(Gateway-Key|User|Groups)' deploy .env.example; then
    echo 'Obsolete application authentication contract in deployment' >&2
    exit 1
fi
rg -q '\.\./nginx/nginx.conf' deploy/docker/docker-compose.authelia.yml
rg -q '\.\./authelia/config' deploy/docker/docker-compose.authelia.yml
rg -q 'COPY public/ public/' deploy/docker/Dockerfile
rg -q 'COPY server/index.ts server/app.ts server/' deploy/docker/Dockerfile
rg -q 'api/authz/auth-request' deploy/nginx/conf.d/nav.conf
rg -q 'storage:' deploy/authelia/config/configuration.yml
node --test deploy/scripts/render-auth-config.test.mjs
if command -v docker >/dev/null 2>&1; then
    docker compose -f deploy/docker/docker-compose.yml config --quiet
    NAV_PUBLIC_URL=https://nav.example.com NAV_DOMAIN=nav.example.com JWT_SECRET=placeholder SESSION_SECRET=placeholder STORAGE_ENCRYPTION_KEY=placeholder AUTHELIA_EMAIL=admin@example.com AUTHELIA_PASSWORD=placeholder docker compose -f deploy/docker/docker-compose.authelia.yml config --quiet
else
    echo 'Docker unavailable: Compose runtime/config checks skipped'
fi
echo 'Deployment path and security checks passed'
