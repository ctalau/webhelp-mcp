import { deflateSync, inflateSync } from 'zlib';

/**
 * Encode an array of URLs into a compressed, URL-safe string.
 * Steps:
 * 1. Sort URLs alphabetically to maximise prefix similarity.
 * 2. Prefix-diff each URL against the previous one and join with newlines.
 * 3. Deflate the diff string using zlib.
 * 4. Base64url encode the binary result.
 */
export function encodeUrls(urls: string[]): string {
  if (!urls || urls.length === 0) return '';

  const sorted = [...urls].sort();
  const diffs: string[] = [];
  let last = '';

  for (const url of sorted) {
    if (!last) {
      diffs.push(url);
    } else {
      let i = 0;
      const minLen = Math.min(url.length, last.length);
      while (i < minLen && url[i] === last[i]) i++;
      const suffix = url.slice(i);
      diffs.push(`${i}|${suffix}`);
    }
    last = url;
  }

  const joined = diffs.join('\n');
  const compressed = deflateSync(joined);
  return base64urlEncode(compressed);
}

/** Decode a string produced by {@link encodeUrls}. */
export function decodeUrls(encoded: string): string[] {
  if (!encoded) return [];
  const decoded = base64urlDecode(encoded);
  const joined = inflateSync(decoded).toString();
  const diffs = joined.split('\n');

  const urls: string[] = [];
  let last = '';
  for (const diff of diffs) {
    const sepIndex = diff.indexOf('|');
    if (sepIndex > -1) {
      const prefixLen = parseInt(diff.slice(0, sepIndex), 10);
      if (!isNaN(prefixLen)) {
        const prefix = last.slice(0, prefixLen);
        const url = prefix + diff.slice(sepIndex + 1);
        urls.push(url);
        last = url;
        continue;
      }
    }
    urls.push(diff);
    last = diff;
  }
  return urls;
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64urlDecode(str: string): Buffer {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  return Buffer.from(b64, 'base64');
}
