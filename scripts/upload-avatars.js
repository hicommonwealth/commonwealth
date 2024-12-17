import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { R2BlobStorage } from '../libs/adapters/src/blobStorage/r2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ATTACHMENTS_DIR = path.join(process.env.HOME, 'attachments');

async function uploadAvatars() {
  const storage = new R2BlobStorage({
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  });

  const files = fs
    .readdirSync(ATTACHMENTS_DIR)
    .filter((f) => f.startsWith('Frame+') && f.endsWith('.png'));

  console.log(`Found ${files.length} avatar files to upload`);

  for (const file of files) {
    const fileContent = fs.readFileSync(path.join(ATTACHMENTS_DIR, file));
    try {
      await storage.uploadBuffer({
        bucket: 'communities',
        key: `community-avatars/${file}`,
        body: fileContent,
        contentType: 'image/png',
      });
      console.log(`✓ Uploaded ${file} successfully`);
    } catch (error) {
      console.error(`✗ Failed to upload ${file}:`, error);
    }
  }
}

uploadAvatars().catch(console.error);
