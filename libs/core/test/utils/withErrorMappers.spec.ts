import { ErrorMapperFn, withErrorMappers } from '@hicommonwealth/schemas';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('withErrorMappers', () => {
  class FakeNetworkError extends Error {
    public readonly code: string;
    constructor() {
      super('Fake network error!');
      this.code = 'ECONNREFUSED';
    }
  }

  class FakeRateLimitError extends Error {
    constructor() {
      super('Rate limit exceeded. Try again in 5 minutes.');
    }
  }

  class FakeRetriable extends Error {
    public readonly config: { maxRetries: number; backoff?: string };
    constructor(
      message: string,
      config: { maxRetries: number; backoff?: string },
    ) {
      super(message);
      this.config = config;
    }
  }

  const networkErrorMapper: ErrorMapperFn = (err: Error) => {
    const networkErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'ENETDOWN',
    ];
    if (networkErrors.includes((err as any).code)) {
      return new FakeRetriable('Network request failed', {
        maxRetries: 3,
      });
    }
    return null;
  };

  const rateLimitErrorMapper: ErrorMapperFn = (err: Error) => {
    if (err.message.toLowerCase().includes('rate limit')) {
      return new FakeRetriable('Rate limit exceeded', {
        maxRetries: 50,
        backoff: 'exponential',
      });
    }
    return null;
  };

  it('should return resolved value if no mappers and no error thrown', async () => {
    const result = await withErrorMappers([], async () => {
      return 100;
    });
    expect(result).to.eq(100);
  });

  it('should return resolved value if has mappers and no error thrown (single mapper)', async () => {
    const result = await withErrorMappers([networkErrorMapper], async () => {
      return 200;
    });
    expect(result).to.eq(200);
  });

  it('should return resolved value if has mappers and no error thrown (multiple mappers)', async () => {
    const result = await withErrorMappers(
      [networkErrorMapper, rateLimitErrorMapper],
      async () => {
        return 300;
      },
    );
    expect(result).to.eq(300);
  });

  it('should throw mapped error if an applicable mapper is found (single mapper)', async () => {
    let thrownErr: any = null;
    try {
      await withErrorMappers([networkErrorMapper], async () => {
        throw new FakeNetworkError();
      });
    } catch (err) {
      thrownErr = err as Error;
    }
    expect(thrownErr instanceof FakeRetriable).to.be.true;
    expect(thrownErr.message).to.eq('Network request failed');
    expect(thrownErr.config).to.deep.eq({ maxRetries: 3 });
  });

  it('should throw mapped error if an applicable mapper is found (multiple mappers)', async () => {
    let thrownErr: any = null;
    try {
      await withErrorMappers(
        [networkErrorMapper, rateLimitErrorMapper],
        async () => {
          throw new FakeRateLimitError();
        },
      );
    } catch (err) {
      thrownErr = err as Error;
    }
    expect(thrownErr instanceof FakeRetriable).to.be.true;
    expect(thrownErr.message).to.eq('Rate limit exceeded');
    expect(thrownErr.config).to.deep.eq({
      maxRetries: 50,
      backoff: 'exponential',
    });
  });

  it('should throw original error no applicable mapper is found', async () => {
    let thrownErr: any = null;
    try {
      await withErrorMappers(
        [networkErrorMapper, rateLimitErrorMapper],
        async () => {
          throw new Error('bad bad');
        },
      );
    } catch (err) {
      thrownErr = err as Error;
    }
    expect(thrownErr.message).to.eq('bad bad');
  });
});
