import { describe, expect, it } from 'vitest';
import { computeFullURL } from './utils';

describe('utils', () => {
  describe('computeFullURL', () => {
    it('with no SERVER_URL', () => {
      expect(computeFullURL('/foo/bar')).to.be.equal(
        'https://commonwealth.im/foo/bar',
      );
    });
  });
});
