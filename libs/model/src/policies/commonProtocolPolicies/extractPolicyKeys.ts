import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const policiesDir = __dirname;

export async function extractPolicyKeys() {
  const files = await fs.readdir(policiesDir);

  const policyFiles = files.filter(
    (f) =>
      (f.endsWith('.ts') || f.endsWith('.js')) &&
      !f.startsWith('.') &&
      path.resolve(policiesDir, f) !== __filename, // exclude this file itself
  );

  const allKeys: Record<string, string[]> = {};

  for (const file of policyFiles) {
    const fullPath = path.join(policiesDir, file);

    try {
      const module = await import(pathToFileURL(fullPath).href);

      if (typeof module.default === 'function') {
        const result = module.default();

        if (result && typeof result === 'object') {
          allKeys[file] = Object.keys(result);
        }
      }
    } catch (err) {
      console.error(`Error loading or executing ${file}:`, err);
    }
  }

  console.log(JSON.stringify(allKeys, null, 2));

  return allKeys;
}
