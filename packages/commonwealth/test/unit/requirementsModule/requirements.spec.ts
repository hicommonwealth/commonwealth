import { assert } from 'chai';
import { Requirement } from '../../../server/util/requirementsModule/requirementsTypes';
import validateGroupMembership, {
  ValidateGroupMembershipResponse,
} from '../../../server/util/requirementsModule/validateGroupMembership';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';
import { ChainNetwork } from '../../../../common-common/src/types';

describe('validateGroupMembership', () => {
  it('should return a valid response', async () => {
    it('should pass basic erc20 check', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '1000',
            source: {
              source_type: 'erc20',
              evm_chain_id: 1,
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
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          return '2000';
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, true);
    });
    it('should pass basic erc721 check', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '1',
            source: {
              source_type: 'erc721',
              evm_chain_id: 1,
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
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          return '2';
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, true);
    });
    it('should pass basic 1155 check', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '1',
            source: {
              source_type: 'erc1155',
              evm_chain_id: 1,
              token_id: '1',
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
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          return '2';
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, true);
    });
    it('should pass basic ethNative check', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '1000',
            source: {
              source_type: 'eth_native',
              evm_chain_id: 1,
            },
          },
        },
      ];
      const tbc = {
        fetchUserBalanceWithChain: async function (
          network,
          userAddress: string,
          chainId: string,
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          return '2000';
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, true);
    });
    it('should fail basic eth_native check', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '2000',
            source: {
              source_type: 'erc20',
              evm_chain_id: 1,
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
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          return '1';
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, false);
      assert.equal(result.messages.length, 1);
    });
    it('should fail basic erc20 check', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '2000',
            source: {
              source_type: 'erc20',
              evm_chain_id: 1,
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
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          return '1000';
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, false);
      assert.equal(result.messages.length, 1);
    });
    it('should pass allowlist', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'allow',
          data: {
            allow: ['0x123456'],
          },
        },
      ];
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(user, requirements);

      assert.equal(result.isValid, true);
    });
    it('should fail allowlist', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'allow',
          data: {
            allow: ['0x1234564545'],
          },
        },
      ];
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(user, requirements);

      assert.equal(result.isValid, false);
      assert.equal(result.messages.length, 1);
    });
    it('should pass multi-requirement check', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '2000',
            source: {
              source_type: 'erc20',
              evm_chain_id: 1,
              contract_address: '0x12345',
            },
          },
        },
        {
          rule: 'threshold',
          data: {
            threshold: '1',
            source: {
              source_type: 'erc721',
              evm_chain_id: 1,
              contract_address: '0x12345',
            },
          },
        },
        {
          rule: 'threshold',
          data: {
            threshold: '1000',
            source: {
              source_type: 'eth_native',
              evm_chain_id: 1,
            },
          },
        },
        {
          rule: 'allow',
          data: {
            allow: ['0x123456'],
          },
        },
      ];
      const tbc = {
        fetchUserBalanceWithChain: async function (
          network,
          userAddress: string,
          chainId: string,
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          if (network == ChainNetwork.ERC20) {
            return '3000';
          } else if (network == ChainNetwork.ERC721) {
            return '2';
          } else if (network == ChainNetwork.Ethereum) {
            return '2000';
          }
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, true);
    });
    it('should fail multi-requirement check with 2 messages', async () => {
      const user: string = '0x123456'
      const requirements: Requirement[] = [
        {
          rule: 'threshold',
          data: {
            threshold: '2000',
            source: {
              source_type: 'erc20',
              evm_chain_id: 1,
              contract_address: '0x12345',
            },
          },
        },
        {
          rule: 'threshold',
          data: {
            threshold: '5',
            source: {
              source_type: 'erc721',
              evm_chain_id: 1,
              contract_address: '0x12345',
            },
          },
        },
        {
          rule: 'threshold',
          data: {
            threshold: '1000',
            source: {
              source_type: 'eth_native',
              evm_chain_id: 1,
            },
          },
        },
        {
          rule: 'allow',
          data: {
            allow: ['0x12345'],
          },
        },
      ];
      const tbc = {
        fetchUserBalanceWithChain: async function (
          network,
          userAddress: string,
          chainId: string,
          contractAddress?: string,
          tokenId?: string
        ): Promise<string> {
          if (network == ChainNetwork.ERC20) {
            return '3000';
          } else if (network == ChainNetwork.ERC721) {
            return '2';
          } else if (network == ChainNetwork.Ethereum) {
            return '2000';
          }
        },
      };
      const result: ValidateGroupMembershipResponse =
        await validateGroupMembership(
          user,
          requirements,
          tbc as TokenBalanceCache
        );

      assert.equal(result.isValid, false);
      assert.equal(result.messages.length, 2);
    });
  });
});
