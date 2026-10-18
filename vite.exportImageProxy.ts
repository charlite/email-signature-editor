import type { Plugin } from 'vite';

/** Dev-only mirror of `worker/index.ts` `/api/export-image` for `bun dev`. */
export function exportImageProxyPlugin(): Plugin {
  return {
    name: 'export-image-proxy',
    configureServer(server) {
      server.middlewares.use('/api/export-image', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
          });
          res.end();
          return;
        }

        if (req.method !== 'GET') {
          res.writeHead(405);
          res.end('Method not allowed');
          return;
        }

        const requestUrl = new URL(req.url ?? '', 'http://localhost');
        const imageUrl = requestUrl.searchParams.get('url');
        if (!imageUrl) {
          res.writeHead(400);
          res.end('Missing url');
          return;
        }

        try {
          const target = new URL(imageUrl);
          if (target.protocol !== 'http:' && target.protocol !== 'https:') {
            res.writeHead(400);
            res.end('Invalid url');
            return;
          }

          const upstream = await fetch(target.href, {
            headers: { Accept: 'image/*' },
            redirect: 'follow',
          });

          if (!upstream.ok) {
            res.writeHead(upstream.status);
            res.end('Upstream error');
            return;
          }

          const buffer = Buffer.from(await upstream.arrayBuffer());
          res.writeHead(200, {
            'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          });
          res.end(buffer);
        } catch {
          res.writeHead(502);
          res.end('Bad gateway');
        }
      });
    },
  };
}
