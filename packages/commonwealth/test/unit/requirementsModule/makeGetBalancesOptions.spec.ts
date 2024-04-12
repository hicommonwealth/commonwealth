import { BalanceSourceType } from '@hicommonwealth/core';
import {
  AddressAttributes,
  GetBalancesOptions,
  GroupAttributes,
} from '@hicommonwealth/model';
import { expect } from 'chai';
import { makeGetBalancesOptions } from 'server/util/requirementsModule/makeGetBalancesOptions';

describe('makeGetBalancesOptions', () => {
  it('should return empty array', () => {
    const groups: GroupAttributes[] = [];
    const addresses: AddressAttributes[] = [];
    const result = makeGetBalancesOptions(
      groups,
      addresses.map((a) => a.address),
    );
    expect(Array.isArray(result)).to.be.true;
    expect(result).to.have.length(0);
  });

  it('should build options for batch fetching balances (single address)', () => {
    const groups: GroupAttributes[] = [
      {
        id: 1,
        community_id: 'ethereum',
        metadata: {
          name: '',
          description: '',
        },
        requirements: [
          {
            rule: 'threshold',
            data: {
              threshold: '10',
              source: {
                source_type: BalanceSourceType.ETHNative,
                evm_chain_id: 1,
              },
            },
          },
          {
            rule: 'threshold',
            data: {
              threshold: '100',
              source: {
                source_type: BalanceSourceType.ERC721,
                evm_chain_id: 2,
                contract_address: '0x555',
              },
            },
          },
          {
            rule: 'threshold',
            data: {
              threshold: '1000',
              source: {
                source_type: BalanceSourceType.ERC20,
                evm_chain_id: 3,
                contract_address: '0x777',
              },
            },
          },
          {
            rule: 'threshold',
            data: {
              threshold: '10000',
              source: {
                source_type: BalanceSourceType.CosmosNative,
                cosmos_chain_id: 'dope',
                token_symbol: 'dope',
              },
            },
          },
        ],
      },
    ];
    const addresses: AddressAttributes[] = [
      {
        address: '0x111',
      } as any,
    ];
    const expectedResult: GetBalancesOptions[] = [
      {
        balanceSourceType: BalanceSourceType.ETHNative,
        addresses: ['0x111'],
        sourceOptions: {
          evmChainId: 1,
        },
      },
      {
        balanceSourceType: BalanceSourceType.ERC721,
        addresses: ['0x111'],
        sourceOptions: {
          contractAddress: '0x555',
          evmChainId: 2,
        },
      },
      {
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: ['0x111'],
        sourceOptions: {
          contractAddress: '0x777',
          evmChainId: 3,
        },
      },
      {
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: ['0x111'],
        sourceOptions: {
          cosmosChainId: 'dope',
        },
      },
    ];
    const result = makeGetBalancesOptions(
      groups,
      addresses.map((a) => a.address),
    );
    expect(result).to.have.same.deep.members(expectedResult);
    expect(result);
  });

  it('should build options for batch fetching balances (multiple addresses)', () => {
    const groups: GroupAttributes[] = [
      {
        id: 1,
        community_id: 'ethereum',
        metadata: {
          name: '',
          description: '',
        },
        requirements: [
          {
            rule: 'threshold',
            data: {
              threshold: '10',
              source: {
                source_type: BalanceSourceType.ETHNative,
                evm_chain_id: 1,
              },
            },
          },
          {
            rule: 'threshold',
            data: {
              threshold: '100',
              source: {
                source_type: BalanceSourceType.ERC721,
                evm_chain_id: 2,
                contract_address: '0x555',
              },
            },
          },
          {
            rule: 'threshold',
            data: {
              threshold: '1000',
              source: {
                source_type: BalanceSourceType.ERC20,
                evm_chain_id: 3,
                contract_address: '0x777',
              },
            },
          },
          {
            rule: 'threshold',
            data: {
              threshold: '10000',
              source: {
                source_type: BalanceSourceType.CosmosNative,
                cosmos_chain_id: 'dope',
                token_symbol: 'dope',
              },
            },
          },
        ],
      },
      {
        id: 2,
        community_id: 'ethereum',
        metadata: {
          name: '',
          description: '',
        },
        requirements: [
          // uses duplicate source- should NOT change result
          {
            rule: 'threshold',
            data: {
              threshold: '10',
              source: {
                source_type: BalanceSourceType.ETHNative,
                evm_chain_id: 1,
              },
            },
          },
          // uses new unique source- should add additional object to result
          {
            rule: 'threshold',
            data: {
              threshold: '1000',
              source: {
                source_type: BalanceSourceType.ETHNative,
                evm_chain_id: 2,
              },
            },
          },
        ],
      },
    ];
    const addresses: AddressAttributes[] = [
      {
        address: '0x111',
      } as any,
      {
        address: '0x112',
      } as any,
      {
        address: '0x113',
      } as any,
    ];
    const expectedResult: GetBalancesOptions[] = [
      {
        balanceSourceType: BalanceSourceType.ETHNative,
        addresses: ['0x111', '0x112', '0x113'],
        sourceOptions: {
          evmChainId: 1,
        },
      },
      {
        balanceSourceType: BalanceSourceType.ERC721,
        addresses: ['0x111', '0x112', '0x113'],
        sourceOptions: {
          contractAddress: '0x555',
          evmChainId: 2,
        },
      },
      {
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: ['0x111', '0x112', '0x113'],
        sourceOptions: {
          contractAddress: '0x777',
          evmChainId: 3,
        },
      },
      {
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: ['0x111', '0x112', '0x113'],
        sourceOptions: {
          cosmosChainId: 'dope',
        },
      },
      {
        balanceSourceType: BalanceSourceType.ETHNative,
        addresses: ['0x111', '0x112', '0x113'],
        sourceOptions: {
          evmChainId: 2,
        },
      },
    ];
    const result = makeGetBalancesOptions(
      groups,
      addresses.map((a) => a.address),
    );
    expect(result).to.have.same.deep.members(expectedResult);
    expect(result);
  });
});
