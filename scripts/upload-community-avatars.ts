import { R2BlobStorage } from '@hicommonwealth/adapters';
import * as fs from 'fs';
import * as path from 'path';

const ATTACHMENTS_DIR = path.join(process.env.HOME!, 'attachments');

async function uploadAvatars() {
  const storage = R2BlobStorage();
  const files = fs
    .readdirSync(ATTACHMENTS_DIR)
    .filter((f) => f.startsWith('Frame+') && f.endsWith('.png'));

  for (const file of files) {
    const fileContent = fs.readFileSync(path.join(ATTACHMENTS_DIR, file));
    try {
      await storage.uploadBuffer({
        bucket: 'communities',
        key: `community-avatars/${file}`,
        body: fileContent,
        contentType: 'image/png',
      });
      console.log(`Uploaded ${file} successfully`);
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error);
    }
  }
}

uploadAvatars().catch(console.error);
