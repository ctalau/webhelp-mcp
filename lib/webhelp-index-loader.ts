import { downloadFile } from './downloadFile';

interface MetadataFiles {
  stopwords: string;
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
  private searchContext: any = {};

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
      { name: 'stopwords.js', var: 'stopwords' }
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

  private setupSearchContext(): void {
    // Create an isolated context object instead of polluting global
    this.searchContext = {
      w: {},
      fil: {},
      stopWords: [],
      linkToParent: {},
      indexerLanguage: 'en',
      doStem: false,
      stemmer: null,

      // Debug/console functions for the library
      debug: function() {},
      warn: function() {},
      info: function() {},

      // Utility functions used by the search library
      trim: function(str: string, chars?: string) {
        chars = chars || "\\s";
        return str.replace(new RegExp("^[" + chars + "]+", "g"), "")
                  .replace(new RegExp("[" + chars + "]+$", "g"), "");
      },

      contains: function(arrayOfWords: string[], word: string) {
        for (const w in arrayOfWords) {
          if (arrayOfWords[w] === word) {
            return true;
          }
        }
        return false;
      },

      inArray: function(needle: any, haystack: any[]) {
        for (let i = 0; i < haystack.length; i++) {
          if (haystack[i] == needle) return true;
        }
        return false;
      }
    };
  }

  private processStopwords(stopwordsContent: string): void {
    if (stopwordsContent) {
      const jsonMatch = stopwordsContent.match(/var\s+stopwords\s*=\s*(\[[\s\S]*?\]);?\s*(?:\/\/.*)?$/);
      if (jsonMatch) {
        const parsed = this.parseJsonWithLogging<any[]>(jsonMatch[1], 'stopwords');
        if (parsed) {
          this.searchContext.stopwords = parsed;
          this.searchContext.stopWords = parsed;
        }
      }
    }
  }

  private processLinkToParent(linkToParentContent: string): void {
    if (linkToParentContent) {
      const jsonMatch = linkToParentContent.match(/var\s+linkToParent\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
      if (jsonMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(jsonMatch[1], 'linkToParent');
        if (parsed) {
          this.searchContext.linkToParent = parsed;
        }
      }
    }
  }

  private processKeywords(keywordsContent: string): void {
    if (keywordsContent) {
      const keywordsMatch = keywordsContent.match(/var\s+keywords\s*=\s*(\[[\s\S]*?\]);/);
      if (keywordsMatch) {
        const parsed = this.parseJsonWithLogging<any[]>(keywordsMatch[1], 'keywords');
        if (parsed) {
          this.searchContext.keywords = parsed;
        }
      }

      const phMatch = keywordsContent.match(/var\s+ph\s*=\s*(\{[\s\S]*?\});/);
      if (phMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(phMatch[1], 'ph');
        if (parsed) {
          this.searchContext.ph = parsed;
        }
      }

      const keywordsInfoMatch = keywordsContent.match(/var\s+keywordsInfo\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
      if (keywordsInfoMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(keywordsInfoMatch[1], 'keywordsInfo');
        if (parsed) {
          this.searchContext.keywordsInfo = parsed;
        }
      }
    }
  }

  private processFileInfoList(htmlFileInfoListContent: string): void {
    if (htmlFileInfoListContent) {
      const htmlFileInfoListMatch = htmlFileInfoListContent.match(/var\s+htmlFileInfoList\s*=\s*(\[[\s\S]*?\]);/);
      if (htmlFileInfoListMatch) {
        const parsed = this.parseJsonWithLogging<any[]>(htmlFileInfoListMatch[1], 'htmlFileInfoList');
        if (parsed) {
          this.searchContext.htmlFileInfoList = parsed;
        }
      }

      const filMatch = htmlFileInfoListContent.match(/var\s+fil\s*=\s*(\{[\s\S]*?\});/);
      if (filMatch) {
        const parsed = this.parseJsonWithLogging<Record<string, any>>(filMatch[1], 'fil');
        if (parsed) {
          this.searchContext.fil = parsed;
        }
      }

      if (this.searchContext.htmlFileInfoList && Array.isArray(this.searchContext.htmlFileInfoList)) {
        if (!this.searchContext.fil || Object.keys(this.searchContext.fil).length === 0) {
          this.searchContext.fil = {};
          this.searchContext.htmlFileInfoList.forEach((item: any, index: number) => {
            this.searchContext.fil[index.toString()] = item;
          });
        }
      }
    }
  }

  private processIndexParts(indexParts: string[]): void {
    indexParts.forEach((part, idx) => {
      const indexMatch = part.match(/var\s+index(\d+)\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
      if (indexMatch) {
        const indexNum = indexMatch[1];
        const parsed = this.parseJsonWithLogging<Record<string, any>>(indexMatch[2], `index${indexNum}`);
        if (parsed) {
          this.searchContext[`index${indexNum}`] = parsed;
        }
      }
    });

    const allWords: Record<string, any> = {};
    for (let i = 1; i <= indexParts.length; i++) {
      const indexVar = `index${i}`;
      if (this.searchContext[indexVar] && typeof this.searchContext[indexVar] === 'object') {
        Object.assign(allWords, this.searchContext[indexVar]);
      }
    }

    if (this.searchContext.w && typeof this.searchContext.w === 'object') {
      Object.assign(allWords, this.searchContext.w);
    }

    this.searchContext.w = allWords;
  }

  private initializeSearchEngine(nwSearchFntJs: string): void {
    try {
      // Create a sandboxed evaluation context
      const evalContext = (function(context: any) {
        // Create a function that evaluates the search engine code with our context
        const evalCode = `
          (function(context) {
            // Map context variables to local scope for the search engine
            var w = context.w;
            var fil = context.fil;
            var stopWords = context.stopWords;
            var linkToParent = context.linkToParent;
            var indexerLanguage = context.indexerLanguage;
            var doStem = context.doStem;
            var stemmer = context.stemmer;
            var trim = context.trim;
            var contains = context.contains;
            var inArray = context.inArray;
            
            // Define nwSearchFnt in our context
            ${nwSearchFntJs}
            
            // Return the constructor
            return nwSearchFnt;
          })(arguments[0]);
        `;

        return eval(evalCode);
      })(this.searchContext);

      // Store the constructor in our context
      this.searchContext.nwSearchFnt = evalContext;

    } catch (evalError: any) {
      throw new Error('Error evaluating nwSearchFnt.js: ' + evalError.message);
    }

    // Initialize the search engine
    if (typeof this.searchContext.nwSearchFnt === 'function') {
      // Create options mock
      this.searchContext.options = {
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
        getIndexerLanguage: () => {
          return this.searchContext.indexerLanguage || 'en';
        }
      };

      // Create utility mock
      this.searchContext.util = {
        debug: function() {}
      };

      // Ensure we have a proper index object structure
      if (!this.searchContext.index) {
        this.searchContext.index = {
          w: this.searchContext.w || {},
          fil: this.searchContext.fil || {},
          stopWords: this.searchContext.stopWords || [],
          link2parent: this.searchContext.linkToParent || {}
        };
      } else {
        this.searchContext.index.fil = this.searchContext.fil || this.searchContext.index.fil || {};
      }

      // Create the search engine instance
      this.searchContext.searchEngine = new this.searchContext.nwSearchFnt(
        this.searchContext.index, 
        this.searchContext.options, 
        this.searchContext.stemmer, 
        this.searchContext.util
      );
      
      // Expose performSearch if it exists
      if (this.searchContext.searchEngine && typeof this.searchContext.searchEngine.performSearch === 'function') {
        this.searchContext.performSearch = this.searchContext.searchEngine.performSearch.bind(this.searchContext.searchEngine);
      }
    }
  }

  async loadIndex(baseUrl: string): Promise<void> {
    const searchUrl = `${baseUrl.replace(/\/$/, '')}/oxygen-webhelp/app/search`;
    this.baseUrl = searchUrl + '/';
    
    try {
      // Setup isolated context instead of global
      this.setupSearchContext();

      // Download all files
      const nwSearchFntJs = await this.downloadSearchEngine(searchUrl);
      const indexParts = await this.downloadIndexParts(searchUrl);
      const metadataFiles = await this.downloadMetadataFiles(searchUrl);

      // Process metadata files into our context
      this.processStopwords(metadataFiles.stopwords);
      this.processFileInfoList(metadataFiles.htmlFileInfoList);

      // Process index files into our context
      this.processIndexParts(indexParts);

      // Initialize search engine with our context
      this.initializeSearchEngine(nwSearchFntJs);
      
    } catch (error: any) {
      throw new Error(`Failed to load search index: ${error.message}`);
    }
  }
  
  // Public method to perform searches using the loaded index
  performSearch(query: string, callback: (result: any) => void): void {
    if (this.searchContext.performSearch) {
      this.searchContext.performSearch(query, callback);
    } else {
      throw new Error('Search engine not initialized. Call loadIndex() first.');
    }
  }
  
  // Getter to access the search context if needed
  getSearchContext(): any {
    return this.searchContext;
  }
}

