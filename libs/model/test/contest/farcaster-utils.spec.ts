import {
  buildFarcasterContentUrl,
  parseFarcasterContentUrl,
} from '@hicommonwealth/model';
import { expect } from 'chai';
import { describe, test } from 'vitest';

describe('farcaster utils', () => {
  describe('buildFarcasterContentUrl', () => {
    test('without fid', () => {
      const parentCastHash = '0x123';
      const replyCastHash = '0x234';
      const result = buildFarcasterContentUrl(parentCastHash, replyCastHash);
      expect(result).to.eq('/farcaster/0x123/0x234');
    });

    test(' with fid', () => {
      const parentCastHash = '0x123';
      const replyCastHash = '0x234';
      const fid = 567;
      const result = buildFarcasterContentUrl(
        parentCastHash,
        replyCastHash,
        fid,
      );
      expect(result).to.eq('/farcaster/0x123/0x234?fid=567');
    });
  });

  describe('parseFarcasterContentUrl', () => {
    test(' without fid', () => {
      const result = parseFarcasterContentUrl('/farcaster/0x123/0x234');
      expect(result.parentCastHash).to.eq('0x123');
      expect(result.replyCastHash).to.eq('0x234');
      expect(result.fid).to.eq(null);
    });

    test('with fid', () => {
      const result = parseFarcasterContentUrl('/farcaster/0x123/0x234?fid=567');
      expect(result.parentCastHash).to.eq('0x123');
      expect(result.replyCastHash).to.eq('0x234');
      expect(result.fid).to.eq(567);
    });
  });
});
