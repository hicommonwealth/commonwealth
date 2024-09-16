import { Disposer, logger } from '@hicommonwealth/core';
import { hasher } from 'node-object-hash';

const log = logger(import.meta);
const hashInstance = hasher({
  coerce: true,
  sort: true,
  trim: true,
  alg: 'sha256',
  enc: 'hex',
});

const adapters = new Map<string, Disposable>();
const defaultAdapters = new Map<string, string>();

export interface Disposable {
  dispose: Disposer;
}

type CreateAdapterFactory<
  Metadata extends Record<string, unknown>,
  Adapter extends Disposable,
> = (metadata: Metadata) => AdapterFactory<Metadata, Adapter>;

interface AdapterFactory<
  Metadata extends Record<string, unknown>,
  Adapter extends Disposable,
> {
  readonly name: string;
  readonly metadata: Metadata;

  createAdapter(metadata: Metadata): Adapter;
}

function port<
  Metadata extends Record<string, unknown>,
  Adapter extends Disposable,
>(portName: string, inMemoryAdapterFactory: AdapterFactory<Metadata, Adapter>) {
  return function (
    adapterFactory?: AdapterFactory<Metadata, Adapter>,
    isDefault?: boolean,
  ) {
    // always prioritize provided adapter factories
    if (adapterFactory) {
      const metadataHash = hashInstance.hash(adapterFactory.metadata);
      const key = `${portName}.${adapterFactory.name}.${metadataHash}`;
      let adapter = adapters.get(key);

      if (!adapter) {
        log.info(`[binding adapter] ${key}`);
        adapter = adapterFactory.createAdapter(adapterFactory.metadata);
        adapters.set(key, adapter);
      }

      if (isDefault) defaultAdapters.set(portName, key);
      return adapter as Adapter;
    }

    // return the default port adapter if available
    const adapterKey = defaultAdapters.get(portName);
    if (adapterKey) {
      const adapter = adapters.get(adapterKey);
      if (adapter) return adapter as Adapter;
      // theoretically should never occur (remove later?)
      throw new Error(`Default adapter for port ${portName} not found!`);
    }

    // if no default adapter found then set/use in-memory adapter as default
    const adapter = inMemoryAdapterFactory.createAdapter(
      inMemoryAdapterFactory.metadata,
    );

    const key = `${portName}.in-memory-adapter`;
    log.info(`[binding adapter] ${key}`);
    defaultAdapters.set(portName, key);
    adapters.set(key, adapter);
    return adapter as Adapter;
  };
}

const blobStorage = port('BlobStorage', {
  name: 'in-memory-blob-storage',
  metadata: { accessKey: 'accessKey' },
  createAdapter: (metadata: { accessKey: string }) => ({
    dispose: () => Promise.resolve(),
    upload: () => Promise.resolve(),
  }),
});

interface BlobStorage extends Disposable {
  upload(): Promise<void>;
}

type R2Metadata = { accessKey: string };
const createR2AdapterFactory: CreateAdapterFactory<R2Metadata, BlobStorage> = (
  metadata: R2Metadata,
) => {
  return {
    name: 'R2BlobStorage',
    metadata,
    createAdapter: (metadata: R2Metadata) => ({
      dispose: () => Promise.resolve(),
      upload: () => Promise.resolve(),
    }),
  };
};

// explicitly set R2 adapter as default
let provider = blobStorage(
  createR2AdapterFactory({ accessKey: 'accessKey' }),
  true,
);

// example use of default provider (in this case R2)
provider = blobStorage();

// example use of S3 supposing metadata has already set
provider = blobStorage(createS3AdapterFactory());

await provider.upload();
