# MCP WebHelp Server

Transform any public Oxygen WebHelp deployment into a Model Context Protocol server with simplicity.

Visit the live demo at [webhelp-mcp.vercel.app](https://webhelp-mcp.vercel.app/).

## Features

- **Lightning fast** server generation for seamless documentation access.
- **Wide AI tool support**: works with Oxygen AI Positron, ChatGPT Deep Research, Claude Desktop, Cursor and more.
- **Open source** – [view on GitHub](https://github.com/ctalau/webhelp-mcp).

## Technology & Deployment

### Tech Stack

- **Framework**: Next.js 15, React 19 and TypeScript
- **MCP**: `mcp-handler` with `search` and `fetch` tools powered by a `WebHelpSearchClient`
- **Content processing**: `jsdom` and `turndown` convert WebHelp HTML to Markdown

### Architecture

The server dynamically loads the WebHelp search index for a requested site and exposes a Model Context Protocol endpoint. The Next.js API route `/[...site]` wraps the `WebHelpSearchClient` with `createMcpHandler`, providing:

- `search` – query WebHelp documentation and return matching documents
- `fetch` – retrieve and convert a document to Markdown for detailed analysis

### Deploying to Vercel

1. Fork and clone this repository.
2. Install dependencies: `npm install`.
3. Build the project: `npm run build`.
4. Push to a GitHub repository and import it into [Vercel](https://vercel.com/). The default settings are sufficient—no extra environment variables are required.
5. Access your server at `https://<your-vercel-domain>/<site>`.

## Security

Hosting this server yourself exposes you to several risks that should be
considered before making it publicly available:

- **Server-side request forgery (SSRF)** – the endpoint fetches HTML from any
  URL specified in the request path. An attacker could leverage your instance
  to reach internal or otherwise restricted resources.
- **Resource exhaustion** – large or repeated queries may consume significant
  CPU, memory or bandwidth and degrade the host system.
- **Untrusted content** – the server transforms external HTML into Markdown
  and returns it to the requester. Malicious markup could be relayed to clients
  if additional sanitization is not performed.

Apply network controls, rate limiting and request validation when running your
own deployment.

## License

Released under the [MIT License](LICENSE).

