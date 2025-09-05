#!/usr/bin/env node

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { WebHelpSearchClient } = require('./lib/webhelp-search-client');

/**
 * WebHelp Search MCP Server
 * Provides MCP tools for searching WebHelp documentation
 */
class WebHelpSearchMcpServer {
    constructor() {
        this.server = new McpServer({
            name: "webhelp-search-server",
            version: "1.0.0"
        }, {
            capabilities: {
                tools: {}
            }
        });

        this.searchClient = new WebHelpSearchClient();
        this.setupTools();
    }

    setupTools() {
        // Single search tool that automatically loads the index if needed
        this.server.registerTool(
            "search_webhelp",
            {
                title: "Search WebHelp",
                description: "Search WebHelp documentation. Automatically loads the search index if not already loaded.",
                inputSchema: {
                    baseUrl: z.string().describe("Base URL of the WebHelp documentation (e.g., https://example.com/docs)"),
                    query: z.string().describe("Search query string (supports boolean operators like AND, OR)"),
                    maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)")
                }
            },
            async ({ baseUrl, query, maxResults }) => {
                try {
                    // Auto-load index if not already loaded or if baseUrl is different
                    if (!this.searchClient.isLoaded || this.searchClient.baseUrl !== baseUrl) {
                        try {
                            await this.searchClient.loadIndex(baseUrl);
                        } catch (loadError) {
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
                    const result = this.searchClient.search(query);
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
                    let output = `Search Results for "${result.query}" (${result.resultCount} total results):\n\n`;
                    
                    topResults.forEach((doc, index) => {
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
                } catch (error) {
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
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('WebHelp Search MCP Server running on stdio');
    }
}

// Start the server
async function main() {
    const server = new WebHelpSearchMcpServer();
    await server.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WebHelpSearchMcpServer;