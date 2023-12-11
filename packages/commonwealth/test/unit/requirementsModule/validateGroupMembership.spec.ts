import { expect } from 'chai';
import {
  BalanceSourceType,
  Requirement,
} from 'server/util/requirementsModule/requirementsTypes';
import validateGroupMembership, {
  ValidateGroupMembershipResponse,
} from 'server/util/requirementsModule/validateGroupMembership';
import { ChainNetwork } from '../../../../common-common/src/types';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';

function createMockRequirements(thresholds: string[]): Requirement[] {
  return [
    {
      rule: 'threshold',
      data: {
        threshold: thresholds[0] || '0',
        source: {
          source_type: BalanceSourceType.ERC20,
          evm_chain_id: 1,
          contract_address: '0x12345',
        },
      },
    },
    {
      rule: 'threshold',
      data: {
        threshold: thresholds[1] || '0',
        source: {
          source_type: BalanceSourceType.ERC721,
          evm_chain_id: 1,
          contract_address: '0x12345',
        },
      },
    },
    {
      rule: 'threshold',
      data: {
        threshold: thresholds[2] || '0',
        source: {
          source_type: BalanceSourceType.ETHNative,
          evm_chain_id: 1,
        },
      },
    },
  ];
}

function createMockTBC(thresholds: string[]) {
  return {
    fetchUserBalanceWithChain: async function (
      network,
      userAddress: string,
      chainId: string,
      contractAddress?: string,
    ): Promise<string> {
      if (network == ChainNetwork.ERC20) {
        return thresholds[0] || '0';
      } else if (network == ChainNetwork.ERC721) {
        return thresholds[1] || '0';
      } else if (network == ChainNetwork.Ethereum) {
        return thresholds[2] || '0';
      }
    },
  } as TokenBalanceCache;
}

describe('validateGroupMembership', () => {
  it('should fail if 0 of 3 requirements met with 3 required', async () => {
    const tbc = createMockTBC(['0', '0', '0']);
    const requirements = createMockRequirements(['1', '1', '1']);
    const result: ValidateGroupMembershipResponse =
      await validateGroupMembership(
        '0x123',
        requirements,
        tbc as TokenBalanceCache,
        3,
      );

    expect(result.numRequirementsMet).to.equal(0);
    expect(result.isValid).to.equal(false);
  });

  it('should succeed if 2 of 3 requirements met with 2 required', async () => {
    const tbc = createMockTBC(['2', '2', '0']);
    const requirements = createMockRequirements(['1', '1', '1']);
    const result: ValidateGroupMembershipResponse =
      await validateGroupMembership(
        '0x123',
        requirements,
        tbc as TokenBalanceCache,
        2,
      );

    expect(result.numRequirementsMet).to.equal(2);
    expect(result.isValid).to.equal(true);
  });

  it('should fail if 2 of 3 requirements met with no num requirements set', async () => {
    const tbc = createMockTBC(['2', '2', '0']);
    const requirements = createMockRequirements(['1', '1', '1']);
    const result: ValidateGroupMembershipResponse =
      await validateGroupMembership(
        '0x123',
        requirements,
        tbc as TokenBalanceCache,
      );
    expect(result.isValid).to.equal(false);
  });

  it('should succeed if 3 of 3 requirements met with no num requirements set', async () => {
    const tbc = createMockTBC(['2', '2', '2']);
    const requirements = createMockRequirements(['1', '1', '1']);
    const result: ValidateGroupMembershipResponse =
      await validateGroupMembership(
        '0x123',
        requirements,
        tbc as TokenBalanceCache,
      );
    expect(result.isValid).to.equal(true);
  });

  it('should fail if balances are equal to threshold', async () => {
    const tbc = createMockTBC(['1', '1', '1']);
    const requirements = createMockRequirements(['1', '1', '1']);
    const result: ValidateGroupMembershipResponse =
      await validateGroupMembership(
        '0x123',
        requirements,
        tbc as TokenBalanceCache,
      );
    expect(result.isValid).to.equal(false);
  });
});
