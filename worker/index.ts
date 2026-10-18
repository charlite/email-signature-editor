interface Env {
  ASSETS: Fetcher;
}

async function proxyExportImage(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');
  if (!imageUrl) {
    return new Response('Missing url', { status: 400 });
  }

  try {
    const target = new URL(imageUrl);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return new Response('Invalid url', { status: 400 });
    }

    const upstream = await fetch(target.href, {
      headers: { Accept: 'image/*' },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return new Response('Upstream error', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png';

    return new Response(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Bad gateway', { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/export-image') {
      return proxyExportImage(request);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
