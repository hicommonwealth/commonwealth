import chai from 'chai';
import { utils } from 'ethers';

import type {
  RawEvent,
  Api,
} from 'chain-events/src/chain-bases/EVM/aave/types';
import {
  EventKind,
  DelegationType,
} from 'chain-events/src/chain-bases/EVM/aave/types';
import { SupportedNetwork } from '../../../src';
import { Enrich } from 'chain-events/src/chain-bases/EVM/aave/filters/enricher';

const { assert } = chai;

const constructEvent = (data, address?: string): RawEvent => {
  return {
    args: data,
    address,
  } as RawEvent;
};

const blockNumber = 10000;
const api: Api = {} as unknown as Api;

describe('Aave Event Enricher Filter Tests', () => {
  // ProposalCreated
  it('should enrich ProposalCreated event', async () => {
    const kind = EventKind.ProposalCreated;
    const targets = ['0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'];
    const values = ['0'];
    const signatures = ['_setCollateralFactor(address,uint256)'];
    const calldatas = [
      '0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000',
    ];
    const ipfsHash = utils.formatBytes32String('0x123abc');
    const event = constructEvent({
      id: 1,
      creator: 'sender',
      executor: 'executor',
      targets,
      4: values,
      signatures,
      calldatas,
      startBlock: blockNumber,
      endBlock: blockNumber + 172,
      strategy: 'strategy',
      ipfsHash,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['sender'],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        id: 1,
        proposer: 'sender',
        executor: 'executor',
        targets,
        values,
        signatures,
        calldatas,
        startBlock: blockNumber,
        endBlock: blockNumber + 172,
        strategy: 'strategy',
        ipfsHash,
      },
    });
  });

  // ProposalCanceled
  it('should enrich ProposalCanceled event', async () => {
    const kind = EventKind.ProposalCanceled;
    const event = constructEvent({
      id: 1,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        id: 1,
      },
    });
  });

  // ProposalExecuted
  it('should enrich ProposalExecuted event', async () => {
    const kind = EventKind.ProposalExecuted;
    const event = constructEvent({
      id: 1,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        id: 1,
      },
    });
  });

  // ProposalQueued
  it('should enrich ProposalQueued event', async () => {
    const kind = EventKind.ProposalQueued;
    const executionTime = 123;
    const event = constructEvent({
      id: 1,
      executionTime,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        id: 1,
        executionTime,
      },
    });
  });

  // VoteEmitted
  it('should enrich VoteEmitted event', async () => {
    const kind = EventKind.VoteEmitted;
    const voter = 'i voted!';
    const id = 123;
    const support = false;
    const votingPower = '525600';
    const event = constructEvent({
      id,
      voter,
      support,
      votingPower,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [voter],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        id,
        voter,
        support,
        votingPower,
      },
    });
  });

  // DelegateChanged
  it('should enrich DelegateChanged event', async () => {
    const kind = EventKind.DelegateChanged;
    const delegator = 'me';
    const delegatee = 'them';
    const type = DelegationType.VOTING_POWER;
    const tokenAddress = 'tokenaddress';
    const event = constructEvent(
      {
        delegator,
        delegatee,
        delegationType: type,
      },
      tokenAddress
    );
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [delegator],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        tokenAddress,
        delegator,
        delegatee,
        type,
      },
    });
  });

  // DelegatedPowerChanged
  it('should enrich DelegatedPowerChanged event', async () => {
    const kind = EventKind.DelegatedPowerChanged;
    const who = 'me';
    const amount = '123';
    const type = DelegationType.VOTING_POWER;
    const tokenAddress = 'tokenaddress';
    const event = constructEvent(
      {
        user: who,
        amount,
        delegationType: type,
      },
      tokenAddress
    );
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [who],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        tokenAddress,
        who,
        amount,
        type,
      },
    });
  });

  // Transfer
  it('should enrich Transfer event', async () => {
    const kind = EventKind.Transfer;
    const from = 'me';
    const to = 'them';
    const amount = '234';
    const tokenAddress = 'tokenaddress';
    const event = constructEvent(
      {
        from,
        to,
        value: amount,
      },
      tokenAddress
    );
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [from],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        tokenAddress,
        from,
        to,
        amount,
      },
    });
  });

  // Approval
  it('should enrich approval event', async () => {
    const kind = EventKind.Approval;
    const owner = 'fromAddress';
    const spender = 'toAddress';
    const amount = '123';
    const tokenAddress = 'tokenaddress';
    const event = constructEvent(
      {
        owner,
        spender,
        value: amount,
      },
      tokenAddress
    );
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [owner],
      network: SupportedNetwork.Aave,
      data: {
        kind,
        tokenAddress,
        owner,
        spender,
        amount,
      },
    });
  });
});
