import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { WebHelpSearchClient } from "../../lib/webhelp-search-client";
import { NextRequest } from "next/server";
import { decodeUrls } from "../../lib/url-pack";

// Global search client instance
const searchClient = new WebHelpSearchClient();

function resolveBaseUrls(site: Array<string>): string[] {
  if (site[0] === 'federated' && site[1]) {
    return decodeUrls(site[1]);
  }
  const endpoint = site.join('/');
  return [`https://${endpoint}/`];
}

const handler = async (
  req: NextRequest,
  { params }: { params: Promise<{ site: Array<string> }> }
) => {
  const { site } = await params;
  const endpoint = site.join('/');
  const baseUrls = resolveBaseUrls(site);
  const baseUrlDesc = baseUrls.join(', ');
  console.log('Requests:', req.nextUrl.pathname, endpoint);

  return createMcpHandler(
    async (server) => {
      server.tool(
        "search",
        "Search documentation for the site at: " + baseUrlDesc,
        {
          query: z.string().describe("Search query string (supports boolean operators like AND, OR)"),
        },
        async ({ query }) => {
          console.log('Tool "search" invoked with params:', { query });
          try {
            // Perform the search (index loading is now handled automatically)
            const result = await searchClient.search(query, baseUrls);
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
                id: doc.id,
                url: doc.url
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
        "semantic_search_experimental",
        "Experimental semantic search across documentation sites at: " + baseUrlDesc,
        {
          query: z
            .string()
            .describe("Search query string for semantic search"),
        },
        async ({ query }) => {
          console.log('Tool "semantic_search_experimental" invoked with params:', { query });
          try {
            const resultsBySite = await Promise.all(
              baseUrls.map(url => searchClient.semanticSearch(query, url, 25))
            );
            const interleaved: any[] = [];
            const pointers = new Array(resultsBySite.length).fill(0);
            while (interleaved.length < 25) {
              let added = false;
              for (let i = 0; i < resultsBySite.length && interleaved.length < 25; i++) {
                const res = resultsBySite[i].results;
                const ptr = pointers[i];
                if (ptr < res.length) {
                  interleaved.push(res[ptr]);
                  pointers[i]++;
                  added = true;
                }
              }
              if (!added) {
                break;
              }
            }
            const formatted = interleaved.slice(0, 25).map((doc: any) => ({
              title: doc.title,
              id: doc.id,
              url: doc.url,
            }));
            return {
              content: [{ type: "text", text: JSON.stringify(formatted) }],
            };
          } catch (error: any) {
            return {
              content: [
                {
                  type: "text",
                  text: `Semantic search failed: ${error.message}`,
                },
              ],
              isError: true,
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
          console.log('Tool "fetch" invoked with params:', { id });
          try {
            const fetchResult = await searchClient.fetchDocumentContent(id);

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
            description: "Search documentation for the site at: " + baseUrlDesc,
          },
          semantic_search_experimental: {
            description:
              "Experimental semantic search across documentation sites using Oxygen Feedback",
          },
          fetch: {
            description: "Fetch the content of a document by its ID",
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
