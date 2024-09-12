import type { S3 } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BlobBucket, BlobStorage } from '@hicommonwealth/core';

export type BlobStorageAdapterNames = 'S3BlobStorage' | 'R2BlobStorage';

export function isSupportedBucket(
  adapterName: BlobStorageAdapterNames,
  buckets: Partial<Record<BlobBucket, string>>,
  bucketName: BlobBucket,
) {
  if (!buckets[bucketName])
    throw new Error(`${bucketName} is not supported in ${adapterName}`);
}

export async function getSignedUrl_S3sdk(
  adapterName: BlobStorageAdapterNames,
  client: S3,
  supportedBuckets: Partial<Record<BlobBucket, string>>,
  options: Parameters<BlobStorage['getSignedUrl']>[0],
) {
  isSupportedBucket(adapterName, supportedBuckets, options.bucket);
  return await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: supportedBuckets[options.bucket],
      Key: options.key,
      ContentType: options.contentType,
    }),
    {
      expiresIn: options.ttl,
    },
  );
}

export async function exists_S3sdk(
  adapterName: BlobStorageAdapterNames,
  client: S3,
  supportedBuckets: Partial<Record<BlobBucket, string>>,
  options: Parameters<BlobStorage['exists']>[0],
) {
  isSupportedBucket(adapterName, supportedBuckets, options.bucket);
  try {
    await client.headObject({
      Bucket: supportedBuckets[options.bucket],
      Key: options.key,
    });
    return true;
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e && e.statusCode === 404)
      return false;
    else throw e;
  }
}

export async function upload_S3sdk(
  adapterName: BlobStorageAdapterNames,
  client: S3,
  supportedBuckets: Partial<Record<BlobBucket, string>>,
  options: Parameters<BlobStorage['upload']>[0],
) {
  isSupportedBucket(adapterName, supportedBuckets, options.bucket);
  const data = await new Upload({
    client,
    params: {
      Bucket: supportedBuckets[options.bucket],
      Key: options.key,
      Body: options.content,
      ContentType: options.contentType,
    },
  }).done();

  if (!data.Location) throw Error('Upload failed');
  return data as typeof data & { Location: string };
}
