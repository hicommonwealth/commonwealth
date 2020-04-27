import chai from 'chai';
import {
  AccountId, PropIndex, Hash, ReferendumInfoTo239, BlockNumber,
  ReferendumIndex, TreasuryProposal, Votes, Event
} from '@polkadot/types/interfaces';
import { Vec, bool } from '@polkadot/types';
import { ITuple, TypeDef } from '@polkadot/types/types';
import { ProposalRecord } from 'edgeware-node-types/dist';

import EdgewareEnricherFunc from '../../../../shared/events/edgeware/filters/enricher';
import { constructFakeApi, constructOption } from './testUtil';
import { SubstrateEventKind } from '../../../../shared/events/edgeware/types';

const { assert } = chai;

const blockNumber = 10;
const api = constructFakeApi({
  bonded: async (stash) => stash !== 'alice-stash'
    ? constructOption()
    : constructOption('alice' as unknown as AccountId),
  publicProps: async () => [
    [ 1, 'hash1', 'charlie' ],
    [ 2, 'hash2', 'dave' ]
  ] as unknown as Vec<ITuple<[PropIndex, Hash, AccountId]>>,
  referendumInfoOf: async (idx) => +idx !== 1
    ? constructOption()
    : constructOption({
      end: 20,
      hash: 'hash',
      threshold: 'Supermajorityapproval',
      delay: 10,
    } as unknown as ReferendumInfoTo239),
  dispatchQueue: async () => [
    [ 20, 'hash1', 1 ],
    [ 30, 'hash2', 2 ],
  ] as unknown as Vec<ITuple<[BlockNumber, Hash, ReferendumIndex]>>,
  proposals: (idx) => +idx !== 1
    ? constructOption()
    : constructOption({
      proposer: 'alice',
      value: 1000,
      beneficiary: 'bob',
    } as unknown as TreasuryProposal),
  voting: (hash) => hash.toString() !== 'hash'
    ? constructOption()
    : constructOption({
      index: 1,
      threshold: 3,
      ayes: [ 'alice', 'bob' ],
      nays: [ 'charlie', 'dave' ],
      end: 100,
    } as unknown as Votes),
  proposalOf: (hash) => hash.toString() !== 'hash'
    ? constructOption()
    : constructOption({
      index: 1,
      author: 'alice',
      stage: 'Voting',
      transition_time: 20,
      title: 'test proposal',
      contents: 'this is a test proposal',
      vote_id: 101,
    } as unknown as ProposalRecord),
});

class FakeEventData extends Array {
  public readonly typeDef: TypeDef[];
  constructor(typeDef: string[], ...values) {
    super(...values);
    this.typeDef = typeDef.map((type) => ({ type })) as TypeDef[];
  }
}

const constructEvent = (data: any[], typeDef: string[] = []): Event => {
  return {
    data: new FakeEventData(typeDef, ...data),
  } as Event;
};

const constructBool = (b: boolean): bool => {
  return { isTrue: b === true, isFalse: b === false, isEmpty: false } as bool;
};

/* eslint-disable: dot-notation */
describe('Edgeware Event Enricher Filter Tests', () => {
  /** staking events */
  it('should enrich edgeware/old reward event', async () => {
    const kind = SubstrateEventKind.Reward;
    const event = constructEvent([ 10000, 5 ], [ 'Balance', 'Balance' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        amount: '10000',
      }
    });
  });
  it('should enrich new reward event', async () => {
    const kind = SubstrateEventKind.Reward;
    const event = constructEvent([ 'Alice', 10000 ], [ 'AccountId', 'Balance' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: [ 'Alice' ],
      data: {
        kind,
        validator: 'Alice',
        amount: '10000',
      }
    });
  });
  it('should enrich slash event', async () => {
    const kind = SubstrateEventKind.Slash;
    const event = constructEvent([ 'Alice', 10000 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: [ 'Alice' ],
      data: {
        kind,
        validator: 'Alice',
        amount: '10000',
      }
    });
  });
  it('should enrich bonded event', async () => {
    const kind = SubstrateEventKind.Bonded;
    const event = constructEvent([ 'alice-stash', 10000 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: [ 'alice-stash' ],
      data: {
        kind,
        stash: 'alice-stash',
        amount: '10000',
        controller: 'alice',
      }
    });
  });
  it('should enrich unbonded event', async () => {
    const kind = SubstrateEventKind.Unbonded;
    const event = constructEvent([ 'alice-stash', 10000 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: [ 'alice-stash' ],
      data: {
        kind,
        stash: 'alice-stash',
        amount: '10000',
        controller: 'alice',
      }
    });
  });

  /** democracy events */
  it('should enrich vote-delegated event', async () => {
    const kind = SubstrateEventKind.VoteDelegated;
    const event = constructEvent([ 'delegator', 'target' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: [ 'target' ],
      data: {
        kind,
        who: 'delegator',
        target: 'target',
      }
    });
  });
  it('should enrich democracy-proposed event', async () => {
    const kind = SubstrateEventKind.DemocracyProposed;
    const event = constructEvent([ '1', 1000 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'charlie' ],
      data: {
        kind,
        proposalIndex: 1,
        proposalHash: 'hash1',
        deposit: '1000',
        proposer: 'charlie',
      }
    });
  });
  it('should enrich democracy-tabled event', async () => {
    const kind = SubstrateEventKind.DemocracyTabled;
    const event = constructEvent([ '1', 1000 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalIndex: 1,
      }
    });
  });
  it('should enrich democracy-started event', async () => {
    const kind = SubstrateEventKind.DemocracyStarted;
    const event = constructEvent([ '1', 'Supermajorityapproval' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        referendumIndex: 1,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
        endBlock: 20,
      }
    });
  });
  it('should enrich democracy-passed event', async () => {
    const kind = SubstrateEventKind.DemocracyPassed;
    const event = constructEvent([ '1' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        referendumIndex: 1,
        dispatchBlock: 20,
      }
    });
  });
  it('should enrich democracy-not-passed event', async () => {
    const kind = SubstrateEventKind.DemocracyNotPassed;
    const event = constructEvent([ '1' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        referendumIndex: 1,
      }
    });
  });
  it('should enrich democracy-cancelled event', async () => {
    const kind = SubstrateEventKind.DemocracyCancelled;
    const event = constructEvent([ '1' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        referendumIndex: 1,
      }
    });
  });
  it('should enrich democracy-executed event', async () => {
    const kind = SubstrateEventKind.DemocracyExecuted;
    const event = constructEvent([ '1', constructBool(false) ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        referendumIndex: 1,
        executionOk: false,
      }
    });
  });

  /** preimage events */
  it('should enrich preimage-noted event', async () => {
    const kind = SubstrateEventKind.PreimageNoted;
    const event = constructEvent([ 'hash', 'alice', 100 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'alice' ],
      data: {
        kind,
        proposalHash: 'hash',
        noter: 'alice',
      }
    });
  });
  it('should enrich preimage-used event', async () => {
    const kind = SubstrateEventKind.PreimageUsed;
    const event = constructEvent([ 'hash', 'alice', 100 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        noter: 'alice',
      }
    });
  });
  it('should enrich preimage-invalid event', async () => {
    const kind = SubstrateEventKind.PreimageInvalid;
    const event = constructEvent([ 'hash', '1' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        referendumIndex: 1,
      }
    });
  });
  it('should enrich preimage-missing event', async () => {
    const kind = SubstrateEventKind.PreimageMissing;
    const event = constructEvent([ 'hash', '1' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        referendumIndex: 1,
      }
    });
  });
  it('should enrich preimage-reaped event', async () => {
    const kind = SubstrateEventKind.PreimageReaped;
    const event = constructEvent([ 'hash', 'alice', 100, 'bob' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'bob' ],
      data: {
        kind,
        proposalHash: 'hash',
        noter: 'alice',
        reaper: 'bob',
      }
    });
  });

  /** treasury events */
  it('should enrich treasury-proposed event', async () => {
    const kind = SubstrateEventKind.TreasuryProposed;
    const event = constructEvent([ '1' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'alice' ],
      data: {
        kind,
        proposalIndex: 1,
        proposer: 'alice',
        value: '1000',
        beneficiary: 'bob',
      }
    });
  });
  it('should enrich treasury-awarded event', async () => {
    const kind = SubstrateEventKind.TreasuryAwarded;
    const event = constructEvent([ '1', 1000, 'bob' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalIndex: 1,
        value: '1000',
        beneficiary: 'bob',
      }
    });
  });
  it('should enrich treasury-rejected event', async () => {
    const kind = SubstrateEventKind.TreasuryRejected;
    const event = constructEvent([ '1', 100 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalIndex: 1,
      }
    });
  });

  /** elections events */
  it('should enrich election-new-term event', async () => {
    const kind = SubstrateEventKind.ElectionNewTerm;
    const event = constructEvent([ [ [ 'alice', 10 ], [ 'bob', 20] ] ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        newMembers: [ 'alice', 'bob' ],
      }
    });
  });
  it('should enrich election-empty-term event', async () => {
    const kind = SubstrateEventKind.ElectionEmptyTerm;
    const event = constructEvent([ ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
      }
    });
  });
  it('should enrich election-member-kicked event', async () => {
    const kind = SubstrateEventKind.ElectionMemberKicked;
    const event = constructEvent([ 'alice' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        who: 'alice',
      }
    });
  });
  it('should enrich election-member-renounced event', async () => {
    const kind = SubstrateEventKind.ElectionMemberRenounced;
    const event = constructEvent([ 'alice' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        who: 'alice',
      }
    });
  });

  /** collective events */
  it('should enrich collective-proposed event', async () => {
    const kind = SubstrateEventKind.CollectiveProposed;
    const event = constructEvent([ 'alice', '1', 'hash', '3' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'alice' ],
      data: {
        kind,
        proposer: 'alice',
        proposalIndex: 1,
        proposalHash: 'hash',
        threshold: 3,
      }
    });
  });
  it('should enrich collective-approved event', async () => {
    const kind = SubstrateEventKind.CollectiveApproved;
    const event = constructEvent([ 'hash' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        proposalIndex: 1,
        threshold: 3,
        ayes: [ 'alice', 'bob' ],
        nays: [ 'charlie', 'dave' ],
      }
    });
  });
  it('should enrich collective-disapproved event', async () => {
    const kind = SubstrateEventKind.CollectiveDisapproved;
    const event = constructEvent([ 'hash' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        proposalIndex: 1,
        threshold: 3,
        ayes: [ 'alice', 'bob' ],
        nays: [ 'charlie', 'dave' ],
      }
    });
  });
  it('should enrich collective-executed event', async () => {
    const kind = SubstrateEventKind.CollectiveExecuted;
    const event = constructEvent([ 'hash', constructBool(true) ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        executionOk: true,
      }
    });
  });
  it('should enrich collective-member-executed event', async () => {
    const kind = SubstrateEventKind.CollectiveExecuted;
    const event = constructEvent([ 'hash', constructBool(false) ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        executionOk: false,
      }
    });
  });

  /** signaling events */
  it('should enrich signaling-new-proposal event', async () => {
    const kind = SubstrateEventKind.SignalingNewProposal;
    const event = constructEvent([ 'alice', 'hash' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'alice' ],
      data: {
        kind,
        proposer: 'alice',
        proposalHash: 'hash',
        voteId: '101',
      }
    });
  });
  it('should enrich signaling-commit-started event', async () => {
    const kind = SubstrateEventKind.SignalingCommitStarted;
    const event = constructEvent([ 'hash', '101', '20' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        voteId: '101',
        endBlock: 20,
      }
    });
  });
  it('should enrich signaling-voting-started event', async () => {
    const kind = SubstrateEventKind.SignalingVotingStarted;
    const event = constructEvent([ 'hash', '101', '20' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        voteId: '101',
        endBlock: 20,
      }
    });
  });
  it('should enrich signaling-voting-completed event', async () => {
    const kind = SubstrateEventKind.SignalingVotingCompleted;
    const event = constructEvent([ 'hash', '101' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalHash: 'hash',
        voteId: '101',
      }
    });
  });

  /** TreasuryReward events */
  it('should enrich treasury-reward-minted-v1 event', async () => {
    const kind = SubstrateEventKind.TreasuryRewardMinting;
    const event = constructEvent([ 1000, 100, 10 ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        pot: '1000',
        reward: '100',
      }
    });
  });
  it('should enrich treasury-reward-minted-v2 event', async () => {
    const kind = SubstrateEventKind.TreasuryRewardMintingV2;
    const event = constructEvent([ 1000, 10, 'pot' ]);
    const result = await EdgewareEnricherFunc(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        pot: '1000',
        potAddress: 'pot',
      }
    });
  });

  /** other */
  it('should not enrich invalid event', (done) => {
    const kind = 'invalid-event' as SubstrateEventKind;
    const event = constructEvent([ ]);
    EdgewareEnricherFunc(api, blockNumber, kind, event)
      .then((v) => done(new Error('should not permit invalid event')))
      .catch(() => done());
  });
  it('should not enrich with invalid API query', (done) => {
    const kind = SubstrateEventKind.Bonded;
    const event = constructEvent([ 'alice-not-stash', 10000 ]);
    EdgewareEnricherFunc(api, blockNumber, kind, event)
      .then((v) => done(new Error('should not permit invalid API result')))
      .catch(() => done());
  });
});
