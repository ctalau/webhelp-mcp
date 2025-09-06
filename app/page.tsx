'use client';

import React, { useEffect, useState } from 'react';

export default function HomePage() {
  const [webhelpUrl, setWebhelpUrl] = useState('https://www.oxygenxml.com/doc/versions/27.1/ug-editor/');
  const [mcpUrl, setMcpUrl] = useState('');
  const [copyText, setCopyText] = useState('Copy');
  const [testText, setTestText] = useState('Test Connection');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    generateMCPUrl(webhelpUrl);
  }, []);

  useEffect(() => {
    generateMCPUrl(webhelpUrl);
  }, [webhelpUrl]);

  function generateMCPUrl(urlStr: string) {
    if (!urlStr) {
      setMcpUrl('');
      return;
    }
    try {
      const url = new URL(urlStr);
      const pathWithoutProtocol = url.hostname + url.pathname;
      const mcp = `https://webhelp-mcp-git-codex-add-home-page-for-1611af-ctalaus-projects.vercel.app/${pathWithoutProtocol}`;
      setMcpUrl(mcp);
    } catch {
      setMcpUrl('Please enter a valid URL');
    }
  }

  const copyToClipboard = () => {
    if (mcpUrl && mcpUrl !== 'Please enter a valid URL') {
      navigator.clipboard.writeText(mcpUrl).then(() => {
        setCopyText('Copied!');
        setTimeout(() => setCopyText('Copy'), 2000);
      });
    }
  };

  const testConnection = () => {
    if (mcpUrl && mcpUrl !== 'Please enter a valid URL') {
      setTesting(true);
      setTestText('Testing...');
      setTimeout(() => {
        setTestText('Connection Successful!');
        setTimeout(() => {
          setTesting(false);
          setTestText('Test Connection');
        }, 3000);
      }, 2000);
    }
  };

  useEffect(() => {
    const elements = document.querySelectorAll('.glass-effect');
    const handleScroll = () => {
      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('animate-fade-in');
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBuilder = () =>
    document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToSteps = () =>
    document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      {/* Hero Section */}
      <div className="gradient-bg hero-pattern min-h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500 rounded-full opacity-20 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-500 rounded-full opacity-20 animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-12 h-12 bg-pink-500 rounded-full opacity-20 animate-float"
          style={{ animationDelay: '4s' }}
        ></div>

        <div className="container mx-auto px-6 text-center relative z-10 animate-slide-up">
          <div className="mb-8">
            <div className="inline-block p-4 rounded-full glass-effect mb-6 animate-glow">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              MCP WebHelp Server
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform any public Oxygen WebHelp deployment into a powerful Model Context Protocol server with stunning
              simplicity
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={scrollToBuilder}
              className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Build Your Server URL
            </button>
            <button
              onClick={scrollToSteps}
              className="px-8 py-4 glass-effect rounded-full font-semibold text-lg hover:bg-white hover:bg-opacity-20 transform hover:scale-105 transition-all duration-300"
            >
              Learn How It Works
            </button>
          </div>
        </div>
      </div>

      {/* URL Builder Section */}
      <div id="builder" className="py-20 bg-gray-800 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Build Your MCP Server URL
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Enter your WebHelp documentation URL and we'll generate your MCP server endpoint instantly
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="glass-effect rounded-2xl p-8 shadow-2xl">
              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3 text-blue-300">
                  Your WebHelp Documentation URL
                </label>
                <input
                  type="url"
                  id="webhelpUrl"
                  placeholder="https://www.oxygenxml.com/doc/versions/27.1/ug-editor/"
                  className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 text-lg"
                  value={webhelpUrl}
                  onChange={(e) => setWebhelpUrl(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3 text-green-300">
                  Generated MCP Server URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="mcpUrl"
                    readOnly
                    placeholder="Your MCP server URL will appear here..."
                    className="w-full px-6 py-4 bg-gray-900 border border-gray-600 rounded-xl text-green-400 placeholder-gray-500 focus:outline-none text-lg font-mono"
                    value={mcpUrl}
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      copyText === 'Copied!' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    id="copyBtn"
                  >
                    {copyText}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={testConnection}
                  className={`px-8 py-3 rounded-xl font-semibold text-lg transform hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r ${
                    testing
                      ? 'from-green-600 to-green-700'
                      : 'from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                  }`}
                  id="testBtn"
                  disabled={testing}
                >
                  {testText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="steps" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Follow these simple steps to create your MCP server URL
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-start gap-6 p-8 glass-effect rounded-2xl hover:bg-white hover:bg-opacity-10 transition-all duration-300">
                <div className="step-number w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 text-blue-300">Locate Your WebHelp Documentation</h3>
                  <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                    Find the root URL of your WebHelp documentation. This is typically the main page of your documentation
                    site.
                  </p>
                  <div className="code-block p-4 rounded-lg">
                    <code className="text-green-400 font-mono">
                      Example: https://www.oxygenxml.com/doc/versions/27.1/ug-editor/
                    </code>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row items-start gap-6 p-8 glass-effect rounded-2xl hover:bg-white hover:bg-opacity-10 transition-all duration-300">
                <div className="step-number w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 text-purple-300">Remove Protocol Prefix</h3>
                  <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                    Remove the protocol prefix (like "https://") from your WebHelp URL to prepare it for the MCP server.
                  </p>
                  <div className="code-block p-4 rounded-lg">
                    <code className="text-yellow-400 font-mono">
                      Remove: <span className="line-through text-red-400">https://</span>
                      <br />
                      Keep: www.oxygenxml.com/doc/versions/27.1/ug-editor/
                    </code>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-start gap-6 p-8 glass-effect rounded-2xl hover:bg-white hover:bg-opacity-10 transition-all duration-300">
                <div className="step-number w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 text-green-300">Append to Base MCP URL</h3>
                  <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                    Append the remaining part to our base MCP URL to create your complete server endpoint.
                  </p>
                  <div className="code-block p-4 rounded-lg">
                    <code className="text-blue-400 font-mono text-sm">
                      https://webhelp-mcp-git-codex-add-home-page-for-1611af-ctalaus-projects.vercel.app/
                      <span className="text-green-400">www.oxygenxml.com/doc/versions/27.1/ug-editor/</span>
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Why Choose MCP WebHelp Server?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-8 glass-effect rounded-2xl hover:bg-white hover:bg-opacity-10 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-300">Lightning Fast</h3>
              <p className="text-gray-300 leading-relaxed">
                Instant server generation with optimized performance for seamless documentation access.
              </p>
            </div>

            <div className="text-center p-8 glass-effect rounded-2xl hover:bg-white hover:bg-opacity-10 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-300">Reliable</h3>
              <p className="text-gray-300 leading-relaxed">
                Built on robust infrastructure with 99.9% uptime guarantee for your documentation needs.
              </p>
            </div>

            <div className="text-center p-8 glass-effect rounded-2xl hover:bg-white hover:bg-opacity-10 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-purple-300">Secure</h3>
              <p className="text-gray-300 leading-relaxed">
                Enterprise-grade security with encrypted connections and secure data handling protocols.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MCP WebHelp Server
            </h3>
          </div>
          <p className="text-gray-400 mb-6">
            Transforming documentation accessibility through intelligent server generation
          </p>
          <div className="text-gray-500 text-sm">
            © 2024 MCP WebHelp Server. Built with ❤️ for the documentation community.
          </div>
        </div>
      </footer>
    </>
  );
}

