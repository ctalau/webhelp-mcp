import { WebHelpIndexLoader } from './webhelp-index-loader';

export interface SearchResult {
  query: string;
  originalQuery: string;
  excluded: string[];
  error?: string;
  isPhraseSearch: boolean;
  resultCount: number;
  results: Array<{
    id: string;
    title: string;
    path: string;
    description: string;
    score: number;
    words: string[];
  }>;
}

export class WebHelpSearchClient {
  private indexLoader: WebHelpIndexLoader;
  private indexCache: Map<string, boolean> = new Map();
  public baseUrl?: string;

  constructor() {
    this.indexLoader = new WebHelpIndexLoader();
  }

  async loadIndex(baseUrl: string): Promise<void> {
    await this.indexLoader.loadIndex(baseUrl);
    this.indexCache.set(baseUrl, true);
    this.baseUrl = baseUrl;
  }

  async search(query: string, baseUrl?: string): Promise<SearchResult> {
    const indexUrl = baseUrl || this.baseUrl;
    
    if (!indexUrl) {
      return {
        error: 'No base URL provided for search index',
        query: query,
        originalQuery: query,
        excluded: [],
        isPhraseSearch: false,
        resultCount: 0,
        results: []
      };
    }

    // Load index if not already cached
    if (!this.indexCache.has(indexUrl)) {
      try {
        await this.loadIndex(indexUrl);
      } catch (error: any) {
        return {
          error: `Failed to load index: ${error.message}`,
          query: query,
          originalQuery: query,
          excluded: [],
          isPhraseSearch: false,
          resultCount: 0,
          results: []
        };
      }
    }

    if (!(global as any).performSearch) {
      return {
        error: 'Search engine not loaded properly - performSearch function not found',
        query: query,
        originalQuery: query,
        excluded: [],
        isPhraseSearch: false,
        resultCount: 0,
        results: []
      };
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
        originalQuery: query,
        excluded: [],
        isPhraseSearch: false,
        resultCount: 0,
        results: []
      };
    }
  }

  private formatSearchResult(searchResult: any): SearchResult {
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

  displayTopResults(result: SearchResult, maxResults: number = 10): void {
    if (result.error) {
      console.error(`Error: ${result.error}`);
      return;
    }

    if (result.results.length === 0) {
      console.log('No results found.');
      return;
    }

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