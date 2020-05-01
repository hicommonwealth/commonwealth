/**
 * The purpose of this file is to synthesize "events" from currently-present
 * chain data, such that we don't need to "start fresh". We can "recover" the
 * originating event of any present entity and use that to seed our database
 * when converting from a client-based chain listener setup to a server-based one.
 */

import _ from 'underscore';
import { ApiPromise } from '@polkadot/api';
import { Option, Vec } from '@polkadot/types';
import { BalanceOf, AccountId, Hash, BlockNumber } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { DeriveProposalImage, DeriveCollectiveProposal } from '@polkadot/api-derive/types';
import { ProposalRecord, VoteRecord } from 'edgeware-node-types/dist/types';
import { CWEvent } from '../interfaces';
import {
  SubstrateEventKind,
  ISubstrateDemocracyProposed,
  ISubstrateDemocracyStarted,
  ISubstrateDemocracyPassed,
  ISubstratePreimageNoted,
  ISubstrateTreasuryProposed,
  ISubstrateCollectiveProposed,
  ISubstrateSignalingNewProposal,
  ISubstrateSignalingCommitStarted,
  ISubstrateSignalingVotingStarted,
  ISubstrateSignalingVotingCompleted,
} from './types';

async function fetchDemocracyProposals(api: ApiPromise, blockNumber: number): Promise<CWEvent[]> {
  console.log('Migrating democracy proposals...');
  const publicProps = await api.query.democracy.publicProps();
  const deposits: Array<Option<[BalanceOf, Vec<AccountId>] & Codec>> = await api.queryMulti(
    publicProps.map(([ idx ]) => [ api.query.democracy.depositOf, idx ])
  );
  const proposedEvents = _.zip(publicProps, deposits)
    .map(([ [ idx, hash, proposer ], depositOpt ]): ISubstrateDemocracyProposed => {
      if (!depositOpt.isSome) return null;
      const [ deposit ] = depositOpt.unwrap();
      return {
        kind: SubstrateEventKind.DemocracyProposed,
        proposalIndex: +idx,
        proposalHash: hash.toString(),
        proposer: proposer.toString(),
        deposit: deposit.toString(),
      };
    })
    .filter((e) => !!e);
  console.log(`Found ${proposedEvents.length} democracy proposals!`);
  return proposedEvents.map((data) => ({ blockNumber, data }));
}

async function fetchDemocracyReferenda(api: ApiPromise, blockNumber: number): Promise<CWEvent[]> {
  console.log('Migrating democracy referenda...');
  const activeReferenda = await api.derive.democracy.referendumsActive();
  const startEvents = activeReferenda.map((r) => {
    return {
      kind: SubstrateEventKind.DemocracyStarted,
      referendumIndex: +r.index,
      proposalHash: r.imageHash.toString(),
      voteThreshold: r.status.threshold.toString(),
      endBlock: +r.status.end,
    } as ISubstrateDemocracyStarted;
  });
  const dispatchQueue = await api.derive.democracy.dispatchQueue();
  const passedEvents: Array<ISubstrateDemocracyStarted | ISubstrateDemocracyPassed> = _.flatten(
    dispatchQueue.map(({ index, at, imageHash }) => {
      return [
        {
          kind: SubstrateEventKind.DemocracyStarted,
          referendumIndex: +index,
          proposalHash: imageHash.toString(),

          // fake unknown values for started event
          voteThreshold: '',
          endBlock: 0,
        } as ISubstrateDemocracyStarted,
        {
          kind: SubstrateEventKind.DemocracyPassed,
          referendumIndex: +index,
          dispatchBlock: +at,
        } as ISubstrateDemocracyPassed
      ];
    })
  );
  console.log(`Found ${startEvents.length + passedEvents.length} democracy referenda!`);
  return [ ...startEvents, ...passedEvents ].map((data) => ({ blockNumber, data }));
}

// must pass proposal hashes found in prior events
async function fetchDemocracyPreimages(api: ApiPromise, hashes: string[]): Promise<CWEvent[]> {
  console.log('Migrating preimages...');
  const hashCodecs = hashes.map((hash) => api.createType('Hash', hash));
  const preimages = await api.derive.democracy.preimages(hashCodecs);
  const notedEvents: Array<[ number, ISubstratePreimageNoted ]> = _.zip(hashes, preimages)
    .map(([ hash, preimage ]: [ string, DeriveProposalImage ]) => {
      if (!preimage || !preimage.proposal) return [ 0, null ];
      return [ +preimage.at, {
        kind: SubstrateEventKind.PreimageNoted,
        proposalHash: hash,
        noter: preimage.proposer.toString(),
        preimage: {
          method: preimage.proposal.methodName,
          section: preimage.proposal.sectionName,
          args: preimage.proposal.args.map((arg) => arg.toString()),
        }
      } as ISubstratePreimageNoted ];
    });
  const cwEvents = notedEvents
    .filter(([ blockNumber, data ]) => !!data)
    .map(([ blockNumber, data ]) => ({ blockNumber, data }));
  console.log(`Found ${cwEvents.length} preimages!`);
  return cwEvents;
}

async function fetchTreasuryProposals(api: ApiPromise, blockNumber: number): Promise<CWEvent[]> {
  console.log('Migrating treasury proposals...');
  const proposals = await api.derive.treasury.proposals();
  const proposedEvents = proposals.proposals.map((p) => {
    return {
      kind: SubstrateEventKind.TreasuryProposed,
      proposalIndex: +p.id,
      proposer: p.proposal.proposer.toString(),
      value: p.proposal.value.toString(),
      beneficiary: p.proposal.beneficiary.toString(),
      bond: p.proposal.bond.toString(),
    } as ISubstrateTreasuryProposed;
  });
  console.log(`Found ${proposedEvents.length} treasury proposals!`);
  return proposedEvents.map((data) => ({ blockNumber, data }));
}

async function fetchCollectiveProposals(api: ApiPromise, blockNumber: number): Promise<CWEvent[]> {
  console.log('Migrating collective proposals...');
  const councilProposals = await api.derive.council.proposals();
  let proposals: DeriveCollectiveProposal[];
  if (api.query.technicalCommittee) {
    const technicalCommitteeProposals = await api.derive.technicalCommittee.proposals();
    proposals = [...councilProposals, ...technicalCommitteeProposals];
  } else {
    proposals = councilProposals;
  }
  const proposedEvents = proposals
    .filter((p) => p.proposal && p.votes)
    .map((p) => {
      return {
        kind: SubstrateEventKind.CollectiveProposed,
        proposalIndex: +p.votes.index,
        proposalHash: p.hash.toString(),
        threshold: +p.votes.threshold,
        call: {
          method: p.proposal.methodName,
          section: p.proposal.sectionName,
          args: p.proposal.args.map((arg) => arg.toString()),
        },

        // unknown
        proposer: '',
      } as ISubstrateCollectiveProposed;
    });
  console.log(`Found ${proposedEvents.length} collective proposals!`);
  return proposedEvents.map((data) => ({ blockNumber, data }));
}

async function fetchSignalingProposals(api: ApiPromise, blockNumber: number): Promise<CWEvent[]> {
  console.log('Migrating signaling proposals...');
  if (!api.query.voting || !api.query.signaling) {
    console.log('Found no signaling proposals (wrong chain)!');
    return [];
  }
  // in "prevoting" phase
  const inactiveProposals = await api.query.signaling.inactiveProposals<Vec<[Hash, BlockNumber] & Codec>>();
  // in "commit" or "voting" phase
  const activeProposals = await api.query.signaling.activeProposals<Vec<[Hash, BlockNumber] & Codec>>();
  // in "completed" phase
  const completedProposals = await api.query.signaling.completedProposals<Vec<[Hash, BlockNumber] & Codec>>();
  const proposalHashes = [...inactiveProposals, ...activeProposals, ...completedProposals].map(([ hash ]) => hash);

  // fetch records
  const proposalRecordOpts: Array<Option<ProposalRecord>> = await api.queryMulti(
    proposalHashes.map((hash) => [ api.query.signaling.proposalOf, hash ])
  );
  const proposalRecords: Array<[ ProposalRecord, Hash ]> = _.zip(proposalRecordOpts, proposalHashes)
    .filter(([ p ]: [ Option<ProposalRecord> ]) => p.isSome)
    .map(([ p, hash ]: [ Option<ProposalRecord>, Hash ]) => [ p.unwrap(), hash ]);
  const voteRecordOpts: Array<Option<VoteRecord>> = await api.queryMulti(
    proposalRecords.map(([ p ]) => [ api.query.voting.voteRecords, p.vote_id ])
  );
  const allRecords: Array<[ Hash, ProposalRecord, VoteRecord ]> = _.zip(proposalRecords, voteRecordOpts)
    .filter(([ [ record, hash ], voteOpt ]: [ [ ProposalRecord, Hash ], Option<VoteRecord> ]) => voteOpt.isSome)
    .map(([ [ record, hash ], vote ]: [ [ ProposalRecord, Hash ], Option<VoteRecord> ]) => [
      hash, record, vote.unwrap()
    ]);

  // generate events
  const newProposalEvents = allRecords.map(([ hash, proposal, voting ]) => {
    return {
      kind: SubstrateEventKind.SignalingNewProposal,
      proposer: proposal.author.toString(),
      proposalHash: hash.toString(),
      voteId: voting.id.toString(),
      title: proposal.title.toString(),
      description: proposal.contents.toString(),
      tallyType: voting.data.tally_type.toString(),
      voteType: voting.data.vote_type.toString(),
      choices: voting.outcomes.map((outcome) => outcome.toString()),
    } as ISubstrateSignalingNewProposal;
  });

  // we're not using commit in production, but check anyway
  const commitStartedEvents = allRecords
    .filter(([ hash, proposal ]) => proposal.stage.isCommit)
    .map(([ hash, proposal, voting ]) => {
      return {
        kind: SubstrateEventKind.SignalingCommitStarted,
        proposalHash: hash.toString(),
        voteId: voting.id.toString(),
        endBlock: +proposal.transition_time,
      } as ISubstrateSignalingCommitStarted;
    });

  // assume all voting/completed proposals skipped straight there without commit
  const votingStartedEvents = allRecords
    .filter(([ hash, proposal ]) => proposal.stage.isVoting || proposal.stage.isCompleted)
    .map(([ hash, proposal, voting ]) => {
      return {
        kind: SubstrateEventKind.SignalingVotingStarted,
        proposalHash: hash.toString(),
        voteId: voting.id.toString(),
        endBlock: +proposal.transition_time,
      } as ISubstrateSignalingVotingStarted;
    });

  const completedEvents = allRecords
    .filter(([ hash, proposal ]) => proposal.stage.isCompleted)
    .map(([ hash, proposal, voting ]) => {
      return {
        kind: SubstrateEventKind.SignalingVotingCompleted,
        proposalHash: hash.toString(),
        voteId: voting.id.toString(),
      } as ISubstrateSignalingVotingCompleted;
    });

  const events = [...newProposalEvents, ...commitStartedEvents, ...votingStartedEvents, ...completedEvents];
  // we could plausibly populate the completed events with block numbers, but not necessary
  console.log(`Found ${newProposalEvents.length} signaling proposals!`);
  return events.map((data) => ({ blockNumber, data }));
}

export default async function (
  api: ApiPromise
): Promise<CWEvent[]> {
  const blockNumber = +(await api.rpc.chain.getHeader()).number;

  /** democracy proposals */
  const democracyProposalEvents = await fetchDemocracyProposals(api, blockNumber);

  /** democracy referenda */
  const democracyReferendaEvents = await fetchDemocracyReferenda(api, blockNumber);

  /** democracy preimages */
  const proposalHashes = democracyProposalEvents
    .map((d) => (d.data as ISubstrateDemocracyStarted).proposalHash);
  const referendaHashes = democracyReferendaEvents
    .filter((d) => d.data.kind === SubstrateEventKind.DemocracyStarted)
    .map((d) => (d.data as ISubstrateDemocracyStarted).proposalHash);
  const democracyPreimageEvents = await fetchDemocracyPreimages(api, [ ...proposalHashes, ...referendaHashes ]);

  /** treasury proposals */
  const treasuryProposalEvents = await fetchTreasuryProposals(api, blockNumber);

  /** collective proposals */
  const collectiveProposalEvents = await fetchCollectiveProposals(api, blockNumber);

  /** signaling proposals */
  const signalingProposalEvents = await fetchSignalingProposals(api, blockNumber);

  console.log('Migration complete.');
  return [
    ...democracyProposalEvents,
    ...democracyReferendaEvents,
    ...democracyPreimageEvents,
    ...treasuryProposalEvents,
    ...collectiveProposalEvents,
    ...signalingProposalEvents,
  ];
}
