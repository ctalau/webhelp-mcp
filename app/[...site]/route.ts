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
        "search",
        "Search documentation for the site at: " + baseUrl,
        {
          query: z.string().describe("Search query string (supports boolean operators like AND, OR)"),
        },
        async ({ query }) => {
          try {
            // Perform the search (index loading is now handled automatically)
            const result = await searchClient.search(query, baseUrl);
            const maxResultsToUse = 10;
            
            if (result.error) {
              return {
                content: [{
                  type: "text",
                  text: `Search error: ${result.error}`
                }],
                isError: true
              };
            }

            // Format results
            const topResults = result.results.slice(0, maxResultsToUse);
            let results = topResults.map((doc: any) => ({
                title: doc.title,
                id: doc.path,
                url: `${baseUrl}${doc.path}`
              }));
            return {
              content: [{
                type: "text",
                text: JSON.stringify(results)
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
      server.tool(
        "fetch",
        "Retrieve complete document content by ID for detailed analysis and citation. Use this after finding relevant documents with the search tool.",
        {
          id: z.string().describe("Document ID from search results")
        },
        async ({ id }) => {
          try {
            const fetchResult = await searchClient.fetchDocumentContent(id, baseUrl);

            return {
              content: [{
                type: "text",
                text: JSON.stringify(fetchResult)
              }]
            };
          } catch (error: any) {
            return {
              content: [{
                type: "text",
                text: `Fetch failed: ${error.message}`
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
            description: "Search documentation for the site at: " + baseUrl,
          },
          fetch: {
            description: "Fetch the content of a document by its ID"
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