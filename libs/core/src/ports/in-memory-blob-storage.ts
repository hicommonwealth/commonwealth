import type { BlobStorage } from './interfaces';

export const inMemoryBlobUrl = 'http://commonblob.com/';
export const inMemoryBlobs = new Map();

export const inMemoryBlobStorage: BlobStorage = {
  name: 'in-memory-blob-storage',
  dispose: () => {
    inMemoryBlobs.clear();
    return Promise.resolve();
  },
  upload: ({ bucket, key, content }) => {
    inMemoryBlobs.set(bucket.concat(key), content);
    return Promise.resolve({
      url: `${inMemoryBlobUrl}${bucket}/${key}`,
      location: `${inMemoryBlobUrl}${bucket}/${key}`,
    });
  },
  exists: ({ bucket, key }) =>
    Promise.resolve(inMemoryBlobs.has(bucket.concat(key))),
  getSignedUrl: ({ bucket, key }) =>
    Promise.resolve(`${inMemoryBlobUrl}${bucket}/${key}`),
};
