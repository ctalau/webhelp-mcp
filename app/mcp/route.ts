import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

// Import the WebHelp search functionality
// Note: We'll need to convert these to ES modules or use require in a way that works with Next.js
const WebHelpIndexLoader = require('../../webhelp-index-loader');

class WebHelpSearchClient {
  private indexLoader: any;
  public isLoaded: boolean = false;
  public baseUrl?: string;

  constructor() {
    this.indexLoader = new WebHelpIndexLoader();
  }

  async loadIndex(baseUrl: string) {
    await this.indexLoader.loadIndex(baseUrl);
    this.isLoaded = true;
    this.baseUrl = baseUrl;
  }

  search(query: string) {
    if (!this.isLoaded) {
      throw new Error('Search index not loaded');
    }

    if (!(global as any).performSearch) {
      throw new Error('Search engine not loaded properly - performSearch function not found');
    }

    try {
      let result = null;
      (global as any).performSearch(query, function(searchResult: any) {
        result = searchResult;
      });
      return this.formatSearchResult(result);
    } catch (error: any) {
      return {
        error: `Search error: ${error.message}`,
        query: query,
        results: []
      };
    }
  }

  private formatSearchResult(searchResult: any) {
    return {
      query: searchResult.searchExpression || searchResult.originalSearchExpression,
      originalQuery: searchResult.originalSearchExpression,
      excluded: searchResult.excluded || [],
      error: searchResult.error,
      isPhraseSearch: searchResult.isPhraseSearch,
      resultCount: searchResult.documents ? searchResult.documents.length : 0,
      results: (searchResult.documents || []).map((doc: any) => ({
        id: doc.topicID,
        title: doc.title,
        path: doc.relativePath,
        description: doc.shortDescription,
        score: doc.scoring,
        words: doc.words
      }))
    };
  }
}

// Global search client instance
const searchClient = new WebHelpSearchClient();

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "search_webhelp",
      "Search WebHelp documentation. Automatically loads the search index if not already loaded.",
      {
        baseUrl: z.string().describe("Base URL of the WebHelp documentation (e.g., https://example.com/docs)"),
        query: z.string().describe("Search query string (supports boolean operators like AND, OR)"),
        maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)")
      },
      async ({ baseUrl, query, maxResults }) => {
        try {
          // Auto-load index if not already loaded or if baseUrl is different
          if (!searchClient.isLoaded || searchClient.baseUrl !== baseUrl) {
            try {
              await searchClient.loadIndex(baseUrl);
            } catch (loadError: any) {
              return {
                content: [{
                  type: "text",
                  text: `Error loading search index from ${baseUrl}: ${loadError.message}`
                }],
                isError: true
              };
            }
          }

          // Perform the search
          const result = searchClient.search(query);
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
          const resultCount = 'resultCount' in result ? result.resultCount : result.results.length;
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
          description: "Search WebHelp documentation with automatic index loading",
        },
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: false,
  },
);

export { handler as GET, handler as POST, handler as DELETE };