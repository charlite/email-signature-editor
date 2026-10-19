import type { Plugin } from 'vite';
import { proxyExportImage } from './functions/_lib/exportImageProxy';

/** Dev-only mirror of the Pages Function `functions/api/export-image.ts`. */
export function exportImageProxyPlugin(): Plugin {
  return {
    name: 'export-image-proxy',
    configureServer(server) {
      server.middlewares.use('/api/export-image', async (req, res) => {
        const request = new Request(
          new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`),
          { method: req.method ?? 'GET' }
        );
        const response = await proxyExportImage(request);
        res.writeHead(
          response.status,
          Object.fromEntries(response.headers.entries())
        );
        if (response.body) {
          const buffer = Buffer.from(await response.arrayBuffer());
          res.end(buffer);
        } else {
          res.end();
        }
      });
    },
  };
}
