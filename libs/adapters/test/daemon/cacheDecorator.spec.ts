/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Cache, CacheNamespaces, cache, dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { CacheDecorator } from '../../src/redis';
import { CacheKeyDuration } from '../../src/utils';
chai.use(chaiAsPromised);

describe('CacheDecorator', () => {
  let cacheDecorator: CacheDecorator;
  let mockCache: sinon.SinonStubbedInstance<Cache>;

  beforeAll(async () => {
    cacheDecorator = new CacheDecorator();
  });

  afterAll(async () => {
    await dispose()();
  });

  beforeEach(() => {
    sinon.restore();
    mockCache = sinon.stub(cache());
    mockCache.isReady.returns(true);
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

          mockCache.getKey.resolves(undefined);
          mockCache.setKey.resolves(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();
          expect(result).to.equal('test-result');
          expect(mockCache.getKey.calledOnce).to.be.true;
          expect(mockCache.setKey.calledOnce).to.be.true;
        });

        test('should return the cached result if it exists', async () => {
          const fn = async () => 'new-result';
          const key = 'test-key';
          const duration = 60;

          mockCache.getKey.resolves(JSON.stringify('cached-result'));

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('cached-result');
          expect(mockCache.getKey.calledOnce).to.be.true;
          expect(mockCache.setKey.called).to.be.false;
        });

        test('should call the function if redis cache not initialized', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 60;

          mockCache.isReady.returns(false);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockCache.getKey.called).to.be.false;
          expect(mockCache.setKey.called).to.be.false;
        });

        test('if override is true skip lookup and still set cache', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 60;

          mockCache.setKey.resolves(true);

          const wrapFn = cacheDecorator.cacheWrap(
            true,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockCache.getKey.called).to.be.false;
          expect(mockCache.setKey.called).to.be.true;
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
          expect(mockCache.getKey.called).to.be.false;
          expect(mockCache.setKey.called).to.be.false;
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
          expect(mockCache.getKey.called).to.be.true;
          expect(mockCache.setKey.called).to.be.true;
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
          expect(mockCache.getKey.called).to.be.true;
          expect(mockCache.setKey.called).to.be.false;
        });

        test('response 0 from wrapped function allowed to get from cache', async () => {
          const fn = async () => 0;
          const key = 'test-key';
          const duration = 60;
          mockCache.getKey.resolves('0');

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            CacheNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal(0);
          expect(mockCache.getKey.called).to.be.true;
          expect(mockCache.setKey.called).to.be.false;
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
          expect(mockCache.getKey.called).to.be.true;
          expect(mockCache.setKey.called).to.be.true;
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
          expect(mockCache.getKey.called).to.be.false;
          expect(mockCache.setKey.called).to.be.false;
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
        expect(mockCache.getKey.called).to.be.false;
        expect(mockCache.setKey.called).to.be.false;
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
        expect(mockCache.getKey.called).to.be.false;
        expect(mockCache.setKey.called).to.be.false;
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
        mockCache.getKey.resolves(JSON.stringify('cached-result'));

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('cached-result');
        expect(mockCache.getKey.called).to.be.true;
        expect(
          mockCache.getKey.calledWith(
            CacheNamespaces.Function_Response,
            'test-key',
          ),
        ).to.be.true;
        expect(mockCache.setKey.called).to.be.false;
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
        mockCache.getKey.resolves(undefined);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('new-result');
        expect(mockCache.getKey.called).to.be.true;
        expect(
          mockCache.getKey.calledWith(
            CacheNamespaces.Function_Response,
            'test-key',
          ),
        ).to.be.true;
        expect(mockCache.setKey.called).to.be.true;
        expect(
          mockCache.setKey.calledWith(
            CacheNamespaces.Function_Response,
            'test-key',
            JSON.stringify('new-result'),
            100,
          ),
        ).to.be.true;
      });
    });

    describe('verify error handling', () => {
      test('should run function if getKey throws error', async () => {
        const fn = sinon.stub().resolves('test-result');
        const duration = 60;
        const key = 'test-key';

        mockCache.getKey.rejects('test-error');
        mockCache.setKey.resolves(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockCache.getKey.calledOnce).to.be.true;
        expect(mockCache.setKey.calledOnce).to.be.true;
        expect(fn.calledOnce).to.be.true;
      });

      test('should run function if setKey throws error', async () => {
        const fn = sinon.stub().resolves('test-result');
        const duration = 60;
        const key = 'test-key';

        mockCache.getKey.resolves(undefined);
        mockCache.setKey.rejects('test-error');

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockCache.getKey.calledOnce).to.be.true;
        expect(mockCache.setKey.calledOnce).to.be.true;
        expect(fn.calledOnce).to.be.true;
      });

      test('if function throws error, dont run function again', async () => {
        const err = new Error('test-error');
        const fn = sinon.stub().rejects(err); //() => {throw err};
        const duration = 60;
        const key = 'test-key';

        mockCache.getKey.resolves(undefined);
        mockCache.setKey.rejects();

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          CacheNamespaces.Function_Response,
        );
        await expect(wrapFn()).to.be.rejectedWith('test-error');

        // expect(result).to.equal('test-result');
        expect(mockCache.getKey.calledOnce).to.be.true;
        expect(mockCache.setKey.calledOnce).to.be.false;
        expect(fn.calledOnce).to.be.true;
      });
    });
  });
});
