import { S3 } from '@aws-sdk/client-s3';
import { BlobBucket, type BlobStorage } from '@hicommonwealth/core';
import { config } from '../config';
import { exists_S3sdk, getSignedUrl_S3sdk, upload_S3sdk } from './util';

const s3Buckets: Partial<Record<BlobBucket, string>> =
  config.APP_ENV === 'local'
    ? {
        threadVersionHistories: 'local.thread-version-histories',
        threads: 'local.threads',
        comments: 'local.comments',
        commentVersionHistories: 'local.commentVersionHistories',
      }
    : {
        threadVersionHistories: 'thread-version-histories',
        threads: 'threads',
        comments: 'comments',
        commentVersionHistories: 'commentVersionHistories',
      };

export const R2BlobStorage = (): BlobStorage => {
  const client = new S3();
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
        // TODO: update URL when I have R2 access
        url: `https://s3.amazonaws.com/${data.Bucket}/${data.Key}`,
      };
    },

    exists: async (options) => exists_S3sdk(name, client, s3Buckets, options),

    getSignedUrl: async (options) =>
      getSignedUrl_S3sdk(name, client, s3Buckets, options),
  };
};
