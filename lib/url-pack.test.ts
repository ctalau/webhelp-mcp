import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeUrls, decodeUrls } from './url-pack';

test('round trip works and input is sorted', () => {
  const input = [
    'https://www.example.com/products/books/non-fiction/sapiens',
    'https://www.example.com/products/electronics/laptops/dell-xps-15',
    'https://www.example.com/about-us/company-history',
  ];

  const encoded = encodeUrls(input);
  const decoded = decodeUrls(encoded);

  const expected = [...input].sort();
  assert.deepEqual(decoded, expected);
});

test('empty input round trips to empty output', () => {
  assert.equal(encodeUrls([]), '');
  assert.deepEqual(decodeUrls(''), []);
});

test('highly similar prefixes yield strong compression', () => {
  const urls = [
    'https://www.example.com/products/electronics/laptops/macbook-pro-16',
    'https://www.example.com/products/electronics/laptops/dell-xps-15',
    'https://www.example.com/products/electronics/smartphones/iphone-15-pro',
    'https://www.example.com/products/electronics/smartphones/google-pixel-8',
    'https://www.example.com/products/books/fiction/the-great-gatsby',
    'https://www.example.com/products/books/non-fiction/sapiens',
    'https://www.example.com/about-us/company-history',
    'https://www.example.com/about-us/careers',
  ];

  const encoded = encodeUrls(urls);
  const decoded = decodeUrls(encoded);
  assert.deepEqual(decoded, [...urls].sort());

  const original = urls.join('\n');
  const ratio = encoded.length / original.length;
  assert.ok(
    ratio < 0.6,
    `expected ratio < 0.6, got ${ratio}`,
  );
});

test('mixed and dissimilar URLs compress only slightly', () => {
  const urls = [
    'https://google.com/search?q=url+compression',
    'https://github.com/google/brotli',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    'https://en.wikipedia.org/wiki/Lempel%E2%80%93Ziv%E2%80%93Welch',
    'https://news.ycombinator.com/',
    'https://www.reddit.com/r/programming/',
  ];

  const encoded = encodeUrls(urls);
  const decoded = decodeUrls(encoded);
  assert.deepEqual(decoded, [...urls].sort());

  const ratio = encoded.length / urls.join('\n').length;
  assert.ok(
    ratio > 0.8 && ratio < 1,
    `expected 0.8 < ratio < 1, got ${ratio}`,
  );
});

test('very long but similar URLs compress strongly', () => {
  const urls = [
    'https://api.cloudservice.com/v1/users/12345/projects/project-alpha/files/main/src/app/components/user-profile.js?token=xyz&session=abc',
    'https://api.cloudservice.com/v1/users/12345/projects/project-alpha/files/main/src/app/components/settings.js?token=xyz&session=abc',
    'https://api.cloudservice.com/v1/users/12345/projects/project-alpha/files/main/src/app/services/auth.js?token=xyz&session=abc',
    'https://api.cloudservice.com/v1/users/12345/projects/project-beta/files/main/src/app/dashboard.js?token=xyz&session=abc',
  ];

  const encoded = encodeUrls(urls);
  const decoded = decodeUrls(encoded);
  assert.deepEqual(decoded, [...urls].sort());

  const ratio = encoded.length / urls.join('\n').length;
  assert.ok(
    ratio < 0.5,
    `expected ratio < 0.5, got ${ratio}`,
  );
});

test('a single URL typically expands slightly', () => {
  const urls = [
    'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers',
  ];
  const encoded = encodeUrls(urls);
  const decoded = decodeUrls(encoded);
  assert.deepEqual(decoded, [...urls]);

  const ratio = encoded.length / urls[0].length;
  assert.ok(
    ratio > 1,
    `expected ratio > 1, got ${ratio}`,
  );
});

