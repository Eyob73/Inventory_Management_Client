const DEFAULT_BACKEND_ORIGIN = 'https://trackstack.runasp.net';

export async function proxyRequest(request: Request, env?: { BACKEND_URL?: string }): Promise<Response> {
  const backendOrigin = (env?.BACKEND_URL || DEFAULT_BACKEND_ORIGIN).replace(/\/+$/, '');
  const url = new URL(request.url);

  // Strictly bind to the configured backend origin (prevents open-proxy behavior)
  const targetUrl = new URL(url.pathname + url.search, backendOrigin);

  const headers = new Headers(request.headers);
  const targetHost = new URL(backendOrigin).host;
  headers.set('Host', targetHost);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  // Handle WebSocket upgrade for SignalR
  const isWebSocket = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
  if (isWebSocket) {
    return fetch(targetUrl.toString(), {
      method: request.method,
      headers,
    });
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (hasBody) {
    init.body = request.body;
    // @ts-ignore - duplex is needed by Cloudflare/modern fetch when streaming body
    init.duplex = 'half';
  }

  let response: Response;
  try {
    response = await fetch(targetUrl.toString(), init);
  } catch (err: any) {
    // If backend https fails to connect, try http fallback
    if (backendOrigin.startsWith('https://')) {
      const fallbackOrigin = backendOrigin.replace('https://', 'http://');
      const fallbackUrl = new URL(url.pathname + url.search, fallbackOrigin);
      const fallbackHeaders = new Headers(headers);
      fallbackHeaders.set('Host', new URL(fallbackOrigin).host);
      
      const fallbackInit: RequestInit = {
        ...init,
        headers: fallbackHeaders,
      };

      try {
        response = await fetch(fallbackUrl.toString(), fallbackInit);
      } catch (fallbackErr: any) {
        return new Response(
          JSON.stringify({
            error: 'Backend Unreachable',
            message: `Could not connect to backend at ${backendOrigin} or ${fallbackOrigin}: ${fallbackErr?.message || fallbackErr}`,
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          error: 'Backend Unreachable',
          message: `Could not connect to backend at ${backendOrigin}: ${err?.message || err}`,
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Preserve response headers and status
  const responseHeaders = new Headers(response.headers);

  // Ensure cookies set by backend bind properly to the current origin
  const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  if (setCookies && setCookies.length > 0) {
    responseHeaders.delete('Set-Cookie');
    for (const cookie of setCookies) {
      // Remove any explicit domain that matches backend so cookie binds to pages.dev domain
      const cleaned = cookie.replace(/;\s*domain=[^;]+/gi, '');
      responseHeaders.append('Set-Cookie', cleaned);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
