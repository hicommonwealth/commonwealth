import { describe, expect, it } from 'vitest';
import { computeFullUrl, getCommunityUrl } from './utils';

describe('utils', () => {
  describe('computeFullURL', () => {
    it('with no SERVER_URL', () => {
      expect(computeFullUrl('/foo/bar')).to.be.equal(
        'https://commonwealth.im/foo/bar',
      );
    });
  });

  describe('getCommunityUrl', () => {
    it('basic tests', () => {
      expect(getCommunityUrl('acme')).to.be.equal(
        'https://commonwealth.im/acme',
      );

      expect(getCommunityUrl('my favorite community')).to.be.equal(
        'https://commonwealth.im/my-favorite-community',
      );
    });
  });
});
