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

## License

Released under the [MIT License](LICENSE).

