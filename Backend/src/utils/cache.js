/** Minimal in-memory TTL cache to avoid hammering third-party APIs. */
export const createCache = (ttlMs, maxEntries = 500) => {
  const store = new Map();
  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (hit.expires < Date.now()) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      if (store.size >= maxEntries) store.delete(store.keys().next().value);
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    },
  };
};

/** fetch() with a timeout that throws a readable error for upstream failures. */
export const fetchJson = async (url, { timeoutMs = 10000, service = 'upstream', ...options } = {}) => {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const reason = error.name === 'TimeoutError' ? 'timed out' : 'is unreachable';
    const err = new Error(`${service} ${reason}`);
    err.statusCode = 502;
    throw err;
  }
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const err = new Error(`${service} error (${response.status}): ${body?.message || body?.reason || response.statusText}`);
    err.statusCode = response.status === 401 || response.status === 403 ? 503 : 502;
    err.upstreamStatus = response.status;
    throw err;
  }
  return body;
};
