const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

export function resolveMediaUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^(data|blob):/i.test(raw)) return raw;

  if (typeof window === 'undefined') return raw;

  if (raw.startsWith('//')) {
    return `${window.location.protocol}${raw}`;
  }

  try {
    const url = new URL(raw);
    if (LOCAL_HOSTS.has(url.hostname)) {
      url.hostname = window.location.hostname;
      if (window.location.protocol === 'https:' && url.protocol === 'http:') {
        url.protocol = 'https:';
      }
      return url.toString();
    }
    return raw;
  } catch {
    if (raw.startsWith('/')) return raw;
    return raw;
  }
}
