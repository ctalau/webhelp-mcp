import { IncomingMessage } from 'http';
import * as https from 'https';
import * as http from 'http';

interface MetadataFiles {
  stopwords: string;
  linkToParent: string;
  keywords: string;
  htmlFileInfoList: string;
}

interface MetadataFile {
  name: string;
  var: string;
}

export interface SearchIndex {
  w: Record<string, any>;
  fil: Record<string, any>;
  stopWords: string[];
  link2parent: Record<string, any>;
}

export class WebHelpIndexLoader {
  private baseUrl: string = '';

  async downloadFile(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https://') ? https : http;
      
      client.get(url, (response: IncomingMessage) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  async downloadSearchEngine(searchUrl: string): Promise<string> {
    return await this.downloadFile(`${searchUrl}/nwSearchFnt.js`);
  }

  async downloadIndexParts(searchUrl: string): Promise<string[]> {
    const indexParts: string[] = [];
    for (let i = 1; i <= 10; i++) {
      let loaded = false;
      
      // Try index/ subdirectory first
      try {
        const part = await this.downloadFile(`${searchUrl}/index/index-${i}.js`);
        indexParts.push(part);
        loaded = true;
      } catch (e) {
        // Try root directory
        try {
          const part = await this.downloadFile(`${searchUrl}/index-${i}.js`);
          indexParts.push(part);
          loaded = true;
        } catch (e2) {
          // No more index parts
        }
      }
      
      if (!loaded) break;
    }
    return indexParts;
  }

  async downloadMetadataFiles(searchUrl: string): Promise<MetadataFiles> {
    const metaFiles: MetadataFile[] = [
      { name: 'htmlFileInfoList.js', var: 'htmlFileInfoList' },
      { name: 'stopwords.js', var: 'stopwords' },
      { name: 'link-to-parent.js', var: 'linkToParent' },
      { name: 'keywords.js', var: 'keywords' }
    ];

    const loadedFiles: any = {};
    
    for (const file of metaFiles) {
      try {
        loadedFiles[file.var] = await this.downloadFile(`${searchUrl}/index/${file.name}`);
      } catch (e) {
        try {
          loadedFiles[file.var] = await this.downloadFile(`${searchUrl}/${file.name}`);
        } catch (e2) {
          loadedFiles[file.var] = '';
        }
      }
    }
    
    return loadedFiles as MetadataFiles;
  }

  setupGlobalEnvironment(): void {
    // Create a sandbox-like global environment
    (global as any).w = {};
    (global as any).fil = {};
    (global as any).stopWords = [];
    (global as any).linkToParent = {};
    (global as any).indexerLanguage = 'en';
    (global as any).doStem = false;
    (global as any).stemmer = null;
    
    // Debug/console functions for the library
    (global as any).debug = function() {};
    (global as any).warn = function() {};
    (global as any).info = function() {};

    // Utility functions used by the search library
    (global as any).trim = function(str: string, chars?: string) {
      chars = chars || "\\s";
      return str.replace(new RegExp("^[" + chars + "]+", "g"), "")
                .replace(new RegExp("[" + chars + "]+$", "g"), "");
    };

    (global as any).contains = function(arrayOfWords: string[], word: string) {
      for (const w in arrayOfWords) {
        if (arrayOfWords[w] === word) {
          return true;
        }
      }
      return false;
    };

    (global as any).inArray = function(needle: any, haystack: any[]) {
      for (let i = 0; i < haystack.length; i++) {
        if (haystack[i] == needle) return true;
      }
      return false;
    };
  }

  processStopwords(stopwordsContent: string): void {
    if (stopwordsContent) {
      try {
        // Extract JSON from var assignment
        const jsonMatch = stopwordsContent.match(/var\s+stopwords\s*=\s*(\[[\s\S]*?\]);?\s*(?:\/\/.*)?$/);
        if (jsonMatch) {
          (global as any).stopwords = JSON.parse(jsonMatch[1]);
          (global as any).stopWords = (global as any).stopwords;
        }
      } catch (e) {
        // Skip if stopwords file has issues
      }
    }
  }

  processLinkToParent(linkToParentContent: string): void {
    if (linkToParentContent) {
      try {
        // Extract JSON from var assignment
        const jsonMatch = linkToParentContent.match(/var\s+linkToParent\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
        if (jsonMatch) {
          (global as any).linkToParent = JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        // Skip if link-to-parent file has issues
      }
    }
  }

  processKeywords(keywordsContent: string): void {
    if (keywordsContent) {
      try {
        // Extract keywords variable
        const keywordsMatch = keywordsContent.match(/var\s+keywords\s*=\s*(\[[\s\S]*?\]);/);
        if (keywordsMatch) {
          (global as any).keywords = JSON.parse(keywordsMatch[1]);
        }
        
        // Extract ph variable
        const phMatch = keywordsContent.match(/var\s+ph\s*=\s*(\{[\s\S]*?\});/);
        if (phMatch) {
          (global as any).ph = JSON.parse(phMatch[1]);
        }
        
        // Extract keywordsInfo variable
        const keywordsInfoMatch = keywordsContent.match(/var\s+keywordsInfo\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
        if (keywordsInfoMatch) {
          (global as any).keywordsInfo = JSON.parse(keywordsInfoMatch[1]);
        }
      } catch (e) {
        // Skip if keywords file has issues
      }
    }
  }

  processFileInfoList(htmlFileInfoListContent: string): void {
    if (htmlFileInfoListContent) {
      try {
        // Extract htmlFileInfoList variable
        const htmlFileInfoListMatch = htmlFileInfoListContent.match(/var\s+htmlFileInfoList\s*=\s*(\[[\s\S]*?\]);/);
        if (htmlFileInfoListMatch) {
          (global as any).htmlFileInfoList = JSON.parse(htmlFileInfoListMatch[1]);
        }
        
        // Extract fil variable if present
        const filMatch = htmlFileInfoListContent.match(/var\s+fil\s*=\s*(\{[\s\S]*?\});/);
        if (filMatch) {
          (global as any).fil = JSON.parse(filMatch[1]);
        }
        
        // Check if we have either fil array or htmlFileInfoList array
        if ((global as any).htmlFileInfoList && Array.isArray((global as any).htmlFileInfoList)) {
          // Convert array to fil object format (index-based)
          if (!(global as any).fil || Object.keys((global as any).fil).length === 0) {
            (global as any).fil = {};
            (global as any).htmlFileInfoList.forEach((item: any, index: number) => {
              (global as any).fil[index.toString()] = item;
            });
          }
        }
      } catch (e) {
        // Skip if file info list has issues
      }
    }
  }

  processIndexParts(indexParts: string[]): void {
    // Load index parts and capture variables
    indexParts.forEach((part, idx) => {
      try {
        // Extract JSON from var assignment, handling multi-line and comments
        const indexMatch = part.match(/var\s+index(\d+)\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
        if (indexMatch) {
          const indexNum = indexMatch[1];
          const indexData = JSON.parse(indexMatch[2]);
          (global as any)[`index${indexNum}`] = indexData;
        }
      } catch (e) {
        // Skip failed index parts
      }
    });

    // Combine all index objects into the main w object
    const allWords: Record<string, any> = {};
    for (let i = 1; i <= indexParts.length; i++) {
      const indexVar = `index${i}`;
      if ((global as any)[indexVar] && typeof (global as any)[indexVar] === 'object') {
        Object.assign(allWords, (global as any)[indexVar]);
      }
    }
    
    // Also include any words directly added to global.w
    if ((global as any).w && typeof (global as any).w === 'object') {
      Object.assign(allWords, (global as any).w);
    }
    
    (global as any).w = allWords;
  }

  initializeSearchEngine(nwSearchFntJs: string): void {
    try {
      // Transform function declaration to global assignment
      const transformedSearchFnt = nwSearchFntJs.replace(
        /^function\s+nwSearchFnt\s*\(/m, 
        'global.nwSearchFnt = function('
      );
      eval(transformedSearchFnt);
    } catch (evalError: any) {
      throw new Error('Error evaluating nwSearchFnt.js: ' + evalError.message);
    }
    
    // Initialize the search engine
    if (typeof (global as any).nwSearchFnt === 'function') {
      // Create options mock
      (global as any).options = {
        get: function(key: string) {
          const defaults: Record<string, any> = {
            'webhelp.search.default.operator': 'or',
            'webhelp.labels.generation.mode': 'disable',
            'use.stemming': false
          };
          return defaults[key];
        },
        getBoolean: function(key: string) {
          return this.get(key) === true || this.get(key) === 'true';
        },
        getIndexerLanguage: function() {
          return (global as any).indexerLanguage || 'en';
        }
      };

      // Create utility mock
      (global as any).util = {
        debug: function() {}
      };

      // Ensure we have a proper index object structure
      if (!(global as any).index) {
        (global as any).index = {
          w: (global as any).w || {},
          fil: (global as any).fil || {},
          stopWords: (global as any).stopWords || [],
          link2parent: (global as any).linkToParent || {}
        };
      } else {
        // Make sure our fil object is in the index
        (global as any).index.fil = (global as any).fil || (global as any).index.fil || {};
      }

      // Create the search engine instance
      (global as any).searchEngine = new (global as any).nwSearchFnt((global as any).index, (global as any).options, (global as any).stemmer, (global as any).util);
      
      // Expose performSearch if it exists
      if ((global as any).searchEngine && typeof (global as any).searchEngine.performSearch === 'function') {
        (global as any).performSearch = (global as any).searchEngine.performSearch.bind((global as any).searchEngine);
      }
    }
  }

  async loadIndex(baseUrl: string): Promise<void> {
    // Auto-discover the search directory
    const searchUrl = `${baseUrl.replace(/\/$/, '')}/oxygen-webhelp/app/search`;
    this.baseUrl = searchUrl + '/';
    
    try {
      // Setup global environment
      this.setupGlobalEnvironment();

      // Download all files
      const nwSearchFntJs = await this.downloadSearchEngine(searchUrl);
      const indexParts = await this.downloadIndexParts(searchUrl);
      const metadataFiles = await this.downloadMetadataFiles(searchUrl);

      // Process metadata files
      this.processStopwords(metadataFiles.stopwords);
      this.processLinkToParent(metadataFiles.linkToParent);
      this.processKeywords(metadataFiles.keywords);
      this.processFileInfoList(metadataFiles.htmlFileInfoList);

      // Process index files
      this.processIndexParts(indexParts);

      // Initialize search engine
      this.initializeSearchEngine(nwSearchFntJs);
      
    } catch (error: any) {
      throw new Error(`Failed to load search index: ${error.message}`);
    }
  }
}