import chai from 'chai';
import { utils, BigNumber } from 'ethers';

import { EventKind, RawEvent, Api } from '../../../src/chains/compound/types';
import { Enrich } from '../../../src/chains/compound/filters/enricher';

const { assert } = chai;

const constructEvent = (data, rawData?): RawEvent => {
  return {
    args: data,
    data: rawData,
  } as RawEvent;
};

const blockNumber = 10000;
const api: Api = ({} as unknown) as Api;

describe('Compound Event Enricher Filter Tests', () => {
  // Comp Events
  // Approval
  /*
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
      excludeAddresses: [owner],
      data: {
        kind,
        owner,
        spender,
        amount,
      },
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
      excludeAddresses: [delegator],
      data: {
        kind,
        delegator,
        toDelegate,
        fromDelegate,
      },
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
      excludeAddresses: [delegate],
      data: {
        kind,
        delegate,
        previousBalance,
        newBalance,
      },
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
      excludeAddresses: [from],
      data: {
        kind,
        from,
        to,
        amount,
      },
    });
  });
  */

  // GovernorAlpha Events
  // ProposalCreated
  it('should enrich ProposalCreated event', async () => {
    const kind = EventKind.ProposalCreated;
    const address = '0x6E0d01A76C3Cf4288372a29124A26D4353EE51BE';
    const callData = utils.toUtf8Bytes('calldata');
    const rawData = utils.defaultAbiCoder.encode(
      [
        'uint',
        'address',
        'address[]',
        'uint[]',
        'string[]',
        'bytes[]',
        'uint',
        'uint',
        'bytes',
      ],
      [
        1,
        address,
        [address],
        [3],
        ['hello3'],
        [callData],
        blockNumber,
        blockNumber + 172,
        utils.toUtf8Bytes('test description'),
      ]
    );
    const event = constructEvent(
      [
        BigNumber.from(1),
        address,
        [address],
        [3],
        ['hello3'],
        [callData],
        blockNumber,
        blockNumber + 172,
        utils.toUtf8Bytes('test description'),
      ],
      rawData
    );
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [address],
      data: {
        kind,
        id: '0x01',
        proposer: address,
        targets: [address],
        values: ['3'],
        signatures: ['hello3'],
        calldatas: [utils.hexlify(callData)],
        startBlock: blockNumber,
        endBlock: blockNumber + 172, // votingPeriod()
        description: 'test description',
      },
    });
  });

  // ProposalCanceled
  it('should enrich ProposalCanceled event', async () => {
    const kind = EventKind.ProposalCanceled;
    const event = constructEvent([BigNumber.from(1)]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        id: '0x01',
      },
    });
  });

  // ProposalExecuted
  it('should enrich ProposalExecuted event', async () => {
    const kind = EventKind.ProposalExecuted;
    const event = constructEvent([BigNumber.from(1)]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        id: '0x01',
      },
    });
  });

  // ProposalQueued
  it('should enrich ProposalQueued event', async () => {
    const kind = EventKind.ProposalQueued;
    const eta = 123;
    const event = constructEvent([BigNumber.from(1), eta]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        id: '0x01',
        eta,
      },
    });
  });

  // VoteCast
  it('should enrich GovAlpha VoteCast event', async () => {
    const kind = EventKind.VoteCast;
    const voter = 'i voted!';
    const id = BigNumber.from(123);
    const support = false;
    const votes = '525600';
    const event = constructEvent([voter, id, support, votes]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [voter],
      data: {
        kind,
        id: id.toHexString(),
        voter,
        support: 0,
        votes,
        reason: undefined,
      },
    });
  });

  it('should enrich GovBravo VoteCast event', async () => {
    const kind = EventKind.VoteCast;
    const voter = 'i voted!';
    const id = BigNumber.from(123);
    const support = 2;
    const votes = '525600';
    const reason = 'for what?';
    const event = constructEvent([voter, id, support, votes, reason]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [voter],
      data: {
        kind,
        id: id.toHexString(),
        voter,
        support,
        votes,
        reason,
      },
    });
  });

  /*
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
      excludeAddresses: [],
      data: {
        kind,
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      },
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
      excludeAddresses: [],
      data: {
        kind,
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      },
    });
  });

  // NewAdmin
  it('should enrich NewAdmin event', async () => {
    const kind = EventKind.NewAdmin;
    const newAdmin = '0xAddress';
    const event = constructEvent({
      newAdmin,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [newAdmin],
      data: {
        kind,
        newAdmin,
      },
    });
  });

  // NewDelay
  it('should enrich NewDelay event', async () => {
    const kind = EventKind.NewDelay;
    const newDelay = 123;
    const event = constructEvent({
      newDelay,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        newDelay,
      },
    });
  });

  // NewPendingAdmin
  it('should enrich NewPendingAdmin event', async () => {
    const kind = EventKind.NewPendingAdmin;
    const newPendingAdmin = '0xAddress';
    const event = constructEvent({
      newPendingAdmin,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        newPendingAdmin,
      },
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
      excludeAddresses: [],
      data: {
        kind,
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      },
    });
  });
  */
});
