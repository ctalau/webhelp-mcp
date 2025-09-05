#!/usr/bin/env node

import { WebHelpSearchClient } from './lib/webhelp-search-client';

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
        const result = await client.search(query, indexUrl);
        client.displayTopResults(result, 10);
    } catch (error: any) {
        console.error('Search failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WebHelpSearchClient;