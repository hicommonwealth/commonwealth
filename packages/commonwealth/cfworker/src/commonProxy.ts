export default {
  async fetch(req: Request): Promise<Response> {
    const inUrl = new URL(req.url);

    // Replace hostname so the Host header will be common.xyz
    const outUrl = new URL(req.url);
    const originUrl = new URL('https://common.xyz');
    outUrl.hostname = originUrl.hostname;
    outUrl.protocol = originUrl.protocol;

    const headers = new Headers(req.headers);
    headers.set('Origin', originUrl.origin);
    headers.set('cf-original-host', inUrl.hostname);

    const outbound = new Request(outUrl.toString(), {
      method: req.method,
      headers,
      body: canHaveBody(req.method) ? await req.arrayBuffer() : undefined,
      redirect: 'manual',
    });

    return fetch(outbound, {
      cf: {
        resolveOverride: originUrl.hostname,
      },
    });
  },
};

function canHaveBody(m: string) {
  return !['GET', 'HEAD'].includes(m.toUpperCase());
}
