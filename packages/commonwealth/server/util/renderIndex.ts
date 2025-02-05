import { config } from '@hicommonwealth/model';
import { promises as fs } from 'fs';
import handlebars from 'handlebars';

let cache: string | null = null;

// renders index.html file with dynamic metadata
export async function renderIndex(indexFilePath: string): Promise<string> {
  if (cache) {
    return cache;
  }
  const templateSource = await fs.readFile(indexFilePath, 'utf8');
  const template = handlebars.compile(templateSource);
  const data = {
    FARCASTER_MANIFEST_DOMAIN: config.CONTESTS.FARCASTER_MANIFEST_DOMAIN,
  };
  cache = template(data);
  return cache;
}
