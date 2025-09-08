import { NextRequest, NextResponse } from 'next/server';
import { WebHelpSearchClient } from '../../../lib/webhelp-search-client';

export async function POST(req: NextRequest) {
  const { url, query } = await req.json();
  const client = new WebHelpSearchClient();
  const result = await client.semanticSearch(query, url);
  return NextResponse.json(result);
}

