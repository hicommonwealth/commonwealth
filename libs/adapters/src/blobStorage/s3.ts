import { CompleteMultipartUploadCommandOutput, S3 } from '@aws-sdk/client-s3';
import { BlobBucket, type BlobStorage } from '@hicommonwealth/core';
import { config } from '../config';
import { exists_S3sdk, getSignedUrl_S3sdk, upload_S3sdk } from './util';

const s3Buckets: Partial<Record<BlobBucket, string>> =
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

function formatS3Url(
  bucket: BlobBucket,
  data: CompleteMultipartUploadCommandOutput,
) {
  // TODO: Consider moving blob mappings and cdn rules to config (.env)
  return config.APP_ENV === 'local' || bucket === 'archives'
    ? `https://s3.amazonaws.com/${data.Bucket}/${data.Key}`
    : `https://${data.Bucket}/${data.Key}`;
}

export const S3BlobStorage = (): BlobStorage => {
  const client = new S3();
  const name = 'S3BlobStorage';
  return {
    name,
    dispose: () => {
      client.destroy();
      return Promise.resolve();
    },

    upload: async (options) => {
      const data = await upload_S3sdk(name, client, s3Buckets, options);
      return {
        location: data.Location,
        url: formatS3Url(options.bucket, data),
      };
    },

    exists: async (options) => exists_S3sdk(name, client, s3Buckets, options),

    getSignedUrl: async (options) =>
      getSignedUrl_S3sdk(name, client, s3Buckets, options),
  };
};
