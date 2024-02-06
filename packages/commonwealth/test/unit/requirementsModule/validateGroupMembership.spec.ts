import { BalanceSourceType, Requirement } from '@hicommonwealth/core';
import { OptionsWithBalances } from '@hicommonwealth/model';
import { expect } from 'chai';
import validateGroupMembership from 'server/util/requirementsModule/validateGroupMembership';

type MockRequirementOptions = {
  threshold: string;
  sourceType: BalanceSourceType;
  chainId: number | string;
  contractAddress: string;
};

function createMockThresholdRequirements(
  options: MockRequirementOptions[],
): Requirement[] {
  return options.map(
    (opt) =>
      ({
        rule: 'threshold',
        data: {
          threshold: opt.threshold,
          source: (() => {
            switch (opt.sourceType) {
              case BalanceSourceType.ERC20:
              case BalanceSourceType.ERC721:
                return {
                  source_type: opt.sourceType,
                  evm_chain_id: opt.chainId,
                  contract_address: opt.contractAddress,
                };
              case BalanceSourceType.ETHNative:
                return {
                  source_type: opt.sourceType,
                  evm_chain_id: opt.chainId,
                };
              case BalanceSourceType.CosmosNative:
                return {
                  source_type: opt.sourceType,
                  cosmos_chain_id: opt.chainId.toString(),
                };
              default:
                throw new Error('invalid mock balance source type');
            }
          })(),
        },
      } as Requirement),
  );
}

describe('validateGroupMembership', () => {
  it('erc20 check', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '1',
        sourceType: BalanceSourceType.ERC20,
        chainId: 1,
        contractAddress: '0x555',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x555',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '2',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
      1,
    );

    expect(result.isValid).to.be.true;
    expect(result.numRequirementsMet).to.equal(1);
  });

  it('erc721 check', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '1',
        sourceType: BalanceSourceType.ERC721,
        chainId: 1,
        contractAddress: '0x555',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x555',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '2',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
      1,
    );

    expect(result.isValid).to.be.true;
    expect(result.numRequirementsMet).to.equal(1);
  });

  it('eth native check', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '1',
        sourceType: BalanceSourceType.ETHNative,
        chainId: 1,
        contractAddress: '0x555',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: ['0x111'],
          sourceOptions: {
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '2',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
      1,
    );

    expect(result.isValid).to.be.true;
    expect(result.numRequirementsMet).to.equal(1);
  });

  it('cosmos native check', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '1',
        sourceType: BalanceSourceType.CosmosNative,
        chainId: 'dope',
        contractAddress: '0x555',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.CosmosNative,
          addresses: ['0x111'],
          sourceOptions: {
            cosmosChainId: 'dope',
          },
        },
        balances: {
          '0x111': '2',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
      1,
    );

    expect(result.isValid).to.be.true;
    expect(result.numRequirementsMet).to.equal(1);
  });

  it('should fail if 0 of 3 requirements met with 3 required', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '5',
        sourceType: BalanceSourceType.ETHNative,
        chainId: 1,
        contractAddress: undefined,
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC721,
        chainId: 1,
        contractAddress: '0x555',
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC20,
        chainId: 1,
        contractAddress: '0x777',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: ['0x111'],
          sourceOptions: {
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '1',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x555',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '1',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x777',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '1',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
      3,
    );

    expect(result.isValid).to.be.false;
    expect(result.numRequirementsMet).to.equal(0);
  });

  it('should succeed if 2 of 3 requirements met with 2 required', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '5',
        sourceType: BalanceSourceType.ETHNative,
        chainId: 1,
        contractAddress: undefined,
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC721,
        chainId: 1,
        contractAddress: '0x555',
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC20,
        chainId: 1,
        contractAddress: '0x777',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: ['0x111'],
          sourceOptions: {
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '6',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x555',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '6',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x777',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '0',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
      1,
    );

    expect(result.isValid).to.be.true;
    expect(result.numRequirementsMet).to.equal(2);
  });

  it('should fail if 2 of 3 requirements met with no num requirements set', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '5',
        sourceType: BalanceSourceType.ETHNative,
        chainId: 1,
        contractAddress: undefined,
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC721,
        chainId: 1,
        contractAddress: '0x555',
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC20,
        chainId: 1,
        contractAddress: '0x777',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: ['0x111'],
          sourceOptions: {
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '6',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x555',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '6',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x777',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '0',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
    );

    expect(result.isValid).to.be.false;
  });

  it('should succeed if 3 of 3 requirements met with no num requirements set', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '5',
        sourceType: BalanceSourceType.ETHNative,
        chainId: 1,
        contractAddress: undefined,
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC721,
        chainId: 1,
        contractAddress: '0x555',
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC20,
        chainId: 1,
        contractAddress: '0x777',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: ['0x111'],
          sourceOptions: {
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '6',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x555',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '6',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x777',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '6',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
      3,
    );

    expect(result.isValid).to.be.true;
    expect(result.numRequirementsMet).to.equal(3);
  });

  it('should fail if balances are equal to threshold', async () => {
    const requirements = createMockThresholdRequirements([
      {
        threshold: '5',
        sourceType: BalanceSourceType.ETHNative,
        chainId: 1,
        contractAddress: undefined,
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC721,
        chainId: 1,
        contractAddress: '0x555',
      },
      {
        threshold: '5',
        sourceType: BalanceSourceType.ERC20,
        chainId: 1,
        contractAddress: '0x777',
      },
    ]);

    const balances: OptionsWithBalances[] = [
      {
        options: {
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: ['0x111'],
          sourceOptions: {
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '5',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x555',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '5',
        },
      },
      {
        options: {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: ['0x111'],
          sourceOptions: {
            contractAddress: '0x777',
            evmChainId: 1,
          },
        },
        balances: {
          '0x111': '5',
        },
      },
    ];

    const result = await validateGroupMembership(
      '0x111',
      requirements,
      balances,
    );

    expect(result.isValid).to.be.false;
  });
});
