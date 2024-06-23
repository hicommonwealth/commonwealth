import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CONTENT_BUCKET_NAME } from '../constants';

export async function getContent(
  ids: string[],
): Promise<Record<string, string | null>> {
  const s3Client = new S3Client({ region: 'us-east-1' });
  const result: Record<string, string | null> = {};

  await Promise.all(
    ids.map(async (id) => {
      const params = {
        Bucket: CONTENT_BUCKET_NAME,
        Key: `${id}.md`,
      };

      try {
        const command = new GetObjectCommand(params);
        const response = await s3Client.send(command);

        if (response.Body) {
          result[id] = await response.Body.transformToString();
        } else {
          throw new Error('Empty response body');
        }
      } catch (error) {
        console.error(`Error retrieving file ${id} from S3:`, error);
        result[id] = null;
      }
    }),
  );

  return result;
}
