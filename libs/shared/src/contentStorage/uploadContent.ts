import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { CONTENT_BUCKET_NAME } from '../constants';

export async function uploadContent(content: string): Promise<string | null> {
  const s3Client = new S3Client({ region: 'us-east-1' });
  const fileId = uuidv4();

  const params = {
    Bucket: CONTENT_BUCKET_NAME,
    Key: `${fileId}.md`,
    Body: content,
    ContentType: 'text/markdown',
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  return fileId;
}
