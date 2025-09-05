import { createMcpHandler } from "mcp-handler";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { WebHelpSearchClient } from "../../lib/webhelp-search-client";

// Global search client instance
const searchClient = new WebHelpSearchClient();

// Function to extract base URL from request path
function extractBaseUrlFromPath(pathname: string): string | undefined {
  const pathSegments = pathname.split('/').filter(Boolean);

  // Remove 'mcp' from the end if present
  if (pathSegments[pathSegments.length - 1] === 'mcp') {
    pathSegments.pop();
  }

  // Reconstruct the base URL from the path
  // Example: /myorg.com/docs/v2/mcp -> https://myorg.com/docs/v2/
  if (pathSegments.length > 0) {
    return 'https://' + pathSegments.join('/') + '/';
  }

  return undefined;
}

const handler = async (req: NextRequest) => {
  // Extract base URL from request path if not provided
  const url = new URL(req.url);
  let baseUrl = extractBaseUrlFromPath(url.pathname);

  return createMcpHandler(
    async (server) => {
      server.tool(
        "search",
        "Search WebHelp documentation. Automatically loads the search index if not already loaded.",
        {
          query: z.string().describe("Search query string (supports boolean operators like AND, OR)"),
          maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)")
        },
        async ({ query, maxResults }) => {
          if (!baseUrl) {
            return {
              content: [{
                type: "text",
                text: "Error: No base URL provided and unable to derive from request path: " + url.pathname
              }],
              isError: true
            };
          }
          try {
            // Perform the search (index loading is now handled automatically)
            const result = await searchClient.search(query, baseUrl);
            const maxResultsToUse = maxResults || 10;

            if (result.error) {
              return {
                content: [{
                  type: "text",
                  text: `Search error: ${result.error}`
                }],
                isError: true
              };
            }

            if (result.results.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `No results found for query: "${result.query}"`
                }]
              };
            }

            // Format results
            const topResults = result.results.slice(0, maxResultsToUse);
            const resultCount = result.results.length;
            let output = `Search Results for "${result.query}" (${resultCount} total results):\n\n`;

            topResults.forEach((doc: any, index: number) => {
              output += `${index + 1}. ${doc.title} (Score: ${doc.score})\n`;
              output += `   Path: ${doc.path}\n`;
              if (doc.description) {
                const desc = doc.description.length > 150
                  ? doc.description.substring(0, 150) + '...'
                  : doc.description;
                output += `   Description: ${desc}\n`;
              }
              if (doc.words && doc.words.length > 0) {
                output += `   Matched words: ${doc.words.join(', ')}\n`;
              }
              output += '\n';
            });

            return {
              content: [{
                type: "text",
                text: output.trim()
              }]
            };
          } catch (error: any) {
            return {
              content: [{
                type: "text",
                text: `Search failed: ${error.message}`
              }],
              isError: true
            };
          }
        }
      );
    },
    {
      capabilities: {
        tools: {
          search: {
            description: "Search documentation at url " + baseUrl,
          },
        },
      },
    },
    {
      basePath: "",
      verboseLogs: true,
      maxDuration: 60,
      // disableSse: false,
    },
  )(req);
};

export { handler as GET, handler as POST, handler as DELETE };