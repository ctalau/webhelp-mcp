import { downloadFile } from './downloadFile';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';
import { WebHelpIndexLoader } from './webhelp-index-loader';

export interface SearchResult {
  error?: string;
  results: Array<{
    id: string;
    title: string;
    url: string;
    score: number;
  }>;
}

export class WebHelpSearchClient {
  private indexLoader: WebHelpIndexLoader;
  private baseUrls: string[];

  constructor() {
    this.indexLoader = new WebHelpIndexLoader();
    this.baseUrls = [];
  }

  async loadIndex(baseUrl: string): Promise<void> {
    await this.indexLoader.loadIndex(baseUrl);
    if (!this.baseUrls.includes(baseUrl)) {
      this.baseUrls.push(baseUrl);
    }
  }

  async search(query: string, baseUrls?: string | string[]): Promise<SearchResult> {
    const urls = baseUrls
      ? Array.isArray(baseUrls)
        ? baseUrls
        : [baseUrls]
      : this.baseUrls;

    if (urls.length === 0) {
      return {
        error: 'No base URL provided for search index',
        results: []
      };
    }

    const mergedResults: SearchResult['results'] = [];

    for (const url of urls) {
      try {
        await this.loadIndex(url);
      } catch (error: any) {
        return {
          error: `Failed to load index: ${error.message}`,
          results: []
        };
      }

      try {
        let result: any = null;
        this.indexLoader.performSearch(query, function(r: any) {
          result = r;
        });
        const idx = this.baseUrls.indexOf(url);
        const formatted = this.formatSearchResult(result, url, idx);
        if (formatted.error) {
          return { error: formatted.error, results: [] };
        }
        mergedResults.push(...formatted.results);
      } catch (error: any) {
        return {
          error: `Search error: ${error.message}`,
          results: []
        };
      }
    }

    mergedResults.sort((a, b) => b.score - a.score);

    return { results: mergedResults };
  }

  private formatSearchResult(searchResult: any, baseUrl: string, index: number): SearchResult {
    return {
      error: searchResult.error,
      results: (searchResult.documents || []).map((doc: any) => ({
        id: `${index}:${doc.relativePath}`,
        title: doc.title,
        url: `${baseUrl}${doc.relativePath}`,
        score: doc.scoring
      }))
    };
  }

  /**
   * Fetch the content of a document by its ID
   * @param documentId - The ID of the document to fetch (index:path)
   * @returns The content of the document
   */
  async fetchDocumentContent(documentId: string): Promise<{
    id: string;
    title: string;
    text: string;
    url: string;
    metadata?: any;
  }> {
    const fullUrl = this.resolveDocumentUrl(documentId);
    let htmlContent = await downloadFile(fullUrl);
    
    // Extract just the article element
    let articleContent = this.extractArticleElement(htmlContent);
    
    // Convert HTML to markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-'
    });
    
    const markdownContent = turndownService.turndown(articleContent);
    
    return {
      id: documentId,
      title: this.extractTitleFromContent(htmlContent) || documentId,
      text: markdownContent,
      url: fullUrl
    };
  }

  private resolveDocumentUrl(documentId: string): string {
    const [indexStr, ...pathParts] = documentId.split(':');
    const baseUrl = this.baseUrls[Number(indexStr)];
    if (!baseUrl) {
      throw new Error(`Unknown base URL index: ${indexStr}`);
    }
    const path = pathParts.join(':');
    return `${baseUrl}${path}`;
  }

  extractTitleFromContent(content: string): string {
    if (!content.includes('<title>')) {
      return '';
    }
    let titleAndAfter = content.split('<title>')[1];
    if (!titleAndAfter.includes('</title>')) {
      return titleAndAfter;
    }
    return titleAndAfter.split('</title>')[0];
  }

  extractArticleElement(htmlContent: string): string {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    const articleElement = document.querySelector('article');
    if (articleElement) {
      return articleElement.outerHTML;
    }
    
    // If no article element found, return the original content
    return htmlContent;
  }

}