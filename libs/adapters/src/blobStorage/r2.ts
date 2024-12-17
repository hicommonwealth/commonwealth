import { S3 } from '@aws-sdk/client-s3';
import { BlobBucket, type BlobStorage } from '@hicommonwealth/core';
import { config } from '../config';
import { exists_S3sdk, getSignedUrl_S3sdk, upload_S3sdk } from './util';

const s3Buckets: Partial<Record<BlobBucket, string>> =
  config.APP_ENV !== 'production'
    ? {
        threads: 'dev-threads',
        comments: 'dev-comments',
        communities: 'dev-communities',
      }
    : {
        threads: 'threads',
        comments: 'comments',
        communities: 'communities',
      };

export const R2BlobStorage = (): BlobStorage => {
  const client = new S3({
    endpoint: `https://${config.CLOUDFLARE.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.CLOUDFLARE.R2.ACCESS_KEY_ID!,
      secretAccessKey: config.CLOUDFLARE.R2.SECRET_ACCESS_KEY!,
    },
    region: 'auto',
  });
  const name = 'R2BlobStorage';
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
        url: `https://${data.Bucket}.common.xyz/${data.Key}`,
      };
    },

    exists: async (options) => exists_S3sdk(name, client, s3Buckets, options),

    getSignedUrl: async (options) =>
      getSignedUrl_S3sdk(name, client, s3Buckets, options),
  };
};
