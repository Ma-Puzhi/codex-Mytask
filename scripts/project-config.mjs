import { readFileSync } from 'node:fs';

export const defaultSiteOrigin = 'http://localhost:5173';

export function validateSiteOrigin(value) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Use an HTTPS site origin, or HTTP on localhost, without a path or credentials.');
  }
  return url.origin;
}

export function readSiteOrigin() {
  let config = {};
  try {
    config = JSON.parse(readFileSync(new URL('../.mytask/config.json', import.meta.url), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return validateSiteOrigin(config.siteOrigin ?? defaultSiteOrigin);
}
