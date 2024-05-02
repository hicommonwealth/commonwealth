import { withErrorMappers } from '@hicommonwealth/core';
import { expect } from 'chai';

describe('withErrorMappers', () => {
  const funcThatThrowsKnownError = async () => {
    const err = new Error();
    (err as any).code = 'ECONNREFUSED';
    throw new Error('known err');
  };

  const funcThatThrowsUnknownError = async () => {
    throw new Error('bad bad bad');
  };

  const funcThatResolves = async () => {
    return 100;
  };

  it('should return resolved value', async () => {
    const result = withErrorMappers([], async () => {
      return funcThatResolves();
    });
    expect(result).to.eq(100);
  });
});
