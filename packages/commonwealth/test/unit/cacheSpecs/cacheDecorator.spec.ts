// import { describe, it, beforeEach, afterEach } from 'mocha';
import chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import { CacheDecorator, FuncExecError } from 'common-common/src/cacheDecorator';
import { RedisCache } from 'common-common/src/redisCache';
import { RedisNamespaces } from 'common-common/src/types';
import { CacheKeyDuration } from 'common-common/src/cacheKeyUtils';

chai.use(chaiAsPromised);

describe('CacheDecorator', () => {
  let cacheDecorator: CacheDecorator;
  let mockRedis: sinon.SinonStubbedInstance<RedisCache>;

  beforeEach(() => {
    cacheDecorator = new CacheDecorator();
    mockRedis = sinon.createStubInstance(RedisCache);
    cacheDecorator.setCache(mockRedis as unknown as RedisCache);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('cacheWrap', () => {
    describe('verify general flow', () => {
      const keys = ['test-key', () => 'test-key', () => {return {cacheKey: 'test-key', cacheDuration: 100}}];
      keys.forEach((key) => {
        it('should cache the function result and return it', async () => {
          const fn = async () => 'test-result';
          const duration = 60;

          mockRedis.getKey.resolves(null);
          mockRedis.setKey.resolves(true);
          mockRedis.isInitialized.returns(true);

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(true, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

          const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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
        const key = () => {return { } as unknown as CacheKeyDuration};
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockRedis.getKey.called).to.be.false;
        expect(mockRedis.setKey.called).to.be.false;
      });

      it('key function if returns object with only cacheKey, skip caching', async () => {
        const fn = async () => 'test-result';
        const duration = 60;
        const key = () => {return { cacheKey: 'test-key' } as unknown as CacheKeyDuration};
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
        const result = await wrapFn();

        expect(result).to.equal('test-result');
        expect(mockRedis.getKey.called).to.be.false;
        expect(mockRedis.setKey.called).to.be.false;
      });

      it('key function if returns object with cacheKey, cacheDuration do caching', async () => {
        const fn = async () => 'new-result';
        const duration = 60;
        const key = () => {return { cacheKey: 'test-key', cacheDuration: 100 } as CacheKeyDuration};
        mockRedis.getKey.resolves(JSON.stringify('cached-result'));
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
        const result = await wrapFn();

        expect(result).to.equal('cached-result');
        expect(mockRedis.getKey.called).to.be.true;
        expect(mockRedis.getKey.calledWith(RedisNamespaces.Function_Response, 'test-key')).to.be.true;
        expect(mockRedis.setKey.called).to.be.false;
      });

      it('key function if returns object with cacheKey, cacheDuration do caching', async () => {
        const fn = async () => 'new-result';
        const duration = 60;
        const key = () => {return { cacheKey: 'test-key', cacheDuration: 100 } as CacheKeyDuration};
        mockRedis.getKey.resolves(null);
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
        const result = await wrapFn();

        expect(result).to.equal('new-result');
        expect(mockRedis.getKey.called).to.be.true;
        expect(mockRedis.getKey.calledWith(RedisNamespaces.Function_Response, 'test-key')).to.be.true;
        expect(mockRedis.setKey.called).to.be.true;
        expect(mockRedis.setKey.calledWith(RedisNamespaces.Function_Response, 'test-key', JSON.stringify('new-result'), 100)).to.be.true;
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

        const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

        mockRedis.getKey.resolves(null);
        mockRedis.setKey.rejects('test-error');
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
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

        mockRedis.getKey.resolves(null);
        mockRedis.setKey.rejects();
        mockRedis.isInitialized.returns(true);

        const wrapFn = cacheDecorator.cacheWrap(false, fn, key, duration, RedisNamespaces.Function_Response);
        await expect(wrapFn()).to.be.rejectedWith('Error: test-error');

        // expect(result).to.equal('test-result');
        expect(mockRedis.getKey.calledOnce).to.be.true;
        expect(mockRedis.setKey.calledOnce).to.be.false; 
        expect(fn.calledOnce).to.be.true;
      });
    });
  });
});
