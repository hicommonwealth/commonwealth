import {
  CompleteMultipartUploadCommandOutput,
  PutObjectCommand,
  S3,
} from '@aws-sdk/client-s3';
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

function formatS3Url(data: CompleteMultipartUploadCommandOutput) {
  return config.APP_ENV === 'local'
    ? `https://s3.amazonaws.com/${data.Bucket}/${data.Key}`
    : `https://${data.Bucket}/${data.Key}`;
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
        url: formatS3Url(data),
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
