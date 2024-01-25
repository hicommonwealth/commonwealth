/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import { describe, it, beforeEach, afterEach } from 'mocha';
import { RedisNamespaces } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { Activity } from '../../src/daemon';
import { CacheDecorator, RedisCache } from '../../src/redis';
import { CacheKeyDuration } from '../../src/utils';
chai.use(chaiAsPromised);

describe('CacheDecorator', () => {
  let cacheDecorator: CacheDecorator;
  let mockRedis: sinon.SinonStubbedInstance<RedisCache>;

  beforeEach(() => {
    mockRedis = sinon.createStubInstance(RedisCache);
    cacheDecorator = new CacheDecorator(mockRedis);
  });

  afterEach(() => {
    sinon.restore();
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
        it('should cache the function result and return it', async () => {
          const fn = async () => 'test-result';
          const duration = 60;

          mockRedis.getKey.resolves(undefined);
          mockRedis.setKey.resolves(true);
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();
          expect(result).to.equal('test-result');
          expect(mockRedis.getKey.calledOnce).to.be.true;
          expect(mockRedis.setKey.calledOnce).to.be.true;
        });

        it('should return the cached result if it exists', async () => {
          const fn = async () => 'new-result';
          const key = 'test-key';
          const duration = 60;

          mockRedis.getKey.resolves(JSON.stringify('cached-result'));
          mockRedis.setKey.resolves(true);
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('cached-result');
          expect(mockRedis.getKey.calledOnce).to.be.true;
          expect(mockRedis.setKey.called).to.be.false;
        });

        it('should call the function if redis cache not initialized', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 60;

          mockRedis.isInitialized.returns(false);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockRedis.getKey.called).to.be.false;
          expect(mockRedis.setKey.called).to.be.false;
        });

        it('if override is true skip lookup and still set cache', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 60;

          mockRedis.setKey.resolves(true);
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            true,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockRedis.getKey.called).to.be.false;
          expect(mockRedis.setKey.called).to.be.true;
        });

        it('duration null skip caching', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = null;
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration as unknown as number,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockRedis.getKey.called).to.be.false;
          expect(mockRedis.setKey.called).to.be.false;
        });

        it('duration 0 dont skip caching', async () => {
          const fn = async () => 'test-result';
          const key = 'test-key';
          const duration = 0;
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockRedis.getKey.called).to.be.true;
          expect(mockRedis.setKey.called).to.be.true;
        });

        it('result null skip caching', async () => {
          const fn = async () => null;
          const key = 'test-key';
          const duration = 60;
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal(null);
          expect(mockRedis.getKey.called).to.be.true;
          expect(mockRedis.setKey.called).to.be.false;
        });

        it('response 0 from wrapped function allowed to get from cache', async () => {
          const fn = async () => 0;
          const key = 'test-key';
          const duration = 60;
          mockRedis.getKey.resolves('0');
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal(0);
          expect(mockRedis.getKey.called).to.be.true;
          expect(mockRedis.setKey.called).to.be.false;
        });

        it('response 0 from wrapped function allowed to set in cache', async () => {
          const fn = async () => 0;
          const key = 'test-key';
          const duration = 60;
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal(0);
          expect(mockRedis.getKey.called).to.be.true;
          expect(mockRedis.setKey.called).to.be.true;
        });
      });

      [null, () => null].forEach((key) => {
        it('key null skip caching', async () => {
          const fn = async () => 'test-result';
          const duration = 60;
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(
            false,
            fn,
            key as unknown as string,
            duration,
            RedisNamespaces.Function_Response,
          );
          const result = await wrapFn();

          expect(result).to.equal('test-result');
          expect(mockRedis.getKey.called).to.be.false;
          expect(mockRedis.setKey.called).to.be.false;
        });
      });
    });

    describe('verify function returning CacheKeyDuration', () => {
      it('key function if returns object with no cacheKey, skip caching', async () => {
        const fn = async () => 'test-result';
        const duration = 60;
        const keyfn = () => {
          return {} as unknown as CacheKeyDuration;
        };
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          keyfn,
          duration,
          RedisNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockRedis.getKey.called).to.be.false;
        expect(mockRedis.setKey.called).to.be.false;
      });

      it('key function if returns object with only cacheKey, skip caching', async () => {
        const fn = async () => 'test-result';
        const duration = 60;
        const key = () => {
          return { cacheKey: 'test-key' } as unknown as CacheKeyDuration;
        };
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          RedisNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockRedis.getKey.called).to.be.false;
        expect(mockRedis.setKey.called).to.be.false;
      });

      it('key function if returns object with cacheKey, cacheDuration do caching', async () => {
        const fn = async () => 'new-result';
        const duration = 60;
        const key = () => {
          return {
            cacheKey: 'test-key',
            cacheDuration: 100,
          } as CacheKeyDuration;
        };
        mockRedis.getKey.resolves(JSON.stringify('cached-result'));
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          RedisNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('cached-result');
        expect(mockRedis.getKey.called).to.be.true;
        expect(
          mockRedis.getKey.calledWith(
            RedisNamespaces.Function_Response,
            'test-key',
          ),
        ).to.be.true;
        expect(mockRedis.setKey.called).to.be.false;
      });

      it('key function if returns object with cacheKey, cacheDuration do caching', async () => {
        const fn = async () => 'new-result';
        const duration = 60;
        const key = () => {
          return {
            cacheKey: 'test-key',
            cacheDuration: 100,
          } as CacheKeyDuration;
        };
        mockRedis.getKey.resolves(undefined);
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          RedisNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('new-result');
        expect(mockRedis.getKey.called).to.be.true;
        expect(
          mockRedis.getKey.calledWith(
            RedisNamespaces.Function_Response,
            'test-key',
          ),
        ).to.be.true;
        expect(mockRedis.setKey.called).to.be.true;
        expect(
          mockRedis.setKey.calledWith(
            RedisNamespaces.Function_Response,
            'test-key',
            JSON.stringify('new-result'),
            100,
          ),
        ).to.be.true;
      });
    });

    describe('verify error handling', () => {
      it('should run function if getKey throws error', async () => {
        const fn = sinon.stub().resolves('test-result');
        const duration = 60;
        const key = 'test-key';

        mockRedis.getKey.rejects('test-error');
        mockRedis.setKey.resolves(true);
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          RedisNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockRedis.getKey.calledOnce).to.be.true;
        expect(mockRedis.setKey.calledOnce).to.be.true;
        expect(fn.calledOnce).to.be.true;
      });

      it('should run function if setKey throws error', async () => {
        const fn = sinon.stub().resolves('test-result');
        const duration = 60;
        const key = 'test-key';

        mockRedis.getKey.resolves(undefined);
        mockRedis.setKey.rejects('test-error');
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          RedisNamespaces.Function_Response,
        );
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockRedis.getKey.calledOnce).to.be.true;
        expect(mockRedis.setKey.calledOnce).to.be.true;
        expect(fn.calledOnce).to.be.true;
      });

      it('if function throws error, dont run function again', async () => {
        const err = new Error('test-error');
        const fn = sinon.stub().rejects(err); //() => {throw err};
        const duration = 60;
        const key = 'test-key';

        mockRedis.getKey.resolves(undefined);
        mockRedis.setKey.rejects();
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(
          false,
          fn,
          key,
          duration,
          RedisNamespaces.Function_Response,
        );
        await expect(wrapFn()).to.be.rejectedWith('Error: test-error');

        // expect(result).to.equal('test-result');
        expect(mockRedis.getKey.calledOnce).to.be.true;
        expect(mockRedis.setKey.calledOnce).to.be.false;
        expect(fn.calledOnce).to.be.true;
      });
    });

    describe('verify activity helper class', () => {
      const ActivityLabel = 'test-activity';
      const query = async (a, b, c) => {
        console.log('running query with params', a, b, c);
        return a + b + c;
      };

      const query2 = (callCount) => async (a, b, c) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('test-error');
        }
        return query(a, b, c);
      };

      const keyGenerator1 = (a, b, c) => {
        return {
          cacheKey: `${a}-${b}-${c}`,
          cacheDuration: a + b + c,
        } as CacheKeyDuration;
      };

      const keyGenerator2 = (a, b, c) => {
        return `${a}-${b}-${c}`;
      };

      const keyGenerator3 = 'test-key';

      it('should cache the function result and return it', async () => {
        mockRedis.getKey.resolves(undefined);
        mockRedis.setKey.resolves(true);
        mockRedis.isInitialized.returns(true);

        const activityWrapper = new Activity(
          ActivityLabel,
          query,
          keyGenerator1,
          60,
          RedisNamespaces.Function_Response,
          cacheDecorator,
        );
        const wrapFn = activityWrapper.queryWithCache;
        const result = await wrapFn(1, 2, 3);
        expect(result).to.equal(6);
        expect(
          mockRedis.getKey.calledWith(
            RedisNamespaces.Function_Response,
            '1-2-3',
          ),
        ).to.be.true;
        expect(mockRedis.getKey.calledOnce).to.be.true;
        expect(mockRedis.setKey.calledOnce).to.be.true;
        expect(
          mockRedis.setKey.calledWith(
            RedisNamespaces.Function_Response,
            '1-2-3',
            JSON.stringify(6),
            6,
          ),
        ).to.be.true;
      });

      it('should return the cached result if it exists', async () => {
        mockRedis.getKey.resolves(JSON.stringify(8));
        mockRedis.setKey.resolves(true);
        mockRedis.isInitialized.returns(true);

        const activityWrapper = new Activity(
          ActivityLabel,
          query,
          keyGenerator3,
          60,
          RedisNamespaces.Function_Response,
          cacheDecorator,
        );
        const wrapFn = activityWrapper.queryWithCache;
        const result = await wrapFn(1, 2, 3);
        expect(result).to.equal(8);
        expect(mockRedis.getKey.calledOnce).to.be.true;
        expect(
          mockRedis.getKey.calledWith(
            RedisNamespaces.Function_Response,
            'test-key',
          ),
        ).to.be.true;
        expect(mockRedis.setKey.called).to.be.false;
      });

      it('should not lookup cache, and override the cache', async () => {
        mockRedis.setKey.resolves(true);
        mockRedis.isInitialized.returns(true);

        const activityWrapper = new Activity(
          ActivityLabel,
          query,
          keyGenerator2,
          60,
          RedisNamespaces.Function_Response,
          cacheDecorator,
        );
        const wrapFn = activityWrapper.queryWithCacheOverride;
        const result = await wrapFn(1, 2, 3);
        expect(result).to.equal(6);
        expect(mockRedis.getKey.called).to.be.false;
        expect(mockRedis.setKey.calledOnce).to.be.true;
        expect(
          mockRedis.setKey.calledWith(
            RedisNamespaces.Function_Response,
            '1-2-3',
            JSON.stringify(6),
            60,
          ),
        ).to.be.true;
      });
    });
  });
});
