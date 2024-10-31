import { calculateVoteWeight } from 'shared/src/commonProtocol';
import { describe, expect, it } from 'vitest';

describe('commonProtocol', () => {
  describe('calculateVoteWeight', () => {
    it('should calculate voting weight for balance with 1 multiplier', () => {
      {
        const result = calculateVoteWeight('1', 1);
        expect(result!.toString()).eq('1');
      }

      {
        const result = calculateVoteWeight('1000', 1);
        expect(result!.toString()).eq('1000');
      }
    });

    it('should calculate voting weight for balance with > 1 multiplier', () => {
      {
        const result = calculateVoteWeight('1', 3);
        expect(result!.toString()).eq('3');
      }

      {
        const result = calculateVoteWeight('1000', 3);
        expect(result!.toString()).eq('3000');
      }

      {
        const result = calculateVoteWeight('1000000000000000000000000000', 7);
        expect(result!.toString()).eq('7000000000000000000000000000');
      }

      {
        const result = calculateVoteWeight('10', 1.5);
        expect(result!.toString()).eq('15');
      }

      {
        const result = calculateVoteWeight('1000', 1.234);
        expect(result!.toString()).eq('1234');
      }

      {
        const result = calculateVoteWeight('1000', 0.5);
        expect(result!.toString()).eq('500');
      }
    });
  });
});
