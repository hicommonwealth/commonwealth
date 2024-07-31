import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BlobBucket, type BlobStorage } from '@hicommonwealth/core';
import { config } from '../config';

const s3Buckets: Record<BlobBucket, string> =
  config.APP_ENV === 'local'
    ? {
        assets: 'local.assets',
        archives: 'local.outbox-event-stream-archive',
        sitemap: 'local.sitemap',
      }
    : {
        assets: 'assets.commonwealth.im',
        archives: 'outbox-event-stream-archive',
        sitemap: 'sitemap.commonwealth.im',
      };

/**
 * Creates a valid S3 asset url from an upload.Location url
 * @param uploadLocation The url returned by the Upload method of @aws-sdk/lib-storage
 * @param bucketName The name of the bucket or the domain (alias) of the bucket. Defaults to assets.commonwealth.im
 */
function formatS3Url(uploadLocation: string, bucketName: string): string {
  return (
    `https://${bucketName}/` + uploadLocation.split('amazonaws.com/').pop()
  );
}

export const S3BlobStorage = (): BlobStorage => {
  const client = new S3();
  return {
    name: 'S3BlobStorage',
    dispose: () => {
      client.destroy();
      return Promise.resolve();
    },

    upload: async ({ bucket, key, content, contentType }) => {
      const data = await new Upload({
        client,
        params: {
          Bucket: s3Buckets[bucket],
          Key: key,
          Body: content,
          ContentType: contentType,
        },
      }).done();

      if (!data.Location) throw Error('Upload failed');

      return {
        location: data.Location,
        url: formatS3Url(data.Location, s3Buckets[bucket]),
      };
    },

    exists: async ({ bucket, key }) => {
      try {
        await client.headObject({ Bucket: s3Buckets[bucket], Key: key });
        return true;
      } catch (e) {
        if (e instanceof Error && 'statusCode' in e && e.statusCode === 404)
          return false;
        else throw e;
      }
    },

    getSignedUrl: async ({ bucket, key, contentType, ttl }) =>
      await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: s3Buckets[bucket],
          Key: key,
          ContentType: contentType,
        }),
        {
          expiresIn: ttl,
        },
      ),
  };
};
