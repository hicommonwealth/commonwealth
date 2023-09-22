import { assert, expect } from 'chai';
import { Requirement } from 'server/util/requirementsModule/requirementsTypes';
import validateGroupMembership, {
  validateGroupMembershipResponse,
} from 'server/util/requirementsModule/validateGroupMembership';
import validateRequirements from 'server/util/requirementsModule/validateRequirements';

describe('validateGroupMembership', () => {
  it('should return a valid response', () => {
    const userAddress: string = 'mockUserAddress';
    const requirements: Requirement[] = [];

    const result: validateGroupMembershipResponse = validateGroupMembership(
      userAddress,
      requirements
    );

    assert.equal(result.isValid, true);
  });
});

describe('validateRequirements', () => {
  it('should pass as valid for ContractSource', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'erc20',
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

  it('should pass as valid for NativeSource', () => {
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

  it('should pass as valid for CosmosSource', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'cosmos_native',
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

  it('should fail for invalid threshold type', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: (1000 as unknown) as string, // wrong type
          source: {
            source_type: 'erc20',
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
    expect(err.message).to.not.be.null;
  });

  it('should fail for invalid contract address format', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'erc20',
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
    expect(err.message).to.include('data.source.contract_address');
  });

  it('should fail for invalid evm_chain_id', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'eth_native',
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
    expect(err.message).to.include('data.source.evm_chain_id');
  });

  it('should fail for invalid cosmos_chain_id', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'cosmos_native',
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
    expect(err.message).to.include('data.source.cosmos_chain_id');
  });

  it('should fail for invalid allow address format', () => {
    const requirements: Requirement[] = [
      {
        rule: 'threshold',
        data: {
          threshold: '1000',
          source: {
            source_type: 'cosmos_native',
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
    expect(err.message).to.include('data.allow');
  });

  it('should fail for invalid source type', () => {
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
    expect(err.message).to.include('data.source.source_type');
  });
});
