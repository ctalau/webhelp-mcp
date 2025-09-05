#!/usr/bin/env node

const WebHelpIndexLoader = require('./webhelp-index-loader');

/**
 * WebHelp Search Client
 * Downloads WebHelp search index and performs client-side searches
 */
class WebHelpSearchClient {
    constructor() {
        this.indexLoader = new WebHelpIndexLoader();
        this.isLoaded = false;
    }

    /**
     * Load search index from URL
     */
    async loadIndex(baseUrl) {
        await this.indexLoader.loadIndex(baseUrl);
        this.isLoaded = true;
    }

    /**
     * Perform a search query
     */
    search(query) {
        if (!this.isLoaded) {
            throw new Error('Search index not loaded');
        }

        if (!global.performSearch) {
            throw new Error('Search engine not loaded properly - performSearch function not found');
        }

        try {
            // The performSearch function expects a callback
            let result = null;
            global.performSearch(query, function(searchResult) {
                result = searchResult;
            });
            return this.formatSearchResult(result);
        } catch (error) {
            return {
                error: `Search error: ${error.message}`,
                query: query,
                results: []
            };
        }
    }

    /**
     * Format search results for display
     */
    formatSearchResult(searchResult) {
        return {
            query: searchResult.searchExpression || searchResult.originalSearchExpression,
            originalQuery: searchResult.originalSearchExpression,
            excluded: searchResult.excluded || [],
            error: searchResult.error,
            isPhraseSearch: searchResult.isPhraseSearch,
            resultCount: searchResult.documents ? searchResult.documents.length : 0,
            results: (searchResult.documents || []).map(doc => ({
                id: doc.topicID,
                title: doc.title,
                path: doc.relativePath,
                description: doc.shortDescription,
                score: doc.scoring,
                words: doc.words
            }))
        };
    }

    /**
     * Display top N search results
     */
    displayTopResults(result, maxResults = 10) {
        if (result.error) {
            console.error(`Error: ${result.error}`);
            return;
        }

        if (result.results.length === 0) {
            console.log('No results found.');
            return;
        }

        // Show only top N results
        const topResults = result.results.slice(0, maxResults);
        
        topResults.forEach((doc, index) => {
            console.log(`${index + 1}. ${doc.title} (Score: ${doc.score})`);
            console.log(`   Path: ${doc.path}`);
            if (doc.description) {
                const desc = doc.description.length > 150 
                    ? doc.description.substring(0, 150) + '...' 
                    : doc.description;
                console.log(`   Description: ${desc}`);
            }
            if (doc.words && doc.words.length > 0) {
                console.log(`   Matched words: ${doc.words.join(', ')}`);
            }
            console.log('');
        });
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: node webhelp-search.js <search-index-url> <search-query>');
        console.log('');
        console.log('Examples:');
        console.log('  node webhelp-search.js https://example.com/webhelp/search "commit workspace changes"');
        console.log('  node webhelp-search.js http://localhost:8080/docs/search flowers');
        console.log('  node webhelp-search.js https://userguide.sync.ro/content-fusion "git AND merge"');
        process.exit(1);
    }

    const indexUrl = args[0];
    const query = args.slice(1).join(' ');
    const client = new WebHelpSearchClient();

    try {
        await client.loadIndex(indexUrl);
        const result = client.search(query);
        client.displayTopResults(result, 10);
    } catch (error) {
        console.error('Search failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WebHelpSearchClient;