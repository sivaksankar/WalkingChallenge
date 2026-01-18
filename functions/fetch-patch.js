// functions/fetch-patch.js
// Patch global fetch to route internal API calls to local Next.js server
const origFetch = globalThis.fetch;
if (typeof origFetch === 'function') {
  globalThis.fetch = async function (resource, init) {
    try {
      let url = null;
      if (typeof resource === 'string' || resource instanceof String) {
        url = new URL(resource);
      } else if (resource && resource.url) {
        url = new URL(resource.url);
      }

      if (url && url.hostname === 'walking-challenge-cd6dd.web.app' && url.pathname.startsWith('/api/')) {
        const port = process.env.NEXT_INTERNAL_PORT || '8081';
        url.hostname = '127.0.0.1';
        url.port = port;
        url.protocol = 'http:';
        const newResource = typeof resource === 'string' ? url.toString() : new Request(url.toString(), resource);
        return origFetch.call(this, newResource, init);
      }
    } catch (e) {
      // if parsing fails, fallback to original fetch
    }
    return origFetch.call(this, resource, init);
  };
}
