'use client';

import { useState } from 'react';

export default function SemanticSearchPage() {
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      const res = await fetch('/api/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, query })
      });
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setResult({ error: err.message, results: [] });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="WebHelp base URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Search query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2"
        >
          Search
        </button>
      </form>
      {result && (
        <pre className="bg-gray-100 p-2 overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

