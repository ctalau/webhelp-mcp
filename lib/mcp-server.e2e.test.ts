import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';
import { encodeUrls } from './url-pack';

const WEBHELP_ENDPOINT = 'www.oxygenxml.com/doc/versions/27.1/ug-editor';
const WEBHELP_URL = 'https://www.oxygenxml.com/doc/versions/27.1/ug-editor/';
const WEBHELP_URL2 = 'https://www.oxygenxml.com/doc/versions/27.1/ug-author/';

async function startNextServer(): Promise<{ port: number; stop: () => Promise<void> }> {
  const proc = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '0'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'inherit'],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });

  const port = await new Promise<number>((resolve, reject) => {
    proc.stdout.on('data', (chunk: Buffer) => {
      const m = chunk.toString().match(/localhost:(\d+)/);
      if (m) {
        resolve(parseInt(m[1], 10));
      }
    });
    proc.once('error', reject);
    proc.once('exit', (code) => reject(new Error(`next dev exited with code ${code}`)));
  });

  return {
    port,
    stop: async () => {
      proc.kill();
      await once(proc, 'exit');
    },
  };
}

test('mcp server search and fetch tools', async () => {
  const { port, stop } = await startNextServer();

  const transport = new StreamableHTTPClientTransport(
    `http://localhost:${port}/${WEBHELP_ENDPOINT}`
  );
  const client = new Client({ name: 'e2e-test-client', version: '1.0.0' });
  await client.connect(transport);

  const searchResp = await client.callTool({ name: 'search', arguments: { query: 'wsdl' } });
  assert.ok(searchResp.content && searchResp.content.length > 0, 'search returned content');
  const searchResults = JSON.parse(searchResp.content[0].text);
  assert.ok(Array.isArray(searchResults) && searchResults.length > 0, 'expected search results');

  const first = searchResults[0];
  assert.ok(first && first.id, 'first result should have an id');

  const fetchResp = await client.callTool({ name: 'fetch', arguments: { id: first.id } });
  assert.ok(fetchResp.content && fetchResp.content.length > 0, 'fetch returned content');
  const doc = JSON.parse(fetchResp.content[0].text);
  const snippet =
    'You can use Oxygen XML Editor to generate detailed documentation for the components ' +
    'of a WSDL document in HTML format.';
  assert.ok(doc.text.includes(snippet), `document should include snippet: ${snippet}`);

  await client.close();
  await stop();
});

test('mcp server federated search', async () => {
  const { port, stop } = await startNextServer();

  const encoded = encodeUrls([WEBHELP_URL, WEBHELP_URL2]);
  const transport = new StreamableHTTPClientTransport(
    `http://localhost:${port}/federated/${encoded}`
  );
  const client = new Client({ name: 'e2e-test-client', version: '1.0.0' });
  await client.connect(transport);

  const searchResp = await client.callTool({ name: 'search', arguments: { query: 'XML' } });
  assert.ok(searchResp.content && searchResp.content.length > 0, 'search returned content');
  const searchResults = JSON.parse(searchResp.content[0].text);
  assert.ok(searchResults.length > 0, 'expected search results');

  const hasEditor = searchResults.some((r: any) => r.url.startsWith(WEBHELP_URL));
  const hasAuthor = searchResults.some((r: any) => r.url.startsWith(WEBHELP_URL2));
  assert.ok(hasEditor && hasAuthor, 'results should include both base URLs');

  const first = searchResults[0];
  assert.ok(first && first.id, 'first result should have an id');

  const fetchResp = await client.callTool({ name: 'fetch', arguments: { id: first.id } });
  assert.ok(fetchResp.content && fetchResp.content.length > 0, 'fetch returned content');
  const doc = JSON.parse(fetchResp.content[0].text);
  assert.ok(
    doc.url.startsWith(WEBHELP_URL) || doc.url.startsWith(WEBHELP_URL2),
    'fetched doc URL should come from one of the base URLs'
  );
  assert.ok(
    doc.text.toLowerCase().includes('xml'),
    'fetched document should include the search term'
  );

  await client.close();
  await stop();
});

test('mcp server semantic_search_experimental tool', async () => {
  const { port, stop } = await startNextServer();

  const encoded = encodeUrls([WEBHELP_URL, WEBHELP_URL2]);
  const transport = new StreamableHTTPClientTransport(
    `http://localhost:${port}/federated/${encoded}`
  );
  const client = new Client({ name: 'e2e-test-client', version: '1.0.0' });
  await client.connect(transport);

  const resp = await client.callTool({
    name: 'semantic_search_experimental',
    arguments: { query: 'XML' }
  });
  assert.ok(resp.content && resp.content.length > 0, 'semantic search returned content');
  const results = JSON.parse(resp.content[0].text);
  assert.equal(results.length, 25, 'expected 25 semantic results');

  const hasEditor = results.some((r: any) => r.url.startsWith(WEBHELP_URL));
  const hasAuthor = results.some((r: any) => r.url.startsWith(WEBHELP_URL2));
  assert.ok(hasEditor && hasAuthor, 'results should include both base URLs');

  await client.close();
  await stop();
});

