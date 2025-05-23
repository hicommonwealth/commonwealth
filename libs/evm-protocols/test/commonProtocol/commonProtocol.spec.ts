import { describe, expect, it } from 'vitest';
import { calculateVoteWeight } from '../../src/common-protocol';

describe('commonProtocol', () => {
  describe('calculateVoteWeight', () => {
    it('should calculate voting weight for balance with 1 multiplier', () => {
      {
        const result = calculateVoteWeight('1', 1);
        expect(result!).eq(BigInt('1'));
      }

      {
        const result = calculateVoteWeight('1000', 1);
        expect(result!).eq(BigInt('1000'));
      }
    });

    it('should calculate voting weight for balance with > 1 multiplier', () => {
      {
        const result = calculateVoteWeight('1', 3);
        expect(result!).eq(BigInt('3'));
      }

      {
        const result = calculateVoteWeight('1000', 3);
        expect(result!).eq(BigInt('3000'));
      }

      {
        const result = calculateVoteWeight('1000000000000000000000000000', 7);
        expect(result!).eq(BigInt('7000000000000000000000000000'));
      }

      {
        const result = calculateVoteWeight('10', 1.5);
        expect(result!).eq(BigInt('15'));
      }

      {
        const result = calculateVoteWeight('1000', 1.234);
        expect(result!).eq(BigInt('1234'));
      }

      {
        const result = calculateVoteWeight('1000', 0.5);
        expect(result!).eq(BigInt('500'));
      }
    });
  });
});
