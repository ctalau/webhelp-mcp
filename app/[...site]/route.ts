import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { WebHelpSearchClient } from "../../lib/webhelp-search-client";
import { NextRequest } from "next/server";
import { decodeUrls } from "../../lib/url-pack";
import { fetchSiteTitle } from "../../lib/site-title";

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
  const titles = (await Promise.all(baseUrls.map(fetchSiteTitle))).filter(
    (t): t is string => Boolean(t)
  );
  const searchDescription =
    titles.length > 0
      ? `Search documentation for ${titles.join(', ')}`
      : `Search documentation for the site at: ${baseUrlDesc}`;
  console.log('Requests:', req.nextUrl.pathname, endpoint);

  const searchClient = new WebHelpSearchClient(baseUrls);

  return createMcpHandler(
    async (server) => {
      server.tool(
        "search",
        searchDescription,
        {
          query: z
            .string()
            .describe("Search query string (supports boolean operators like AND, OR)"),
        },
        async ({ query }) => {
          console.log('Tool "search" invoked with params:', { query });
          try {
            const result = await searchClient.search(query);
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
            const results = topResults.map((doc: any) => ({
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
            description: searchDescription,
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
