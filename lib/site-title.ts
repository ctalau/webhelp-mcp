import { downloadFile } from './downloadFile';

export function extractTitleFromContent(content: string): string {
  if (!content.includes('<title>')) {
    return '';
  }
  let titleAndAfter = content.split('<title>')[1];
  if (!titleAndAfter.includes('</title>')) {
    return titleAndAfter;
  }
  return titleAndAfter.split('</title>')[0];
}

export async function fetchSiteTitle(url: string): Promise<string | null> {
  try {
    const html = await downloadFile(url);
    const title = extractTitleFromContent(html).trim();
    return title || null;
  } catch (e) {
    console.error('Failed to fetch site title for', url, e);
    return null;
  }
}
