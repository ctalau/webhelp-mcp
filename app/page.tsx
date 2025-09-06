"use client";

import { useEffect, useState } from "react";

const sampleWebHelp = "https://www.oxygenxml.com/doc/versions/27.1/ug-editor/";
const samplePath = "www.oxygenxml.com/doc/versions/27.1/ug-editor/";

export default function HomePage() {
  const [baseUrl, setBaseUrl] = useState("");
  const [webhelpRoot, setWebhelpRoot] = useState("");
  const [builtUrl, setBuiltUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin + "/");
    }
  }, []);

  useEffect(() => {
    if (!webhelpRoot || !baseUrl) {
      setBuiltUrl("");
      return;
    }
    try {
      const url = new URL(webhelpRoot);
      const path = url.host + url.pathname;
      setBuiltUrl(baseUrl + path);
    } catch {
      setBuiltUrl("");
    }
  }, [webhelpRoot, baseUrl]);

  const builtPath = builtUrl.replace(baseUrl, "");

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          WebHelp Search MCP
        </h1>
        <p className="text-lg">
          This service exposes a Model Context Protocol (MCP) server for any public Oxygen WebHelp deployment. To create a server URL, append the WebHelp site's domain and path to this service's base URL.
        </p>

        <h2 className="text-2xl font-semibold">Build your MCP server URL</h2>
        <ol className="list-decimal list-inside text-left space-y-2">
          <li>
            Locate the root URL of your WebHelp documentation. Example: <code className="font-mono text-sm">{sampleWebHelp}</code>
          </li>
          <li>Remove the protocol prefix (e.g. "https://").</li>
          <li>
            Append the remaining part to the base MCP URL: <code className="font-mono text-sm"><span className="text-blue-600">{baseUrl || "https://your-mcp-host/"}</span><span className="text-green-600">{samplePath}</span></code>
          </li>
        </ol>

        <form className="bg-white/70 backdrop-blur p-6 rounded-xl shadow-lg space-y-4 text-left">
          <label htmlFor="webhelp" className="block text-sm font-medium text-gray-700">
            WebHelp Root URL
          </label>
          <input
            id="webhelp"
            type="url"
            className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none"
            value={webhelpRoot}
            onChange={(e) => setWebhelpRoot(e.target.value)}
            placeholder="https://example.com/docs/"
          />
          {builtUrl && (
            <div className="font-mono text-lg">
              <span className="text-blue-600">{baseUrl}</span>
              <span className="text-green-600">{builtPath}</span>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
