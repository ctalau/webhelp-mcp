import test from 'node:test';
import assert from 'node:assert/strict';
import { WebHelpSearchClient } from './webhelp-search-client';

const WEBHELP_URL = 'https://www.oxygenxml.com/doc/versions/27.1/ug-editor/';
const WEBHELP_URL2 = 'https://www.oxygenxml.com/doc/versions/27.1/ug-author/';

test('search for wsdl and fetch first result', async () => {
  const client = new WebHelpSearchClient(WEBHELP_URL);
  const searchResult = await client.search('wsdl');

  assert.ok(!searchResult.error, searchResult.error);
  assert.ok(searchResult.results.length > 0, 'expected at least one search result');

  const first = searchResult.results[0];
  assert.ok(first, 'no first result returned');

  assert.ok(first.url.startsWith(WEBHELP_URL));

  const doc = await client.fetchDocumentContent(first.id);
  assert.ok(
    doc.text.toLowerCase().includes('wsdl'),
    'document should include the search term'
  );
});

test('search across multiple indexes', async () => {
  const client = new WebHelpSearchClient([WEBHELP_URL, WEBHELP_URL2]);
  const result = await client.search('XML');

  assert.ok(result.results.length > 0, 'expected search results');
  const hasEditor = result.results.some(r => r.url.startsWith(WEBHELP_URL));
  const hasAuthor = result.results.some(r => r.url.startsWith(WEBHELP_URL2));
  assert.ok(hasEditor && hasAuthor, 'results should include both base URLs');
});

test('semantic search returns results', async () => {
  const client = new WebHelpSearchClient(WEBHELP_URL);
  const result = await client.semanticSearch('wsdl', WEBHELP_URL);
  assert.ok(result.results.length > 0, 'expected semantic search results');
  const first = result.results[0];
  assert.ok(first.url.startsWith(WEBHELP_URL));
});

test('constructor requires base URLs', () => {
  assert.throws(() => new WebHelpSearchClient(), /No base URL provided/);
});
