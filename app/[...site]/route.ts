import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { WebHelpSearchClient } from "../../lib/webhelp-search-client";
import { NextRequest } from "next/server";

// Global search client instance
const searchClient = new WebHelpSearchClient();

const handler = async (
  req: NextRequest,
  { params }: { params: Promise<{ site: Array<string> }> }
) => {
  const { site } = await params;
  let endpoint = site.join('/');
  let baseUrl = `https://${endpoint}/`;
  console.log('Requests:', req.nextUrl.pathname, endpoint);

  return createMcpHandler(
    async (server) => {
      server.tool(
        "search_webhelp",
        "Search WebHelp documentation for the site at: " + baseUrl,
        {
          query: z.string().describe("Search query string (supports boolean operators like AND, OR)"),
          maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)")
        },
        async ({ query, maxResults }) => {
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
          search_webhelp: {
            description: "Search WebHelp documentation for the site at: " + baseUrl,
          },
        },
      },
    },
    {
      streamableHttpEndpoint: `/${endpoint}`,
      verboseLogs: true,
      maxDuration: 60,
      // disableSse: false,
    },
  )(req);
}


export { handler as GET, handler as POST, handler as DELETE };