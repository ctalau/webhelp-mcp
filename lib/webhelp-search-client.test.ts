import test from 'node:test';
import assert from 'node:assert/strict';
import { WebHelpSearchClient } from './webhelp-search-client';

const WEBHELP_URL = 'https://www.oxygenxml.com/doc/versions/27.1/ug-editor/';

test('search for wsdl and fetch first result', async () => {
  const client = new WebHelpSearchClient();
  const searchResult = await client.search('wsdl', WEBHELP_URL);

  assert.ok(!searchResult.error, searchResult.error);
  assert.ok(searchResult.resultCount > 0, 'expected at least one search result');

  const first = searchResult.results[0];
  assert.ok(first, 'no first result returned');

  const doc = await client.fetchDocumentContent(first.path, WEBHELP_URL);
  const snippet =
    'You can use Oxygen XML Editor to generate detailed documentation for the components ' +
    'of a WSDL document in HTML format.';
  assert.ok(
    doc.text.includes(snippet),
    `document should include snippet: ${snippet}`
  );
});
