import { BalanceSourceType, Requirement } from '@hicommonwealth/shared';

import validateRequirements from 'server/util/requirementsModule/validateRequirements';
import { describe, expect, test } from 'vitest';

describe('validateRequirements', () => {
  test('should pass as valid for ERC20 ContractSource', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.ERC20,
            evm_chain_id: 1,
            contract_address: '0x0000000000000000000000000000000000000000',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x0000000000000000000000000000000000000000'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    expect(err).to.be.null;
  });

  test('should pass as valid for ERC721 ContractSource', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.ERC721,
            evm_chain_id: 1,
            contract_address: '0x0000000000000000000000000000000000000000',
            token_id: '1',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x0000000000000000000000000000000000000000'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    expect(err).to.be.null;
  });

  test('should pass as valid for ERC1155 ContractSource', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.ERC1155,
            evm_chain_id: 1,
            contract_address: '0x0000000000000000000000000000000000000000',
            token_id: '1',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x0000000000000000000000000000000000000000'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    expect(err).to.be.null;
  });

  test('should pass as valid for NativeSource', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.ETHNative,
            evm_chain_id: 1,
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x0000000000000000000000000000000000000000'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    expect(err).to.be.null;
  });

  test('should pass as valid for CosmosSource', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.CosmosNative,
            cosmos_chain_id: 'blah',
            token_symbol: 'BLAH',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x0000000000000000000000000000000000000000'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    expect(err).to.be.null;
  });

  test('should fail for invalid threshold type', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: 1000 as unknown as string, // wrong type
          source: {
            source_type: BalanceSourceType.ERC20,
            evm_chain_id: 1,
            contract_address: '0x0000000000000000000000000000000000000000',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: [],
        },
      },
    ];
    const err = validateRequirements(requirements);
    // @ts-expect-error StrictNullChecks
    expect(err.message).to.not.be.null;
  });

  test('should fail for invalid contract address format', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.ERC20,
            evm_chain_id: 1,
            contract_address: 'nope',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: [],
        },
      },
    ];
    const err = validateRequirements(requirements);
    // @ts-expect-error StrictNullChecks
    expect(err.message).to.include('contract_address');
  });

  test('should fail for invalid evm_chain_id', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.ETHNative,
            evm_chain_id: 'blah' as any,
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: [],
        },
      },
    ];
    const err = validateRequirements(requirements);
    // @ts-expect-error StrictNullChecks
    expect(err.message).to.include('evm_chain_id');
  });

  test('should fail for invalid cosmos_chain_id', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.CosmosNative,
            cosmos_chain_id: 1 as any,
            token_symbol: 'BLAH',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x0000000000000000000000000000000000000000'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    // @ts-expect-error StrictNullChecks
    expect(err.message).to.include('cosmos_chain_id');
  });

  test('should fail for invalid allow address format', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: BalanceSourceType.CosmosNative,
            cosmos_chain_id: 'blah',
            token_symbol: 'BLAH',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x123'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    // @ts-expect-error StrictNullChecks
    expect(err.message).to.include('allow');
  });

  test('should fail for invalid source type', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'bad' as any,
            evm_chain_id: 1,
            contract_address: '0x0000000000000000000000000000000000000000',
          },
        },
      },
      {
        rule: 'allow',
        data: {
          allow: ['0x0000000000000000000000000000000000000000'],
        },
      },
    ];
    const err = validateRequirements(requirements);
    // @ts-expect-error StrictNullChecks
    expect(err.message).to.include('source_type');
  });
});
