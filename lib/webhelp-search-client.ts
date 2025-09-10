import { downloadFile } from './downloadFile';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';
import { WebHelpIndexLoader } from './webhelp-index-loader';
import * as https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { extractTitleFromContent } from './site-title';

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

  constructor(baseUrls: string | string[] = []) {
    this.indexLoader = new WebHelpIndexLoader();
    this.baseUrls = Array.isArray(baseUrls)
      ? baseUrls
      : baseUrls
      ? [baseUrls]
      : [];

    if (this.baseUrls.length === 0) {
      throw new Error('No base URL provided for search index');
    }
  }

  async loadIndex(baseUrl: string): Promise<void> {
    await this.indexLoader.loadIndex(baseUrl);
  }

  async search(query: string): Promise<SearchResult> {
    const urls = this.baseUrls;

    if (urls.length === 1) {
      try {
        const semantic = await this.semanticSearch(query, urls[0]);
        if (!semantic.error && semantic.results.length > 0) {
          return semantic;
        }
      } catch (e) {
        // ignore and fall back to index search
      }
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
        this.indexLoader.performSearch(query, function (r: any) {
          result = r;
        });
        const idx = urls.indexOf(url);
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

  /**
   * Perform a semantic search using Oxygen Feedback service
   * @param query   Search query
   * @param baseUrl Base documentation URL
   */
  async semanticSearch(
    query: string,
    baseUrl: string,
    pageSize: number = 10
  ): Promise<SearchResult> {
    try {
      const mainPage = await downloadFile(baseUrl);
      const match = mainPage.match(/feedback-init[^>]+deploymentToken=([^"'>]+)/);
      if (!match) {
        return { error: 'Deployment token not found', results: [] };
      }
      const token = match[1];

      const postData = JSON.stringify({
        searchQuery: query,
        facets: [],
        currentPage: 1,
        pageSize,
        exactSearch: false,
        defaultJoinOperator: 'AND',
        highlight: false,
        indexFields: []
      });

      const proxyUrl =
        process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        process.env.HTTP_PROXY ||
        process.env.http_proxy;

      const options: any = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      if (proxyUrl) {
        options.agent = new HttpsProxyAgent(proxyUrl);
      }

      const dataStr: string = await new Promise((resolve, reject) => {
        const req = https.request(
          `https://feedback.oxygenxml.com/api/html-content/search?token=${token}`,
          options,
          res => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              let body = '';
              res.on('data', chunk => (body += chunk));
              res.on('end', () => resolve(body));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          }
        );
        req.on('error', reject);
        req.write(postData);
        req.end();
      });

      const data: any = JSON.parse(dataStr);
      const results = (data.documents || []).map((doc: any, idx: number) => {
        const url = doc.fields?.uri || '';
        const rel = url.startsWith(baseUrl) ? url.substring(baseUrl.length) : url;
        return {
          id: `0:${rel}`,
          title: doc.fields?.title || '',
          url,
          score: doc.score ?? 0
        };
      });

      return { results };
    } catch (error: any) {
      return { error: `Semantic search failed: ${error.message}`, results: [] };
    }
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
      title: extractTitleFromContent(htmlContent) || documentId,
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