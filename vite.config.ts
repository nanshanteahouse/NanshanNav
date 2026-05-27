import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import httpProxy from 'http-proxy'
import type { IncomingMessage, ServerResponse } from 'node:http'

const DEFAULT_TARGET = 'https://pve.lan:8006'

function pveProxyPlugin(): Plugin {
  return {
    name: 'pve-proxy',
    configureServer(server) {
      const proxy = httpProxy.createProxyServer({
        secure: false,
        changeOrigin: true,
      })

      proxy.on('proxyReq', (proxyReq, req) => {
        const token =
          (req.headers['x-pve-token'] as string) ||
          process.env.VITE_PVE_API_TOKEN
        if (token) {
          proxyReq.setHeader('Authorization', `PVEAPIToken=${token}`)
        }
      })

      proxy.on('error', (err: Error, _req: IncomingMessage, res: ServerResponse | NodeJS.Socket) => {
        if (res && 'writeHead' in res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            error: 'Bad Gateway',
            detail: err.message || 'Cannot reach PVE host. Check Proxmox Host setting.',
          }))
        }
      })

      server.middlewares.use('/api/pve', (req: IncomingMessage, res: ServerResponse) => {
        const host = req.headers['x-pve-host'] as string | undefined
        let target = DEFAULT_TARGET

        if (host) {
          target = host.startsWith('http') ? host : `https://${host}`
        }

        req.url = '/api2/json' + req.url

        proxy.web(req, res, { target }, (err: Error) => {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Bad Gateway', detail: err?.message ?? 'Proxy failure' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pveProxyPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api/upload': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
