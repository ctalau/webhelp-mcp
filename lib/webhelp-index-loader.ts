import { downloadFile } from './downloadFile';

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

  private parseJsonWithLogging<T>(json: string, context: string): T | null {
    try {
      return JSON.parse(json) as T;
    } catch (e: any) {
      console.error(`Failed to parse JSON for ${context}: ${e.message}`);
      if (json) {
        console.error(`JSON snippet: ${json.substring(0, 500)}`);
      }
      return null;
    }
  }

  async downloadSearchEngine(searchUrl: string): Promise<string> {
    return await downloadFile(`${searchUrl}/nwSearchFnt.js`);
  }

  async downloadIndexParts(searchUrl: string): Promise<string[]> {
    const indexParts: string[] = [];
    for (let i = 1; i <= 10; i++) {
      let loaded = false;
      
      // Try index/ subdirectory first
      try {
        const part = await downloadFile(`${searchUrl}/index/index-${i}.js`);
        indexParts.push(part);
        loaded = true;
      } catch (e) {
        // Try root directory
        try {
          const part = await downloadFile(`${searchUrl}/index-${i}.js`);
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
        loadedFiles[file.var] = await downloadFile(`${searchUrl}/index/${file.name}`);
      } catch (e) {
        try {
          loadedFiles[file.var] = await downloadFile(`${searchUrl}/${file.name}`);
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
      // Extract JSON from var assignment
      const jsonMatch = stopwordsContent.match(/var\s+stopwords\s*=\s*(\[[\s\S]*?\]);?\s*(?:\/\/.*)?$/);
      if (jsonMatch) {
        const parsed = this.parseJsonWithLogging<any[]>(jsonMatch[1], 'stopwords');
        if (parsed) {
          (global as any).stopwords = parsed;
          (global as any).stopWords = parsed;
        }
      }
    }
  }

  processLinkToParent(linkToParentContent: string): void {
    if (linkToParentContent) {
      // Extract JSON from var assignment
      const jsonMatch = linkToParentContent.match(/var\s+linkToParent\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
      if (jsonMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(jsonMatch[1], 'linkToParent');
        if (parsed) {
          (global as any).linkToParent = parsed;
        }
      }
    }
  }

  processKeywords(keywordsContent: string): void {
    if (keywordsContent) {
      // Extract keywords variable
      const keywordsMatch = keywordsContent.match(/var\s+keywords\s*=\s*(\[[\s\S]*?\]);/);
      if (keywordsMatch) {
        const parsed = this.parseJsonWithLogging<any[]>(keywordsMatch[1], 'keywords');
        if (parsed) {
          (global as any).keywords = parsed;
        }
      }

      // Extract ph variable
      const phMatch = keywordsContent.match(/var\s+ph\s*=\s*(\{[\s\S]*?\});/);
      if (phMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(phMatch[1], 'ph');
        if (parsed) {
          (global as any).ph = parsed;
        }
      }

      // Extract keywordsInfo variable
      const keywordsInfoMatch = keywordsContent.match(/var\s+keywordsInfo\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
      if (keywordsInfoMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(keywordsInfoMatch[1], 'keywordsInfo');
        if (parsed) {
          (global as any).keywordsInfo = parsed;
        }
      }
    }
  }

  processFileInfoList(htmlFileInfoListContent: string): void {
    if (htmlFileInfoListContent) {
      // Extract htmlFileInfoList variable
      const htmlFileInfoListMatch = htmlFileInfoListContent.match(/var\s+htmlFileInfoList\s*=\s*(\[[\s\S]*?\]);/);
      if (htmlFileInfoListMatch) {
        const parsed = this.parseJsonWithLogging<any[]>(htmlFileInfoListMatch[1], 'htmlFileInfoList');
        if (parsed) {
          (global as any).htmlFileInfoList = parsed;
        }
      }

      // Extract fil variable if present
      const filMatch = htmlFileInfoListContent.match(/var\s+fil\s*=\s*(\{[\s\S]*?\});/);
      if (filMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(filMatch[1], 'fil');
        if (parsed) {
          (global as any).fil = parsed;
        }
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
    }
  }

  processIndexParts(indexParts: string[]): void {
    // Load index parts and capture variables
    indexParts.forEach((part, idx) => {
      // Extract JSON from var assignment, handling multi-line and comments
      const indexMatch = part.match(/var\s+index(\d+)\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
      if (indexMatch) {
        const indexNum = indexMatch[1];
        const parsed = this.parseJsonWithLogging<Record<string, any>>(indexMatch[2], `index${indexNum}`);
        if (parsed) {
          (global as any)[`index${indexNum}`] = parsed;
        }
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