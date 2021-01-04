import chai from 'chai';
import { EventKind, RawEvent, Api } from '../../../src/marlin/types';
import { Enrich } from '../../../src/marlin/filters/enricher';

const { assert } = chai;

const constructEvent = (data: object, section = '', typeDef: string[] = []): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

const blockNumber = 10000;
const api: Api = {} as unknown as Api;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

describe('Marlin Event Enricher Filter Tests', () => {
  // Comp Events
  // Approval
  it('should enrich approval event', async () => {
    const kind = EventKind.Approval;
    const owner = 'fromAddress';
    const spender = 'toAddress';
    const amount = '123';
    const event = constructEvent({
      owner,
      spender,
      amount,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ owner, ],
      data: {
        kind,
        owner,
        spender,
        amount,
      }
    });
  });

  // DelegateChanged
  it('should enrich delegateChanged event', async () => {
    const kind = EventKind.DelegateChanged;
    const fromDelegate = 'previousAddress';
    const toDelegate = 'toAddress';
    const delegator = 'fromAddress';
    const event = constructEvent({
      delegator,
      toDelegate,
      fromDelegate,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ delegator, ],
      data: {
        kind,
        delegator,
        toDelegate,
        fromDelegate,
      }
    });
  });
  // DelegateVotesChanged
  it('should enrich DelegateVotesChanged event', async () => {
    const kind = EventKind.DelegateVotesChanged;
    const delegate = 'me';
    const previousBalance = '123';
    const newBalance = '234';
    // const delegate = 'him',
    const event = constructEvent({
      delegate,
      previousBalance,
      newBalance,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ delegate, ],
      data: {
        kind,
        delegate,
        previousBalance,
        newBalance,
      }
    });
  });

  // Transfer
 it('should enrich Transfer event', async () => {
    const kind = EventKind.Transfer;
    const from = 'me';
    const to = 'them';
    const amount = '234';
    // const delegate = 'him',
    const event = constructEvent({
      from,
      to,
      amount,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ from, ],
      data: {
        kind,
        from,
        to,
        amount,
      }
    });
  });

  // GovernorAlpha Events
  // ProposalCreated
  it('should enrich ProposalCreated event', async () => {
    const kind = EventKind.ProposalCreated;
    const event = constructEvent({
      id: 1,
      proposer: 'sender',
      targets: ['hello'],
      values: ['hello2'],
      signatures: ['hello3'],
      calldatas: ['hello4'],
      startBlock: blockNumber,
      endBlock: blockNumber + 172, // votingPeriod()
      description: 'test description',
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'sender' ],
      data: {
        kind,
        id: 1,
        proposer: 'sender',
        targets: ['hello'],
        values: ['hello2'],
        signatures: ['hello3'],
        calldatas: ['hello4'],
        startBlock: blockNumber,
        endBlock: blockNumber + 172, // votingPeriod()
        description: 'test description',
      }
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
      data: {
        kind,
        id: 1,
      }
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
      data: {
        kind,
        id: 1,
      }
    });
  });

  // ProposalQueued
  it('should enrich ProposalQueued event', async () => {
    const kind = EventKind.ProposalQueued;
    const eta = 123;
    const event = constructEvent({
      id: 1,
      eta,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        id: 1,
        eta,
      }
    });
  });

  // VoteCast
  it('should enrich VoteCast event', async () => {
    const kind = EventKind.VoteCast;
    const voter = 'i voted!';
    const id = 123;
    const support = false;
    const votes = '525600'
    const event = constructEvent({
      proposalId: id,
      voter,
      support,
      votes,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ voter ],
      data: {
        kind,
        id,
        voter,
        support,
        votes,
      }
    });
  });

  // Timelock Events
  // CancelTransaction
  it('should enrich CancelTransaction event', async () => {
    const kind = EventKind.CancelTransaction;
    const txHash = '0xHASH';
    const target = '0xAddress';
    const value = '123456';
    const signature = 'SIGGY';
    const data = 'string data';
    const eta = blockNumber + 173;
    const event = constructEvent({
      txHash,
      target,
      value,
      signature,
      data,
      eta,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ ],
      data: {
        kind,
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      }
    });
  });

  // ExecuteTransaction
  it('should enrich ExecuteTransaction event', async () => {
    const kind = EventKind.ExecuteTransaction;
    const txHash = '0xHASH';
    const target = '0xAddress';
    const value = '123456';
    const signature = 'SIGGY';
    const data = 'string data';
    const eta = blockNumber + 173;
    const event = constructEvent({
      txHash,
      target,
      value,
      signature,
      data,
      eta,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ ],
      data: {
        kind,
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      }
    });
  });

  // NewAdmin
  it('should enrich NewAdmin event', async () => {
    const kind = EventKind.NewAdmin;
    const newAdmin = '0xAddress';
    const event = constructEvent({
      newAdmin
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ newAdmin ],
      data: {
        kind,
        newAdmin
      }
    });
  });

  // NewDelay
  it('should enrich NewDelay event', async () => {
    const kind = EventKind.NewDelay;
    const newDelay = 123;
    const event = constructEvent({
      newDelay
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ ],
      data: {
        kind,
        newDelay
      }
    });
  });

  // NewPendingAdmin
  it('should enrich NewPendingAdmin event', async () => {
    const kind = EventKind.NewPendingAdmin;
    const newPendingAdmin = '0xAddress';
    const event = constructEvent({
      newPendingAdmin
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ ],
      data: {
        kind,
        newPendingAdmin
      }
    });
  });

  // QueueTransaction
  it('should enrich QueueTransaction event', async () => {
    const kind = EventKind.QueueTransaction;
    const txHash = '0xHASH';
    const target = '0xAddress';
    const value = '123456';
    const signature = 'SIGGY';
    const data = 'string data';
    const eta = blockNumber + 173;
    const event = constructEvent({
      txHash,
      target,
      value,
      signature,
      data,
      eta,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ ],
      data: {
        kind,
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      }
    });
  });
});