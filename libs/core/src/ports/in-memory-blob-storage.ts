import type { BlobStorage } from './interfaces';

const blobs = new Map();

export const inMemoryBlobStorage: BlobStorage = {
  name: 'in-memory-blob-storage',
  dispose: () => {
    blobs.clear();
    return Promise.resolve();
  },
  upload: ({ bucket, key, content }) => {
    blobs.set(bucket.concat(key), content);
    return Promise.resolve({
      url: `http://commonblob.com/${bucket}/${key}`,
      location: key,
    });
  },
  exists: ({ bucket, key }) => Promise.resolve(blobs.has(bucket.concat(key))),
  getSignedUrl: ({ bucket, key }) =>
    Promise.resolve(`http://commonblob.com/${bucket}/${key}`),
};
