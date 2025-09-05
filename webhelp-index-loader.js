const https = require('https');
const http = require('http');

/**
 * WebHelp Index Loader
 * Downloads and processes WebHelp search indices
 */
class WebHelpIndexLoader {
    constructor() {
        this.baseUrl = '';
    }

    /**
     * Download a file from URL
     */
    async downloadFile(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https://') ? https : http;
            
            client.get(url, (response) => {
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

    /**
     * Download search engine library
     */
    async downloadSearchEngine(searchUrl) {
        return await this.downloadFile(`${searchUrl}/nwSearchFnt.js`);
    }


    /**
     * Download index part files
     */
    async downloadIndexParts(searchUrl) {
        const indexParts = [];
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

    /**
     * Download metadata files
     */
    async downloadMetadataFiles(searchUrl) {
        const metaFiles = [
            { name: 'htmlFileInfoList.js', var: 'htmlFileInfoList' },
            { name: 'stopwords.js', var: 'stopwords' },
            { name: 'link-to-parent.js', var: 'linkToParent' },
            { name: 'keywords.js', var: 'keywords' }
        ];

        const loadedFiles = {};
        
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
        
        return loadedFiles;
    }

    /**
     * Setup global environment for WebHelp search
     */
    setupGlobalEnvironment() {
        // Create a sandbox-like global environment
        global.w = {};
        global.fil = {};
        global.stopWords = [];
        global.linkToParent = {};
        global.indexerLanguage = 'en';
        global.doStem = false;
        global.stemmer = null;
        
        // Debug/console functions for the library
        global.debug = function() {};
        global.warn = function() {};
        global.info = function() {};

        // Utility functions used by the search library
        global.trim = function(str, chars) {
            chars = chars || "\\s";
            return str.replace(new RegExp("^[" + chars + "]+", "g"), "")
                     .replace(new RegExp("[" + chars + "]+$", "g"), "");
        };

        global.contains = function(arrayOfWords, word) {
            for (var w in arrayOfWords) {
                if (arrayOfWords[w] === word) {
                    return true;
                }
            }
            return false;
        };

        global.inArray = function(needle, haystack) {
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i] == needle) return true;
            }
            return false;
        };
    }

    /**
     * Process stopwords file
     */
    processStopwords(stopwordsContent) {
        if (stopwordsContent) {
            try {
                // Extract JSON from var assignment
                const jsonMatch = stopwordsContent.match(/var\s+stopwords\s*=\s*(\[[\s\S]*?\]);?\s*(?:\/\/.*)?$/);
                if (jsonMatch) {
                    global.stopwords = JSON.parse(jsonMatch[1]);
                    global.stopWords = global.stopwords;
                }
            } catch (e) {
                // Skip if stopwords file has issues
            }
        }
    }

    /**
     * Process link-to-parent file
     */
    processLinkToParent(linkToParentContent) {
        if (linkToParentContent) {
            try {
                // Extract JSON from var assignment
                const jsonMatch = linkToParentContent.match(/var\s+linkToParent\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
                if (jsonMatch) {
                    global.linkToParent = JSON.parse(jsonMatch[1]);
                }
            } catch (e) {
                // Skip if link-to-parent file has issues
            }
        }
    }

    /**
     * Process keywords file
     */
    processKeywords(keywordsContent) {
        if (keywordsContent) {
            try {
                // Extract keywords variable
                const keywordsMatch = keywordsContent.match(/var\s+keywords\s*=\s*(\[[\s\S]*?\]);/);
                if (keywordsMatch) {
                    global.keywords = JSON.parse(keywordsMatch[1]);
                }
                
                // Extract ph variable
                const phMatch = keywordsContent.match(/var\s+ph\s*=\s*(\{[\s\S]*?\});/);
                if (phMatch) {
                    global.ph = JSON.parse(phMatch[1]);
                }
                
                // Extract keywordsInfo variable
                const keywordsInfoMatch = keywordsContent.match(/var\s+keywordsInfo\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
                if (keywordsInfoMatch) {
                    global.keywordsInfo = JSON.parse(keywordsInfoMatch[1]);
                }
            } catch (e) {
                // Skip if keywords file has issues
            }
        }
    }

    /**
     * Process file info list
     */
    processFileInfoList(htmlFileInfoListContent) {
        if (htmlFileInfoListContent) {
            try {
                // Extract htmlFileInfoList variable
                const htmlFileInfoListMatch = htmlFileInfoListContent.match(/var\s+htmlFileInfoList\s*=\s*(\[[\s\S]*?\]);/);
                if (htmlFileInfoListMatch) {
                    global.htmlFileInfoList = JSON.parse(htmlFileInfoListMatch[1]);
                }
                
                // Extract fil variable if present
                const filMatch = htmlFileInfoListContent.match(/var\s+fil\s*=\s*(\{[\s\S]*?\});/);
                if (filMatch) {
                    global.fil = JSON.parse(filMatch[1]);
                }
                
                // Check if we have either fil array or htmlFileInfoList array
                if (global.htmlFileInfoList && Array.isArray(global.htmlFileInfoList)) {
                    // Convert array to fil object format (index-based)
                    if (!global.fil || Object.keys(global.fil).length === 0) {
                        global.fil = {};
                        global.htmlFileInfoList.forEach((item, index) => {
                            global.fil[index.toString()] = item;
                        });
                    }
                }
            } catch (e) {
                // Skip if file info list has issues
            }
        }
    }

    /**
     * Process index part files
     */
    processIndexParts(indexParts) {
        // Load index parts and capture variables
        indexParts.forEach((part, idx) => {
            try {
                // Extract JSON from var assignment, handling multi-line and comments
                const indexMatch = part.match(/var\s+index(\d+)\s*=\s*(\{[\s\S]*?\});?\s*(?:\/\/.*)?$/);
                if (indexMatch) {
                    const indexNum = indexMatch[1];
                    const indexData = JSON.parse(indexMatch[2]);
                    global[`index${indexNum}`] = indexData;
                }
            } catch (e) {
                // Skip failed index parts
            }
        });

        // Combine all index objects into the main w object
        const allWords = {};
        for (let i = 1; i <= indexParts.length; i++) {
            const indexVar = `index${i}`;
            if (global[indexVar] && typeof global[indexVar] === 'object') {
                Object.assign(allWords, global[indexVar]);
            }
        }
        
        // Also include any words directly added to global.w
        if (global.w && typeof global.w === 'object') {
            Object.assign(allWords, global.w);
        }
        
        global.w = allWords;
    }

    /**
     * Initialize search engine
     */
    initializeSearchEngine(nwSearchFntJs) {
        try {
            // Transform function declaration to global assignment
            const transformedSearchFnt = nwSearchFntJs.replace(
                /^function\s+nwSearchFnt\s*\(/m, 
                'global.nwSearchFnt = function('
            );
            eval(transformedSearchFnt);
        } catch (evalError) {
            throw new Error('Error evaluating nwSearchFnt.js: ' + evalError.message);
        }
        
        // Initialize the search engine
        if (typeof global.nwSearchFnt === 'function') {
            // Create options mock
            global.options = {
                get: function(key) {
                    const defaults = {
                        'webhelp.search.default.operator': 'or',
                        'webhelp.labels.generation.mode': 'disable',
                        'use.stemming': false
                    };
                    return defaults[key];
                },
                getBoolean: function(key) {
                    return this.get(key) === true || this.get(key) === 'true';
                },
                getIndexerLanguage: function() {
                    return global.indexerLanguage || 'en';
                }
            };

            // Create utility mock
            global.util = {
                debug: function() {}
            };

            // Ensure we have a proper index object structure
            if (!global.index) {
                global.index = {
                    w: global.w || {},
                    fil: global.fil || {},
                    stopWords: global.stopWords || [],
                    link2parent: global.linkToParent || {}
                };
            } else {
                // Make sure our fil object is in the index
                global.index.fil = global.fil || global.index.fil || {};
            }

            // Create the search engine instance
            global.searchEngine = new global.nwSearchFnt(global.index, global.options, global.stemmer, global.util);
            
            // Expose performSearch if it exists
            if (global.searchEngine && typeof global.searchEngine.performSearch === 'function') {
                global.performSearch = global.searchEngine.performSearch.bind(global.searchEngine);
            }
        }
    }

    /**
     * Load complete search index from URL
     */
    async loadIndex(baseUrl) {
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
            
        } catch (error) {
            throw new Error(`Failed to load search index: ${error.message}`);
        }
    }
}

module.exports = WebHelpIndexLoader;