import { assert, expect } from 'chai';
import { Requirement } from 'server/util/requirementsModule/requirementsTypes';
import validateGroupMembership, {
  validateGroupMembershipResponse,
} from 'server/util/requirementsModule/validateGroupMembership';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';

describe('validateGroupMembership', () => {
  it('should pass basic erc20 check', async () => {
    const userAddress: string = '0x123456';
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'erc20',
            chain_id: '1',
            contract_address: '0x12345',
          },
        },
      },
    ];
    const tbc = {
      fetchUserBalanceWithChain: async function (
        network,
        userAddress: string,
        chainId: string,
        contractAddress?: string
      ): Promise<string> {
        return '1000';
      },
    };
    const result: validateGroupMembershipResponse =
      await validateGroupMembership(
        userAddress,
        requirements,
        tbc as TokenBalanceCache
      );

    assert.equal(result.isValid, true);
  });
});
