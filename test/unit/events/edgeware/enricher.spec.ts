import chai from 'chai';
import {
  AccountId, PropIndex, Hash, ReferendumInfoTo239, BlockNumber,
  ReferendumIndex, TreasuryProposal, Votes
} from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { ITuple } from '@polkadot/types/types';
import { ProposalRecord } from 'edgeware-node-types/dist';

import EdgewareEnricherFunc from '../../../../shared/events/edgeware/filters/enricher';
import { constructFakeApi, constructOption } from './testUtil';

const { assert } = chai;

const blockNumber = 10;
const version = 10;
const api = constructFakeApi({
  bonded: async (stash) => stash !== 'alice-stash'
    ? constructOption()
    : constructOption('alice' as unknown as AccountId),
  publicProps: async () => [
    [ 1, 'hash1', 'charlie' ],
    [ 2, 'hash2', 'dave' ]
  ] as unknown as Vec<ITuple<[PropIndex, Hash, AccountId]>>,
  referendumInfoOf: async (idx) => idx !== 1
    ? constructOption()
    : constructOption({
      end: 20,
      proposalHash: 'hash',
      threshold: 'Supermajorityapproval',
      delay: 10,
    } as unknown as ReferendumInfoTo239),
  dispatchQueue: async () => [
    [ 20, 'hash1', 1 ],
    [ 30, 'hash2', 2 ],
  ] as unknown as Vec<ITuple<[BlockNumber, Hash, ReferendumIndex]>>,
  proposals: (idx) => idx !== 1
    ? constructOption()
    : constructOption({} as unknown as TreasuryProposal),
  voting: (hash) => hash !== 'hash1'
    ? constructOption()
    : constructOption({
      proposer: 'charlie',
      value: 1000,
      beneficiary: 'dave',
      bond: 100,
    } as unknown as Votes),
  proposalOf: (hash) => hash !== 'hash1'
    ? constructOption()
    : constructOption({
      index: 1,
      author: 'charlie',
      stage: 'Voting',
      transition_time: 20,
      title: 'test proposal',
      contents: 'this is a test proposal',
      vote_id: 101,
    } as unknown as ProposalRecord),
});

/* eslint-disable: dot-notation */
describe('Edgeware Event Enricher Filter Tests', () => {
  /** staking events */
  it('should enrich reward event', async () => {

  });
  it('should enrich slash event', async () => {

  });
  it('should enrich bonded event', async () => {

  });
  it('should enrich unbonded event', async () => {

  });

  /** democracy events */
  it('should enrich vote-delegated event', async () => {

  });
  it('should enrich democracy-proposed event', async () => {

  });
  it('should enrich democracy-tabled event', async () => {

  });
  it('should enrich democracy-started event', async () => {

  });
  it('should enrich democracy-passed event', async () => {

  });
  it('should enrich democracy-not-passed event', async () => {

  });
  it('should enrich democracy-cancelled event', async () => {

  });
  it('should enrich democracy-executed event', async () => {

  });

  /** preimage events */
  it('should enrich preimage-noted event', async () => {

  });
  it('should enrich preimage-used event', async () => {

  });
  it('should enrich preimage-invalid event', async () => {

  });
  it('should enrich preimage-missing event', async () => {

  });
  it('should enrich preimage-reaped event', async () => {

  });

  /** treasury events */
  it('should enrich treasury-proposed event', async () => {

  });
  it('should enrich treasury-awarded event', async () => {

  });
  it('should enrich treasury-rejected event', async () => {

  });

  /** elections events */
  it('should enrich election-new-term event', async () => {

  });
  it('should enrich election-empty-term event', async () => {

  });
  it('should enrich election-member-kicked event', async () => {

  });
  it('should enrich election-member-renounced event', async () => {

  });

  /** collective events */
  it('should enrich collective-proposed event', async () => {

  });
  it('should enrich collective-approved event', async () => {

  });
  it('should enrich collective-disapproved event', async () => {

  });
  it('should enrich collective-executed event', async () => {

  });
  it('should enrich collective-member-executed event', async () => {

  });

  /** signaling events */
  it('should enrich signaling-new-proposal event', async () => {

  });
  it('should enrich signaling-commit-started event', async () => {

  });
  it('should enrich signaling-voting-started event', async () => {

  });
  it('should enrich signaling-voting-completed event', async () => {

  });

  /** other */
  it('should not enrich invalid event', (done) => {
    done();
  });
  it('should not enrich with invalid API query', (done) => {
    done();
  });
});
