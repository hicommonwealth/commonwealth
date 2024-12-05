import {
  Cache,
  CacheNamespaces,
  cache,
  dispose,
  disposeAdapter,
} from '@hicommonwealth/core';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  Mocked,
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { CacheDecorator } from '../../src/redis';
import { CacheKeyDuration } from '../../src/utils';
chai.use(chaiAsPromised);

describe('CacheDecorator', () => {
  let cacheDecorator: CacheDecorator;
  let mockCache: Mocked<Cache>;

  beforeAll(async () => {
    cacheDecorator = new CacheDecorator();
  });

  afterAll(async () => {
    await dispose()();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    disposeAdapter(cache().name);
    mockCache = {
      name: 'mocked-cache',
      dispose: vi.fn(),
      ready: vi.fn().mockResolvedValue(true),
      isReady: vi.fn().mockReturnValue(true),
      getKey: vi.fn(),
      setKey: vi.fn(),
      getKeys: vi.fn(),
      setKeys: vi.fn(),
      getNamespaceKeys: vi.fn(),
      deleteKey: vi.fn(),
      deleteNamespaceKeys: vi.fn(),
      flushAll: vi.fn(),
      incrementKey: vi.fn(),
      decrementKey: vi.fn(),
      getKeyTTL: vi.fn(),
      setKeyTTL: vi.fn(),
    };
    cache({
      key: 'mocked.cache.key',
      adapter: mockCache,
      isDefault: true,
    });
  });

  describe('cacheWrap', () => {
    describe('verify general flow', () => {
      const keys = [
        'test-key',
        () => 'test-key',
        () => {
          return { cacheKey: 'test-key', cacheDuration: 100 };
        },
      ];
      keys.forEach((key) => {
        test('should cache the function result and return it', async () => {
          const fn = async () => 'test-result';
          const duration = 60;

          mockCache.getKey.mockResolvedValue(null);
          mockCache.setKey.mockResolvedValue(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();
          expect(result).to.equal('test-result');
          expect(mockCache.getKey).toHaveBeenCalledOnce();
          expect(mockCache.setKey).toHaveBeenCalledOnce();
        });

        test('should return the cached result if it exists', async () => {
          const fn = async () => 'new-result';
          const key = 'test-key';
          const duration = 60;

          mockCache.getKey.mockResolvedValue(JSON.stringify('cached-result'));

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('cached-result');
          expect(mockCache.getKey).toHaveBeenCalledOnce();
          expect(mockCache.setKey).not.toHaveBeenCalled();
        });

        test('should call the function if redis cache not initialized', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 60;

          mockCache.isReady.mockReturnValue(false);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockCache.getKey).not.toHaveBeenCalled();
          expect(mockCache.setKey).not.toHaveBeenCalled();
        });

        test('if override is true skip lookup and still set cache', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 60;

          mockCache.setKey.mockResolvedValue(true);

          const wrapFn = cacheDecorator.cacheWrap(
            true,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockCache.getKey).not.toHaveBeenCalled();
          expect(mockCache.setKey).toHaveBeenCalled();
        });

        test('duration null skip caching', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = null;

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration as unknown as number,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockCache.getKey).not.toHaveBeenCalled();
          expect(mockCache.setKey).not.toHaveBeenCalled();
        });

        test('duration 0 dont skip caching', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 0;

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockCache.getKey).toHaveBeenCalled();
          expect(mockCache.setKey).toHaveBeenCalled();
        });

        test('result null skip caching', async () => {
          const fn = async () => null;
          const key = 'test-key';
          const duration = 60;

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal(null);
          expect(mockCache.getKey).toHaveBeenCalled();
          expect(mockCache.setKey).not.toHaveBeenCalled();
        });

        test('response 0 from wrapped function allowed to get from cache', async () => {
          const fn = async () => 0;
          const key = 'test-key';
          const duration = 60;
          mockCache.getKey.mockResolvedValue('0');

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal(0);
          expect(mockCache.getKey).toHaveBeenCalled();
          expect(mockCache.setKey).not.toHaveBeenCalled();
        });

        test('response 0 from wrapped function allowed to set in cache', async () => {
          const fn = async () => 0;
          const key = 'test-key';
          const duration = 60;

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal(0);
          expect(mockCache.getKey).toHaveBeenCalled();
          expect(mockCache.setKey).toHaveBeenCalled();
        });
      });

      [null, () => null].forEach((key) => {
        test('key null skip caching', async () => {
          const fn = async () => 'test-result';
          const duration = 60;

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key as unknown as string,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockCache.getKey).not.toHaveBeenCalled();
          expect(mockCache.setKey).not.toHaveBeenCalled();
        });
      });
    });

    describe('verify function returning CacheKeyDuration', () => {
      test('key function if returns object with no cacheKey, skip caching', async () => {
        const fn = async () => 'test-result';
        const duration = 60;
        const keyfn = () => {
          return {} as unknown as CacheKeyDuration;
        };

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          keyfn,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockCache.getKey).not.toHaveBeenCalled();
        expect(mockCache.setKey).not.toHaveBeenCalled();
      });

      test('key function if returns object with only cacheKey, skip caching', async () => {
        const fn = async () => 'test-result';
        const duration = 60;
        const key = () => {
          return { cacheKey: 'test-key' } as unknown as CacheKeyDuration;
        };

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockCache.getKey).not.toHaveBeenCalled();
        expect(mockCache.setKey).not.toHaveBeenCalled();
      });

      test('key function if returns object with cacheKey, cacheDuration do caching', async () => {
        const fn = async () => 'new-result';
        const duration = 60;
        const key = () => {
          return {
            cacheKey: 'test-key',
            cacheDuration: 100,
          } as CacheKeyDuration;
        };
        mockCache.getKey.mockResolvedValue(JSON.stringify('cached-result'));

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('cached-result');
        expect(mockCache.getKey).toHaveBeenCalled();
        expect(mockCache.getKey).toHaveBeenCalledWith(
          CacheNamespaces.Function_Response,
          'test-key',
        );
        expect(mockCache.setKey).not.toHaveBeenCalled();
      });

      test('key function if returns object with cacheKey, cacheDuration do caching', async () => {
        const fn = async () => 'new-result';
        const duration = 60;
        const key = () => {
          return {
            cacheKey: 'test-key',
            cacheDuration: 100,
          } as CacheKeyDuration;
        };
        mockCache.getKey.mockResolvedValue(null);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('new-result');
        expect(mockCache.getKey).toHaveBeenCalled();
        expect(mockCache.getKey).toHaveBeenCalledWith(
          CacheNamespaces.Function_Response,
          'test-key',
        );
        expect(mockCache.setKey).toHaveBeenCalled();
        expect(mockCache.setKey).toHaveBeenCalledWith(
          CacheNamespaces.Function_Response,
          'test-key',
          JSON.stringify('new-result'),
          100,
        );
      });
    });

    describe('verify error handling', () => {
      test('should run function if getKey throws error', async () => {
        const fn = vi.fn().mockResolvedValue('test-result');
        const duration = 60;
        const key = 'test-key';

        mockCache.getKey.mockRejectedValue('test-error');
        mockCache.setKey.mockResolvedValue(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockCache.getKey).toHaveBeenCalledOnce();
        expect(mockCache.setKey).toHaveBeenCalledOnce();
        expect(fn).toHaveBeenCalledOnce();
      });

      test('should run function if setKey throws error', async () => {
        const fn = vi.fn().mockResolvedValue('test-result');
        const duration = 60;
        const key = 'test-key';

        mockCache.getKey.mockResolvedValue(null);
        mockCache.setKey.mockRejectedValue('test-error');

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockCache.getKey).toHaveBeenCalledOnce();
        expect(mockCache.setKey).toHaveBeenCalledOnce();
        expect(fn).toHaveBeenCalledOnce();
      });

      test('if function throws error, dont run function again', async () => {
        const err = new Error('test-error');
        const fn = vi.fn().mockRejectedValue(err); //() => {throw err};
        const duration = 60;
        const key = 'test-key';

        mockCache.getKey.mockResolvedValue(null);
        mockCache.setKey.mockRejectedValue('test-error');

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        await expect(wrapFn()).to.be.rejectedWith('test-error');

        // expect(result).to.equal('test-result');
        expect(mockCache.getKey).toHaveBeenCalledOnce();
        expect(mockCache.setKey).not.toHaveBeenCalledOnce();
        expect(fn).toHaveBeenCalledOnce();
      });
    });
  });
});
